import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Stock(Base):
    __tablename__ = "stocks"
    __table_args__ = (UniqueConstraint("ticker", "exchange"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), nullable=False)
    market: Mapped[str] = mapped_column(String(5), nullable=False)
    sector: Mapped[str | None] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    portfolio_items: Mapped[list["PortfolioItem"]] = relationship(back_populates="stock", cascade="all, delete-orphan")
    price_snapshots: Mapped[list["PriceSnapshot"]] = relationship(back_populates="stock", cascade="all, delete-orphan")
    news_analyses: Mapped[list["NewsAnalysis"]] = relationship(back_populates="stock", cascade="all, delete-orphan")
