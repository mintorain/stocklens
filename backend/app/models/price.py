import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Index, Numeric, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PriceSnapshot(Base):
    __tablename__ = "price_snapshots"
    __table_args__ = (
        UniqueConstraint("stock_id", "snapshot_date"),
        Index("idx_price_snapshots_stock_date", "stock_id", "snapshot_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stock_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stocks.id", ondelete="CASCADE"))
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False)
    open: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    close: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    high: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    low: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    volume: Mapped[int | None] = mapped_column(BigInteger)
    market_cap: Mapped[int | None] = mapped_column(BigInteger)
    per: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    pbr: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    eps: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    stock: Mapped["Stock"] = relationship(back_populates="price_snapshots")


class IndexSnapshot(Base):
    __tablename__ = "index_snapshots"
    __table_args__ = (
        UniqueConstraint("index_code", "snapshot_date"),
        Index("idx_index_snapshots_code_date", "index_code", "snapshot_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    index_code: Mapped[str] = mapped_column(nullable=False)
    index_name: Mapped[str] = mapped_column(nullable=False)
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False)
    value: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    prev_close: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    change: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    change_pct: Mapped[Decimal | None] = mapped_column(Numeric(6, 3))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
