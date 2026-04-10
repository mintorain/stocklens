/**
 * AI 뉴스 분석 — Claude 또는 OpenAI 자동 선택
 *
 * 우선순위: OPENAI_API_KEY → ANTHROPIC_API_KEY → 분석 없이 뉴스만 반환
 */

const PROMPT_TEMPLATE = (stockName: string, ticker: string, newsText: string, count: number) => `\
당신은 주식 시장 전문 뉴스 분석가입니다.
아래는 [${stockName} (${ticker})]에 관한 최근 뉴스 ${count}건입니다.

=== 뉴스 목록 ===
${newsText}
=================

다음 JSON 형식으로 분석 결과만 반환하세요 (다른 텍스트 금지):
{
  "sentiment": "positive",
  "sentiment_score": 0.65,
  "summary": ["핵심이슈1 (30자 이내)", "핵심이슈2 (30자 이내)", "핵심이슈3 (30자 이내)"],
  "reasoning": "판단 근거 1~2문장"
}

규칙:
- sentiment는 positive / neutral / negative 중 하나
- sentiment_score는 -1.0(매우 부정) ~ 1.0(매우 긍정)
- summary는 반드시 3개, 각 30자 이내
- 투자 조언, 매수/매도 추천 절대 금지
- 한국어로 응답`

function parseJsonResponse(raw: string): any {
  let text = raw.trim()
  if (text.includes('```')) {
    text = text.split('```')[1].replace(/^json/, '').trim()
  }
  return JSON.parse(text)
}

async function analyzeWithOpenAI(prompt: string): Promise<any> {
  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  return { ...parseJsonResponse(raw), model_used: 'gpt-4o-mini' }
}

async function analyzeWithClaude(prompt: string): Promise<any> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (message.content[0] as any).text?.trim() ?? '{}'
  return { ...parseJsonResponse(raw), model_used: 'claude-sonnet-4-6' }
}

export async function analyzeNews(
  stockName: string,
  ticker: string,
  articles: { title: string; source: string }[]
): Promise<any> {
  if (articles.length === 0) {
    return {
      sentiment: 'neutral',
      sentiment_score: 0,
      summary: ['관련 뉴스를 찾을 수 없습니다', '데이터 없음', '추후 업데이트 예정'],
      reasoning: '수집된 뉴스 없음',
      model_used: 'none',
    }
  }

  const newsText = articles
    .map((a, i) => `[${i + 1}] ${a.title}\n    출처: ${a.source}`)
    .join('\n\n')

  const prompt = PROMPT_TEMPLATE(stockName, ticker, newsText, articles.length)

  // OpenAI 우선 → Claude fallback
  try {
    if (process.env.OPENAI_API_KEY) {
      return await analyzeWithOpenAI(prompt)
    }
    if (process.env.ANTHROPIC_API_KEY) {
      return await analyzeWithClaude(prompt)
    }
  } catch (err) {
    // 첫 번째 실패 시 다른 API 시도
    try {
      if (process.env.ANTHROPIC_API_KEY && process.env.OPENAI_API_KEY) {
        return await analyzeWithClaude(prompt)
      }
    } catch {
      /* 둘 다 실패 */
    }
  }

  return {
    sentiment: 'neutral',
    sentiment_score: 0,
    summary: ['AI API 키가 설정되지 않았습니다', 'OPENAI_API_KEY 또는', 'ANTHROPIC_API_KEY를 추가하세요'],
    reasoning: 'API 키 미설정',
    model_used: 'none',
  }
}

export async function generateMarketSummary(indicesText: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]
  const prompt = `오늘(${today}) 주요 주가지수 현황입니다:\n\n${indicesText}\n\n투자자를 위한 오늘의 시장 분위기를 1~2문장으로 간결하게 요약하세요.\n- 투자 조언 금지\n- 수치 기반 사실만 서술\n- 한국어`

  try {
    if (process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai')
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 150,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      })
      return res.choices[0]?.message?.content?.trim() ?? ''
    }
    if (process.env.ANTHROPIC_API_KEY) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 150,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      })
      return (msg.content[0] as any).text?.trim() ?? ''
    }
  } catch { /* 실패 시 기본 메시지 */ }

  return '시장 요약을 위해 OPENAI_API_KEY 또는 ANTHROPIC_API_KEY 환경변수가 필요합니다.'
}
