from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_get, cache_set
from app.core.database import get_db
from app.models.news_analysis import NewsAnalysis, PortfolioItem
from app.models.stock import Stock
from app.services.news_service import fetch_news_for_stock
from app.services.ai_service import analyze_news
from app.services.price_service import fetch_price_history, fetch_stock_price, search_stocks

router = APIRouter(prefix="/api/v1/stocks", tags=["stocks"])


@router.get("/search")
async def search(q: str, market: str = "ALL", limit: int = 10, db: AsyncSession = Depends(get_db)):
    if len(q) < 2:
        raise HTTPException(status_code=400, detail="검색어는 2자 이상 입력하세요.")

    cache_key = f"search:{q}:{market}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    results = search_stocks(q, market)[:limit]

    # in_portfolio 필드 추가
    portfolio_result = await db.execute(
        select(Stock.ticker).join(PortfolioItem, PortfolioItem.stock_id == Stock.id)
    )
    portfolio_tickers = {row[0] for row in portfolio_result.all()}
    for r in results:
        r["in_portfolio"] = r.get("ticker", "") in portfolio_tickers

    response = {"data": results, "meta": {"total": len(results), "query": q}}
    await cache_set(cache_key, response, 300)  # 5분
    return response


@router.get("/{ticker}")
async def get_stock(ticker: str, market: str = "KR"):
    cache_key = f"price:{ticker}:{market}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    price = fetch_stock_price(ticker, market)
    if not price:
        raise HTTPException(status_code=404, detail="종목 정보를 찾을 수 없습니다.")

    result = {"data": {"ticker": ticker, "market": market, **price}}
    await cache_set(cache_key, result, 900)  # 15분
    return result


@router.get("/{ticker}/price")
async def get_price_history(ticker: str, market: str = "KR", period: str = "1m"):
    if period not in ("1d", "1w", "1m", "3m"):
        raise HTTPException(status_code=400, detail="period는 1d/1w/1m/3m 중 하나입니다.")

    cache_key = f"chart:{ticker}:{market}:{period}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    candles = fetch_price_history(ticker, market, period)
    result = {"data": {"ticker": ticker, "period": period, "candles": candles}}
    await cache_set(cache_key, result, 3600)  # 1시간
    return result


@router.get("/{ticker}/news")
async def get_news_analysis(ticker: str, market: str = "KR", db: AsyncSession = Depends(get_db)):
    today = date.today()
    cache_key = f"analysis:{ticker}:{today.isoformat()}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    # DB에서 오늘 분석 조회
    stock_result = await db.execute(select(Stock).where(Stock.ticker == ticker))
    stock = stock_result.scalar_one_or_none()

    if stock:
        analysis_result = await db.execute(
            select(NewsAnalysis)
            .where(NewsAnalysis.stock_id == stock.id, NewsAnalysis.analysis_date == today)
        )
        analysis = analysis_result.scalar_one_or_none()

        if analysis:
            data = {
                "ticker": ticker,
                "analysis_date": today.isoformat(),
                "sentiment": analysis.sentiment,
                "sentiment_score": float(analysis.sentiment_score),
                "summary": analysis.summary,
                "reasoning": analysis.reasoning,
                "news_sources": analysis.news_sources,
                "news_count": analysis.news_count,
                "updated_at": analysis.created_at.isoformat(),
            }
            result = {"data": data}
            await cache_set(cache_key, result, 86400)  # 24시간
            return result

    # DB 없으면 실시간 수집 + 분석
    stock_name = stock.name if stock else ticker
    articles = fetch_news_for_stock(stock_name, ticker, market)
    ai_result = analyze_news(stock_name, ticker, articles)

    data = {
        "ticker": ticker,
        "analysis_date": today.isoformat(),
        "sentiment": ai_result["sentiment"],
        "sentiment_score": ai_result["sentiment_score"],
        "summary": ai_result["summary"],
        "reasoning": ai_result.get("reasoning", ""),
        "news_sources": articles,
        "news_count": len(articles),
        "updated_at": today.isoformat() + "T00:00:00Z",
    }
    result = {"data": data}
    await cache_set(cache_key, result, 3600)
    return result
