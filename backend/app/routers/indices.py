from datetime import datetime

from fastapi import APIRouter

from app.core.cache import cache_get, cache_set
from app.services.price_service import fetch_index_data

router = APIRouter(prefix="/api/v1/indices", tags=["indices"])

CACHE_KEY = "indices:all"
CACHE_TTL = 900  # 15분


@router.get("")
async def get_indices():
    cached = await cache_get(CACHE_KEY)
    if cached:
        return cached

    data = fetch_index_data()
    result = {
        "data": data,
        "meta": {"count": len(data), "updated_at": datetime.utcnow().isoformat() + "Z"},
    }
    await cache_set(CACHE_KEY, result, CACHE_TTL)
    return result
