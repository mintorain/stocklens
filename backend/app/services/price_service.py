from datetime import date, timedelta

import yfinance as yf

# 지수 코드 → yfinance 티커 매핑
INDEX_MAP = {
    "KOSPI":    "^KS11",
    "KOSDAQ":   "^KQ11",
    "SP500":    "^GSPC",
    "NASDAQ":   "^IXIC",
    "DOW":      "^DJI",
    "NIKKEI":   "^N225",
    "SHANGHAI": "000001.SS",
    "FTSE":     "^FTSE",
}

INDEX_NAMES = {
    "KOSPI":    "코스피",
    "KOSDAQ":   "코스닥",
    "SP500":    "S&P 500",
    "NASDAQ":   "나스닥",
    "DOW":      "다우존스",
    "NIKKEI":   "니케이 225",
    "SHANGHAI": "상하이종합",
    "FTSE":     "FTSE 100",
}


def fetch_index_data() -> list[dict]:
    results = []
    tickers = list(INDEX_MAP.values())
    data = yf.download(tickers, period="2d", auto_adjust=True, progress=False)

    for code, yf_ticker in INDEX_MAP.items():
        try:
            close = data["Close"][yf_ticker]
            today_val = float(close.iloc[-1])
            prev_val = float(close.iloc[-2])
            change = today_val - prev_val
            change_pct = (change / prev_val) * 100

            results.append({
                "code": code,
                "name": INDEX_NAMES[code],
                "value": round(today_val, 2),
                "prev_close": round(prev_val, 2),
                "change": round(change, 2),
                "change_pct": round(change_pct, 3),
                "snapshot_date": date.today().isoformat(),
            })
        except Exception:
            continue

    return results


def fetch_stock_price(ticker: str, market: str) -> dict | None:
    yf_ticker = ticker if market == "US" else f"{ticker}.KS"
    try:
        stock = yf.Ticker(yf_ticker)
        info = stock.info
        hist = stock.history(period="2d")

        if hist.empty:
            return None

        current = float(hist["Close"].iloc[-1])
        prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current
        change = current - prev
        change_pct = (change / prev) * 100 if prev else 0

        return {
            "current_price": round(current, 2),
            "open": round(float(hist["Open"].iloc[-1]), 2),
            "high": round(float(hist["High"].iloc[-1]), 2),
            "low": round(float(hist["Low"].iloc[-1]), 2),
            "volume": int(hist["Volume"].iloc[-1]),
            "change": round(change, 2),
            "change_pct": round(change_pct, 3),
            "market_cap": info.get("marketCap"),
            "per": info.get("trailingPE"),
            "pbr": info.get("priceToBook"),
            "eps": info.get("trailingEps"),
            "week52_high": info.get("fiftyTwoWeekHigh"),
            "week52_low": info.get("fiftyTwoWeekLow"),
            "name": info.get("shortName", ticker),
        }
    except Exception:
        return None


def fetch_price_history(ticker: str, market: str, period: str) -> list[dict]:
    yf_ticker = ticker if market == "US" else f"{ticker}.KS"
    period_map = {"1d": "1d", "1w": "5d", "1m": "1mo", "3m": "3mo"}
    interval_map = {"1d": "5m", "1w": "1h", "1m": "1d", "3m": "1d"}

    try:
        stock = yf.Ticker(yf_ticker)
        hist = stock.history(
            period=period_map.get(period, "1mo"),
            interval=interval_map.get(period, "1d"),
            auto_adjust=True,
        )
        return [
            {
                "date": str(idx.date()) if hasattr(idx, "date") else str(idx),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            }
            for idx, row in hist.iterrows()
        ]
    except Exception:
        return []


def search_stocks(query: str, market: str = "ALL") -> list[dict]:
    """yfinance 기반 단순 검색 (실제 서비스는 종목 DB 사전 구축 필요)"""
    results = []
    candidates = [query, f"{query}.KS", f"{query}.KQ"]

    for t in candidates:
        try:
            stock = yf.Ticker(t)
            info = stock.info
            if not info.get("symbol"):
                continue

            exch = info.get("exchange", "")
            mkt = "KR" if exch in ("KSC", "KOE") else "US"

            if market != "ALL" and mkt != market:
                continue

            results.append({
                "ticker": info["symbol"].replace(".KS", "").replace(".KQ", ""),
                "name": info.get("shortName", t),
                "exchange": exch,
                "market": mkt,
                "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "change_pct": info.get("regularMarketChangePercent"),
            })
        except Exception:
            continue

    return results[:10]
