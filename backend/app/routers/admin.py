import asyncio
from datetime import datetime, timedelta

from fastapi import APIRouter

from app.tasks.morning_update import run_full_update

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.post("/refresh/{ticker}")
async def manual_refresh(ticker: str):
    """특정 종목 뉴스 분석 수동 갱신 트리거"""
    asyncio.create_task(run_full_update())
    estimated = (datetime.utcnow() + timedelta(minutes=2)).isoformat() + "Z"
    return {
        "data": {
            "ticker": ticker,
            "status": "queued",
            "estimated_at": estimated,
        }
    }
