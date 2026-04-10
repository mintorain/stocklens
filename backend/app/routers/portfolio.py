from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.news_analysis import NewsAnalysis, PortfolioItem
from app.models.stock import Stock
from app.schemas.stock import AddPortfolioRequest, UpdateGroupRequest
from app.services.price_service import fetch_stock_price

router = APIRouter(prefix="/api/v1/portfolio", tags=["portfolio"])
@router.get("")
async def list_portfolio(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PortfolioItem).options(selectinload(PortfolioItem.stock)).order_by(PortfolioItem.sort_order)
    )
    items = result.scalars().all()

    today = date.today()
    data = []
    for item in items:
        stock = item.stock
        price = fetch_stock_price(stock.ticker, stock.market)

        # 최신 감성 분석
        analysis_result = await db.execute(
            select(NewsAnalysis)
            .where(NewsAnalysis.stock_id == stock.id, NewsAnalysis.analysis_date == today)
        )
        analysis = analysis_result.scalar_one_or_none()

        data.append({
            "id": str(item.id),
            "ticker": stock.ticker,
            "name": stock.name,
            "exchange": stock.exchange,
            "group_name": item.group_name,
            "current_price": price.get("current_price") if price else None,
            "change_pct": price.get("change_pct") if price else None,
            "sentiment": analysis.sentiment if analysis else None,
            "sentiment_score": float(analysis.sentiment_score) if analysis else None,
            "last_analysis": today.isoformat() if analysis else None,
        })

    return {"data": data, "meta": {"total": len(data)}}


@router.post("", status_code=201)
async def add_to_portfolio(body: AddPortfolioRequest, db: AsyncSession = Depends(get_db)):
    # 종목 조회 또는 생성
    result = await db.execute(select(Stock).where(Stock.ticker == body.ticker, Stock.exchange == body.exchange))
    stock = result.scalar_one_or_none()

    if not stock:
        price_info = fetch_stock_price(body.ticker, body.market)
        stock = Stock(
            ticker=body.ticker,
            name=price_info.get("name", body.ticker) if price_info else body.ticker,
            exchange=body.exchange,
            market=body.market,
        )
        db.add(stock)
        await db.flush()

    # 중복 확인
    existing = await db.execute(
        select(PortfolioItem).where(PortfolioItem.stock_id == stock.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="이미 관심 종목에 추가된 종목입니다.")

    portfolio_item = PortfolioItem(stock_id=stock.id, group_name=body.group_name)
    db.add(portfolio_item)
    await db.commit()

    return {"data": {"ticker": body.ticker, "message": "관심 종목에 추가되었습니다."}}


@router.delete("/{ticker}", status_code=204)
async def remove_from_portfolio(ticker: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PortfolioItem)
        .join(Stock)
        .where(Stock.ticker == ticker)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="관심 종목에 없는 종목입니다.")

    await db.delete(item)
    await db.commit()


@router.patch("/{ticker}")
async def update_group(ticker: str, body: UpdateGroupRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PortfolioItem).join(Stock).where(Stock.ticker == ticker)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="관심 종목에 없는 종목입니다.")

    item.group_name = body.group_name
    await db.commit()
    return {"data": {"ticker": ticker, "group_name": body.group_name}}
