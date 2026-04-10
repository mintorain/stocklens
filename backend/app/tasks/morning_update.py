"""평일 08:00 / 15:30 자동 업데이트 태스크"""
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_delete, cache_set
from app.core.database import AsyncSessionLocal
from app.models.news_analysis import NewsAnalysis, PortfolioItem
from app.models.price import IndexSnapshot
from app.models.stock import Stock
from app.services.ai_service import analyze_news, generate_market_summary
from app.services.news_service import fetch_news_for_stock
from app.services.price_service import fetch_index_data, fetch_stock_price


async def run_full_update():
    """지수 + 관심 종목 주가 + AI 뉴스 분석 일괄 갱신"""
    today = date.today()

    async with AsyncSessionLocal() as db:
        # 1. 지수 데이터 수집 및 캐시 갱신
        indices = await _update_indices(db, today)

        # 2. 시장 요약 생성 (지수 데이터 기반)
        if indices:
            summary = generate_market_summary(indices, today.isoformat())
            await cache_set("market:summary", {"summary": summary, "date": today.isoformat()}, 86400)

        # 3. 관심 종목 분석 갱신
        await _update_portfolio_analyses(db, today)

        await db.commit()


async def _update_indices(db: AsyncSession, today: date) -> list[dict]:
    index_data = fetch_index_data()

    for idx in index_data:
        snapshot = IndexSnapshot(
            index_code=idx["code"],
            index_name=idx["name"],
            snapshot_date=today,
            value=idx["value"],
            prev_close=idx["prev_close"],
            change=idx["change"],
            change_pct=idx["change_pct"],
        )
        db.add(snapshot)

    await cache_delete("indices:all")
    return index_data


async def _update_portfolio_analyses(db: AsyncSession, today: date):
    result = await db.execute(
        select(PortfolioItem).join(Stock).options()
    )
    items = result.scalars().all()

    for item in items:
        stock_result = await db.execute(select(Stock).where(Stock.id == item.stock_id))
        stock = stock_result.scalar_one_or_none()
        if not stock:
            continue

        # 이미 오늘 분석이 있으면 스킵
        existing = await db.execute(
            select(NewsAnalysis).where(
                NewsAnalysis.stock_id == stock.id,
                NewsAnalysis.analysis_date == today,
            )
        )
        if existing.scalar_one_or_none():
            continue

        # 뉴스 수집 + AI 분석
        articles = fetch_news_for_stock(stock.name, stock.ticker, stock.market)
        ai_result = analyze_news(stock.name, stock.ticker, articles)

        analysis = NewsAnalysis(
            stock_id=stock.id,
            analysis_date=today,
            sentiment=ai_result["sentiment"],
            sentiment_score=ai_result["sentiment_score"],
            summary=ai_result["summary"],
            reasoning=ai_result.get("reasoning", ""),
            news_sources=articles,
            news_count=len(articles),
            model_used=ai_result.get("model_used"),
            tokens_used=ai_result.get("tokens_used"),
        )
        db.add(analysis)

        # 캐시 무효화
        await cache_delete(f"analysis:{stock.ticker}:{today.isoformat()}")
