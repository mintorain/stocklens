import urllib.parse
from datetime import datetime

import feedparser
import httpx


def _parse_feed(url: str, max_items: int = 10) -> list[dict]:
    feed = feedparser.parse(url)
    items = []
    for entry in feed.entries[:max_items]:
        published = entry.get("published", "")
        try:
            pub_dt = datetime(*entry.published_parsed[:6]).isoformat() if entry.get("published_parsed") else published
        except Exception:
            pub_dt = published

        items.append({
            "title": entry.get("title", ""),
            "url": entry.get("link", ""),
            "source": feed.feed.get("title", ""),
            "published_at": pub_dt,
            "summary": entry.get("summary", "")[:300],
        })
    return items


def fetch_news_for_stock(stock_name: str, ticker: str, market: str) -> list[dict]:
    articles = []

    # Google News RSS (한국어 키워드)
    query_kr = urllib.parse.quote(f"{stock_name} 주식")
    google_kr = f"https://news.google.com/rss/search?q={query_kr}&hl=ko&gl=KR&ceid=KR:ko"
    articles.extend(_parse_feed(google_kr, max_items=6))

    if market == "US":
        # 해외 종목 영문 뉴스 추가
        query_en = urllib.parse.quote(f"{stock_name} stock")
        google_en = f"https://news.google.com/rss/search?q={query_en}&hl=en&gl=US&ceid=US:en"
        articles.extend(_parse_feed(google_en, max_items=5))

    # 중복 URL 제거
    seen = set()
    unique = []
    for a in articles:
        if a["url"] not in seen:
            seen.add(a["url"])
            unique.append(a)

    return unique[:10]


def format_news_for_prompt(articles: list[dict]) -> str:
    lines = []
    for i, a in enumerate(articles, 1):
        lines.append(f"[{i}] {a['title']}")
        if a.get("summary"):
            lines.append(f"    요약: {a['summary']}")
        lines.append(f"    출처: {a['source']} | {a['published_at'][:10]}")
        lines.append("")
    return "\n".join(lines)
