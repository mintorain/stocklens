import json

import anthropic

from app.core.config import settings
from app.services.news_service import format_news_for_prompt

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client


ANALYSIS_PROMPT = """\
당신은 주식 시장 전문 뉴스 분석가입니다.
아래는 [{stock_name} ({ticker})]에 관한 최근 뉴스 {news_count}건입니다.

=== 뉴스 목록 ===
{news_text}
=================

다음 JSON 형식으로 분석 결과만 반환하세요 (다른 텍스트 금지):
{{
  "sentiment": "positive",
  "sentiment_score": 0.65,
  "summary": ["핵심이슈1 (30자 이내)", "핵심이슈2 (30자 이내)", "핵심이슈3 (30자 이내)"],
  "reasoning": "판단 근거 1~2문장"
}}

규칙:
- sentiment는 positive / neutral / negative 중 하나
- sentiment_score는 -1.0(매우 부정) ~ 1.0(매우 긍정)
- summary는 반드시 3개, 각 30자 이내
- 투자 조언, 매수/매도 추천 절대 금지
- 사실 기반 분석만 작성
- 한국어로 응답"""

MARKET_SUMMARY_PROMPT = """\
오늘({date}) 주요 주가지수 현황입니다:

{index_summary}

투자자를 위한 오늘의 시장 분위기를 1~2문장으로 간결하게 요약하세요.
- 투자 조언 금지
- 수치 기반 사실만 서술
- 한국어"""


def analyze_news(stock_name: str, ticker: str, articles: list[dict]) -> dict:
    if not articles:
        return {
            "sentiment": "neutral",
            "sentiment_score": 0.0,
            "summary": ["관련 뉴스를 찾을 수 없습니다", "데이터 없음", "추후 업데이트 예정"],
            "reasoning": "수집된 뉴스 없음",
            "tokens_used": 0,
        }

    news_text = format_news_for_prompt(articles)
    prompt = ANALYSIS_PROMPT.format(
        stock_name=stock_name,
        ticker=ticker,
        news_count=len(articles),
        news_text=news_text,
    )

    client = _get_client()
    message = client.messages.create(
        model=settings.claude_model,
        max_tokens=500,
        temperature=0.2,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # JSON 블록 추출 (```json ... ``` 감싸진 경우 대응)
    if "```" in raw:
        raw = raw.split("```")[1].lstrip("json").strip()

    result = json.loads(raw)
    result["tokens_used"] = message.usage.input_tokens + message.usage.output_tokens
    result["model_used"] = settings.claude_model
    return result


def generate_market_summary(indices: list[dict], today: str) -> str:
    lines = []
    for idx in indices:
        sign = "+" if idx["change_pct"] >= 0 else ""
        lines.append(f"- {idx['name']}: {idx['value']:,.2f} ({sign}{idx['change_pct']:.2f}%)")

    index_summary = "\n".join(lines)
    prompt = MARKET_SUMMARY_PROMPT.format(date=today, index_summary=index_summary)

    client = _get_client()
    message = client.messages.create(
        model=settings.claude_model,
        max_tokens=150,
        temperature=0.3,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text.strip()
