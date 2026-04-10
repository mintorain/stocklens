from fastapi import APIRouter

from app.core.cache import cache_get

router = APIRouter(prefix="/api/v1/market", tags=["market"])


@router.get("/summary")
async def get_market_summary():
    cached = await cache_get("market:summary")
    if cached:
        return cached
    return {"summary": "시장 데이터를 수집 중입니다. 잠시 후 다시 확인해주세요.", "date": ""}
