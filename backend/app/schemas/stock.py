from pydantic import BaseModel


class StockBase(BaseModel):
    ticker: str
    name: str
    exchange: str
    market: str


class StockSearchResult(StockBase):
    current_price: float | None = None
    change_pct: float | None = None
    in_portfolio: bool = False


class StockSearchResponse(BaseModel):
    data: list[StockSearchResult]
    meta: dict


class StockDetail(StockBase):
    current_price: float
    open: float
    high: float
    low: float
    volume: int
    change: float
    change_pct: float
    market_cap: int | None = None
    per: float | None = None
    pbr: float | None = None
    eps: float | None = None
    week52_high: float | None = None
    week52_low: float | None = None
    updated_at: str | None = None


class StockDetailResponse(BaseModel):
    data: StockDetail


class CandleData(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class PriceHistoryResponse(BaseModel):
    data: dict


class AddPortfolioRequest(BaseModel):
    ticker: str
    exchange: str
    market: str = "KR"
    group_name: str = "기본"


class UpdateGroupRequest(BaseModel):
    group_name: str


class PortfolioItemOut(BaseModel):
    id: str
    ticker: str
    name: str
    exchange: str
    group_name: str
    current_price: float | None = None
    change_pct: float | None = None
    sentiment: str | None = None
    sentiment_score: float | None = None
    last_analysis: str | None = None


class PortfolioResponse(BaseModel):
    data: list[PortfolioItemOut]
    meta: dict
