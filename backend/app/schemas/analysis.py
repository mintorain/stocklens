from pydantic import BaseModel


class NewsSourceOut(BaseModel):
    title: str
    url: str
    source: str
    published_at: str
    summary: str | None = None


class NewsAnalysisOut(BaseModel):
    ticker: str
    analysis_date: str
    sentiment: str
    sentiment_score: float
    summary: list[str]
    reasoning: str
    news_sources: list[NewsSourceOut]
    news_count: int
    updated_at: str


class NewsAnalysisResponse(BaseModel):
    data: NewsAnalysisOut


class MarketSummaryResponse(BaseModel):
    summary: str
    date: str
