from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine
from app.core.database import Base
from app.routers import admin, indices, market, portfolio, stocks
from app.services.scheduler_service import create_scheduler

scheduler = create_scheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # DB 테이블 생성 (개발용 — 프로덕션은 alembic 사용)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="StockLens API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(indices.router)
app.include_router(stocks.router)
app.include_router(portfolio.router)
app.include_router(market.router)
app.include_router(admin.router)


@app.get("/health")
async def health():
    return {"status": "healthy"}
