import uuid
from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class NewsAnalysis(Base):
    __tablename__ = "news_analyses"
    __table_args__ = (
        UniqueConstraint("stock_id", "analysis_date"),
        CheckConstraint("sentiment IN ('positive','neutral','negative')", name="ck_sentiment"),
        Index("idx_news_analyses_stock_date", "stock_id", "analysis_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stock_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stocks.id", ondelete="CASCADE"))
    analysis_date: Mapped[date] = mapped_column(Date, nullable=False)
    sentiment: Mapped[str] = mapped_column(String(20), nullable=False)
    sentiment_score: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)
    summary: Mapped[list] = mapped_column(JSON, nullable=False)
    reasoning: Mapped[str | None] = mapped_column(Text)
    news_sources: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    news_count: Mapped[int] = mapped_column(Integer, default=0)
    model_used: Mapped[str | None] = mapped_column(String(50))
    tokens_used: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    stock: Mapped["Stock"] = relationship(back_populates="news_analyses")


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stock_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stocks.id", ondelete="CASCADE"))
    group_name: Mapped[str] = mapped_column(String(50), default="기본")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    stock: Mapped["Stock"] = relationship(back_populates="portfolio_items")
