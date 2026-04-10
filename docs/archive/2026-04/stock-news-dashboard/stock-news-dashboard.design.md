# [Design] stock-news-dashboard

> **Feature**: stock-news-dashboard
> **Phase**: Design
> **Status**: In Progress
> **Created**: 2026-04-10
> **Depends On**: `docs/01-plan/features/stock-news-dashboard.plan.md`

---

## 1. 프로젝트 구조 (File Structure)

```
stock-news-dashboard/
├── frontend/                          # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx                 # 루트 레이아웃 (폰트, 메타)
│   │   ├── page.tsx                   # 메인 대시보드 (/)
│   │   ├── stock/
│   │   │   └── [ticker]/
│   │   │       └── page.tsx           # 종목 상세 페이지
│   │   └── api/
│   │       └── proxy/route.ts         # 백엔드 프록시 (CORS)
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── IndexWidget.tsx        # 지수 위젯 카드
│   │   │   ├── IndexGrid.tsx          # 지수 그리드 (8개)
│   │   │   ├── MarketSummary.tsx      # AI 시장 요약 배너
│   │   │   └── PortfolioList.tsx      # 관심 종목 목록
│   │   ├── stock/
│   │   │   ├── StockCard.tsx          # 종목 카드 (목록용)
│   │   │   ├── StockChart.tsx         # 캔들스틱 차트
│   │   │   ├── StockInfo.tsx          # 기본 정보 (시가/고가 등)
│   │   │   ├── NewsAnalysis.tsx       # AI 뉴스 분석 섹션
│   │   │   ├── NewsList.tsx           # 뉴스 원문 링크 목록
│   │   │   └── SentimentBadge.tsx     # 감성 스코어 배지
│   │   ├── search/
│   │   │   ├── SearchBar.tsx          # 종목 검색 입력
│   │   │   └── SearchResults.tsx      # 검색 결과 드롭다운
│   │   └── ui/                        # shadcn/ui 래퍼
│   │       ├── LoadingSkeleton.tsx
│   │       └── ErrorBoundary.tsx
│   ├── lib/
│   │   ├── api.ts                     # API 클라이언트 (fetch 래퍼)
│   │   ├── store.ts                   # Zustand 전역 상태
│   │   └── utils.ts                   # 포맷 유틸 (가격, 날짜)
│   ├── hooks/
│   │   ├── useIndices.ts              # 지수 데이터 훅
│   │   ├── usePortfolio.ts            # 관심 종목 훅
│   │   ├── useStockDetail.ts          # 종목 상세 훅
│   │   └── useNewsAnalysis.ts         # AI 분석 훅
│   └── types/
│       └── index.ts                   # TypeScript 타입 정의
│
├── backend/                           # FastAPI (Python)
│   ├── app/
│   │   ├── main.py                    # FastAPI 앱 진입점
│   │   ├── routers/
│   │   │   ├── indices.py             # /api/v1/indices
│   │   │   ├── stocks.py              # /api/v1/stocks
│   │   │   ├── portfolio.py           # /api/v1/portfolio
│   │   │   └── admin.py               # /api/v1/admin
│   │   ├── services/
│   │   │   ├── price_service.py       # yfinance 주가 수집
│   │   │   ├── news_service.py        # RSS 뉴스 수집
│   │   │   ├── ai_service.py          # Claude API 연동
│   │   │   └── scheduler_service.py   # APScheduler 관리
│   │   ├── models/
│   │   │   ├── stock.py               # SQLAlchemy 모델
│   │   │   ├── price.py
│   │   │   ├── news_analysis.py
│   │   │   └── index_snapshot.py
│   │   ├── schemas/
│   │   │   ├── stock.py               # Pydantic 스키마
│   │   │   ├── analysis.py
│   │   │   └── index.py
│   │   ├── core/
│   │   │   ├── config.py              # 환경변수 설정
│   │   │   ├── database.py            # DB 연결 풀
│   │   │   └── cache.py               # Redis 캐시 유틸
│   │   └── tasks/
│   │       ├── morning_update.py      # 08:00 업데이트 태스크
│   │       └── midday_update.py       # 15:30 업데이트 태스크
│   ├── alembic/                       # DB 마이그레이션
│   └── requirements.txt
│
├── docker-compose.yml                 # 로컬 개발 환경
└── .env.example
```

---

## 2. 데이터베이스 설계 (ERD)

### 테이블 정의

```sql
-- 종목 마스터
CREATE TABLE stocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker       VARCHAR(20)  NOT NULL,   -- 예: 005930, AAPL
  name         VARCHAR(100) NOT NULL,
  exchange     VARCHAR(20)  NOT NULL,   -- KOSPI, KOSDAQ, NYSE, NASDAQ
  market       VARCHAR(5)   NOT NULL,   -- KR, US
  sector       VARCHAR(50),
  is_active    BOOLEAN      DEFAULT true,
  created_at   TIMESTAMPTZ  DEFAULT now(),
  UNIQUE (ticker, exchange)
);

-- 관심 종목 (포트폴리오)
CREATE TABLE portfolio_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id     UUID REFERENCES stocks(id) ON DELETE CASCADE,
  group_name   VARCHAR(50)  DEFAULT '기본',
  sort_order   INT          DEFAULT 0,
  added_at     TIMESTAMPTZ  DEFAULT now()
);

-- 주가 스냅샷 (일별)
CREATE TABLE price_snapshots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id     UUID REFERENCES stocks(id) ON DELETE CASCADE,
  snapshot_date DATE        NOT NULL,
  open         DECIMAL(12,2),
  close        DECIMAL(12,2),
  high         DECIMAL(12,2),
  low          DECIMAL(12,2),
  volume       BIGINT,
  market_cap   BIGINT,
  per          DECIMAL(8,2),
  pbr          DECIMAL(8,2),
  eps          DECIMAL(10,2),
  created_at   TIMESTAMPTZ  DEFAULT now(),
  UNIQUE (stock_id, snapshot_date)
);

-- AI 뉴스 분석 결과
CREATE TABLE news_analyses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id        UUID REFERENCES stocks(id) ON DELETE CASCADE,
  analysis_date   DATE         NOT NULL,
  sentiment       VARCHAR(20)  NOT NULL CHECK (sentiment IN ('positive','neutral','negative')),
  sentiment_score DECIMAL(4,3) NOT NULL,  -- -1.000 ~ 1.000
  summary         JSONB        NOT NULL,  -- ["이슈1", "이슈2", "이슈3"]
  reasoning       TEXT,
  news_sources    JSONB        NOT NULL,  -- [{title, url, source, published_at}]
  news_count      INT          DEFAULT 0,
  model_used      VARCHAR(50),
  tokens_used     INT,
  created_at      TIMESTAMPTZ  DEFAULT now(),
  UNIQUE (stock_id, analysis_date)
);

-- 지수 스냅샷 (일별)
CREATE TABLE index_snapshots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  index_code   VARCHAR(20)  NOT NULL,  -- KOSPI, KOSDAQ, SP500 등
  index_name   VARCHAR(50)  NOT NULL,
  snapshot_date DATE        NOT NULL,
  value        DECIMAL(12,2),
  prev_close   DECIMAL(12,2),
  change       DECIMAL(10,2),
  change_pct   DECIMAL(6,3),
  created_at   TIMESTAMPTZ  DEFAULT now(),
  UNIQUE (index_code, snapshot_date)
);

-- 인덱스
CREATE INDEX idx_price_snapshots_stock_date  ON price_snapshots(stock_id, snapshot_date DESC);
CREATE INDEX idx_news_analyses_stock_date    ON news_analyses(stock_id, analysis_date DESC);
CREATE INDEX idx_index_snapshots_code_date   ON index_snapshots(index_code, snapshot_date DESC);
```

### ERD 관계도
```
stocks (1) ──< portfolio_items (N)
stocks (1) ──< price_snapshots (N)
stocks (1) ──< news_analyses   (N)
index_snapshots (독립 테이블)
```

---

## 3. API 엔드포인트 명세

### 3.1 지수 API

#### `GET /api/v1/indices`
주요 지수 목록 조회

**Response**
```json
{
  "data": [
    {
      "code": "KOSPI",
      "name": "코스피",
      "value": 2650.34,
      "change": 31.20,
      "change_pct": 1.19,
      "prev_close": 2619.14,
      "updated_at": "2026-04-10T15:30:00Z"
    }
  ],
  "meta": { "count": 8, "updated_at": "2026-04-10T15:30:00Z" }
}
```

**지수 목록**: KOSPI, KOSDAQ, SP500, NASDAQ, DOW, NIKKEI, SHANGHAI, FTSE

---

### 3.2 종목 검색 API

#### `GET /api/v1/stocks/search?q={query}&market={KR|US|ALL}`
종목명 또는 티커 검색

**Query Params**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| q | string | ✅ | 검색어 (2자 이상) |
| market | string | ❌ | KR / US / ALL (기본: ALL) |
| limit | int | ❌ | 최대 결과 수 (기본: 10) |

**Response**
```json
{
  "data": [
    {
      "ticker": "005930",
      "name": "삼성전자",
      "exchange": "KOSPI",
      "market": "KR",
      "current_price": 78500,
      "change_pct": 1.29,
      "in_portfolio": false
    }
  ],
  "meta": { "total": 3, "query": "삼성" }
}
```

---

### 3.3 종목 상세 API

#### `GET /api/v1/stocks/{ticker}`
종목 기본 정보 + 현재가

**Path Params**: `ticker` — 종목 코드 (예: `005930`, `AAPL`)

**Response**
```json
{
  "data": {
    "ticker": "005930",
    "name": "삼성전자",
    "exchange": "KOSPI",
    "market": "KR",
    "current_price": 78500,
    "open": 77500,
    "high": 79200,
    "low": 77300,
    "volume": 15234567,
    "market_cap": 468000000000000,
    "per": 13.2,
    "pbr": 1.4,
    "eps": 5942,
    "week52_high": 88000,
    "week52_low": 68000,
    "change": 1000,
    "change_pct": 1.29,
    "updated_at": "2026-04-10T15:30:00Z"
  }
}
```

---

#### `GET /api/v1/stocks/{ticker}/price?period={1d|1w|1m|3m}`
주가 시계열 (차트용)

**Response**
```json
{
  "data": {
    "ticker": "005930",
    "period": "1m",
    "candles": [
      {
        "date": "2026-03-10",
        "open": 75000,
        "high": 76500,
        "low": 74800,
        "close": 76200,
        "volume": 12500000
      }
    ]
  }
}
```

---

#### `GET /api/v1/stocks/{ticker}/news`
AI 뉴스 분석 결과 조회 (당일 또는 최신)

**Response**
```json
{
  "data": {
    "ticker": "005930",
    "analysis_date": "2026-04-10",
    "sentiment": "positive",
    "sentiment_score": 0.65,
    "summary": [
      "HBM3E 양산 확대로 3분기 실적 기대감 상승",
      "미국 반도체 수출 규제 완화 가능성 언급",
      "원달러 환율 하락으로 수출주 부담 소폭 증가"
    ],
    "reasoning": "HBM 관련 긍정 뉴스가 우세하나 환율 리스크 존재",
    "news_sources": [
      {
        "title": "삼성전자 HBM3E 양산 확대 계획 발표",
        "url": "https://...",
        "source": "조선일보",
        "published_at": "2026-04-10T07:30:00Z"
      }
    ],
    "news_count": 8,
    "updated_at": "2026-04-10T08:03:00Z"
  }
}
```

---

### 3.4 관심 종목 API

#### `GET /api/v1/portfolio`
관심 종목 전체 목록 조회

**Response**
```json
{
  "data": [
    {
      "id": "uuid",
      "ticker": "005930",
      "name": "삼성전자",
      "exchange": "KOSPI",
      "group_name": "성장주",
      "current_price": 78500,
      "change_pct": 1.29,
      "sentiment": "positive",
      "sentiment_score": 0.65,
      "last_analysis": "2026-04-10"
    }
  ],
  "meta": { "total": 5 }
}
```

#### `POST /api/v1/portfolio`
관심 종목 추가

**Request Body**
```json
{
  "ticker": "005930",
  "exchange": "KOSPI",
  "group_name": "성장주"
}
```

#### `DELETE /api/v1/portfolio/{ticker}`
관심 종목 삭제 → `204 No Content`

#### `PATCH /api/v1/portfolio/{ticker}`
그룹 변경

**Request Body**
```json
{ "group_name": "배당주" }
```

---

### 3.5 관리자 API

#### `POST /api/v1/admin/refresh/{ticker}`
특정 종목 뉴스 분석 수동 갱신

**Response**
```json
{
  "data": { "ticker": "005930", "status": "queued", "estimated_at": "2026-04-10T14:05:00Z" }
}
```

---

## 4. 컴포넌트 설계

### 4.1 IndexWidget

```typescript
interface IndexWidgetProps {
  code: string        // "KOSPI"
  name: string        // "코스피"
  value: number       // 2650.34
  change: number      // +31.20
  changePct: number   // +1.19
  isLoading?: boolean
}

// 색상 규칙
// changePct > 0  → text-red-500 (국내 상승 = 빨강)
// changePct < 0  → text-blue-500 (국내 하락 = 파랑)
// 해외는 green/red 기준 적용
```

### 4.2 StockCard (관심 종목 목록용)

```typescript
interface StockCardProps {
  ticker: string
  name: string
  exchange: string
  currentPrice: number
  changePct: number
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  lastAnalysis: string    // "2026-04-10"
  onRemove: (ticker: string) => void
}
```

### 4.3 SentimentBadge

```typescript
interface SentimentBadgeProps {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number   // -1 ~ 1
  showScore?: boolean
}

// 렌더링 예시
// score: 0.65 → "긍정" 배지 (초록) + 막대 65% 채움
// score: -0.3 → "부정" 배지 (빨강) + 막대 30% 채움
// score: 0.05 → "중립" 배지 (회색) + 막대 5% 채움
```

### 4.4 NewsAnalysis

```typescript
interface NewsAnalysisProps {
  ticker: string
  analysisDate: string
  sentiment: string
  sentimentScore: number
  summary: string[]        // 3줄 요약
  reasoning: string
  newsSources: NewsSource[]
  updatedAt: string
  isLoading?: boolean
}

interface NewsSource {
  title: string
  url: string
  source: string
  publishedAt: string
}
```

---

## 5. 상태 관리 설계 (Zustand)

```typescript
// store.ts
interface AppStore {
  // 관심 종목
  portfolio: PortfolioItem[]
  addToPortfolio: (item: PortfolioItem) => void
  removeFromPortfolio: (ticker: string) => void
  updateGroup: (ticker: string, group: string) => void

  // 검색
  searchQuery: string
  searchResults: StockSearchResult[]
  setSearchQuery: (q: string) => void
  setSearchResults: (results: StockSearchResult[]) => void

  // UI 상태
  selectedTicker: string | null
  setSelectedTicker: (ticker: string | null) => void
}
```

---

## 6. Claude AI 프롬프트 설계

### 6.1 종목별 뉴스 분석 프롬프트

```python
ANALYSIS_PROMPT = """당신은 주식 시장 전문 뉴스 분석가입니다.
아래는 [{stock_name} ({ticker})]에 관한 최근 뉴스 {news_count}건입니다.

=== 뉴스 목록 ===
{news_items}
=================

다음 JSON 형식으로 분석 결과를 반환하세요:
{{
  "sentiment": "positive" | "neutral" | "negative",
  "sentiment_score": -1.0 ~ 1.0 사이 소수점 3자리 숫자,
  "summary": ["핵심이슈1", "핵심이슈2", "핵심이슈3"],
  "reasoning": "판단 근거 1~2문장"
}}

규칙:
- summary는 반드시 3개 항목, 각 30자 이내
- 투자 조언, 매수/매도 추천 절대 금지
- 사실 기반 분석만 작성
- 한국어로 응답
- JSON 외 다른 텍스트 출력 금지"""
```

### 6.2 시장 전체 요약 프롬프트

```python
MARKET_SUMMARY_PROMPT = """오늘({date}) 주요 주가지수 데이터입니다:

{index_summary}

투자자를 위한 오늘의 시장 분위기를 1~2문장으로 요약하세요.
- 투자 조언 금지
- 사실과 수치 기반
- 한국어, 간결하게"""
```

### 6.3 API 호출 설정

```python
# ai_service.py
CLAUDE_CONFIG = {
    "model": "claude-sonnet-4-6",
    "max_tokens": 500,          # 분석 결과는 짧음
    "temperature": 0.2,         # 일관된 분석 결과
    "daily_token_limit": 100000  # 비용 제어 (~$1.5/일)
}
```

---

## 7. 스케줄러 설계

```python
# scheduler_service.py
SCHEDULE_CONFIG = {
    "morning_update": {
        "cron": "0 8 * * MON-FRI",    # 평일 오전 8:00
        "tasks": [
            "collect_index_data",       # 지수 데이터 수집
            "collect_stock_prices",     # 전체 종목 주가
            "collect_news",             # 뉴스 RSS 수집
            "run_ai_analysis",          # Claude 분석 실행
            "generate_market_summary"   # 시장 요약 생성
        ]
    },
    "midday_update": {
        "cron": "30 15 * * MON-FRI",   # 평일 오후 3:30
        "tasks": [
            "collect_index_data",
            "collect_stock_prices",
            "collect_news",
            "run_ai_analysis"
        ]
    }
}

# 실행 순서 (순차)
# 1. 거래일 여부 확인
# 2. 지수 데이터 갱신 (Redis 캐시 무효화)
# 3. 종목 주가 일괄 수집 (yfinance batch)
# 4. 뉴스 RSS 파싱 (종목별 최대 10건)
# 5. Claude API 분석 (종목당 1회, 캐시 히트 시 skip)
# 6. DB 저장
# 7. Redis 캐시 갱신
```

---

## 8. 캐싱 전략 (Redis)

| 데이터 | 캐시 키 | TTL | 갱신 조건 |
|--------|---------|-----|----------|
| 지수 데이터 | `indices:all` | 15분 | 스케줄러 실행 시 |
| 종목 현재가 | `price:{ticker}` | 15분 | 스케줄러 실행 시 |
| AI 분석 결과 | `analysis:{ticker}:{date}` | 24시간 | 분석 재실행 시 |
| 주가 차트 | `chart:{ticker}:{period}` | 1시간 | TTL 만료 시 자동 |
| 종목 검색 | `search:{query}` | 5분 | TTL 만료 시 자동 |

---

## 9. 환경변수 설계

```bash
# .env.example

# Claude API
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-6
CLAUDE_DAILY_TOKEN_LIMIT=100000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/stocklens

# Redis
REDIS_URL=redis://localhost:6379

# App
NEXT_PUBLIC_API_URL=http://localhost:8000
ENVIRONMENT=development

# 선택: NewsAPI (해외 뉴스 강화 시)
# NEWS_API_KEY=...
```

---

## 10. 화면 흐름 (User Flow)

```
[홈 /]
  ├── 지수 그리드 로드 (SSG + revalidate 900s)
  ├── AI 시장 요약 배너 로드
  ├── 관심 종목 목록 로드 (CSR)
  │     └── 각 종목: 현재가 + 감성 스코어 표시
  └── 검색바 클릭
        └── [검색 드롭다운]
              └── 종목 선택 → [+ 관심 추가] 버튼

[종목 상세 /stock/{ticker}]
  ├── 종목 기본 정보 + 현재가
  ├── 캔들스틱 차트 (기본: 1달)
  │     └── 기간 탭: 1일 | 1주 | 1달 | 3달
  ├── 재무 지표 카드 (PER/PBR/EPS/시총)
  └── AI 뉴스 시황 분석
        ├── 감성 스코어 + 배지
        ├── 3줄 핵심 요약
        ├── 판단 근거
        └── 뉴스 원문 링크 목록
```

---

## 11. 타입 정의 (TypeScript)

```typescript
// types/index.ts

export interface IndexData {
  code: string
  name: string
  value: number
  change: number
  changePct: number
  updatedAt: string
}

export interface StockDetail {
  ticker: string
  name: string
  exchange: string
  market: 'KR' | 'US'
  currentPrice: number
  open: number
  high: number
  low: number
  volume: number
  marketCap: number
  per: number
  pbr: number
  eps: number
  week52High: number
  week52Low: number
  change: number
  changePct: number
  updatedAt: string
}

export interface NewsAnalysis {
  ticker: string
  analysisDate: string
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number      // -1.0 ~ 1.0
  summary: [string, string, string]
  reasoning: string
  newsSources: {
    title: string
    url: string
    source: string
    publishedAt: string
  }[]
  newsCount: number
  updatedAt: string
}

export interface PortfolioItem {
  id: string
  ticker: string
  name: string
  exchange: string
  groupName: string
  currentPrice: number
  changePct: number
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  lastAnalysis: string
}

export interface CandleData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}
```

---

## 12. 완료 기준 (Design DoD)

- [x] 프로젝트 폴더 구조 확정
- [x] DB 스키마 (5개 테이블) 설계 완료
- [x] REST API 엔드포인트 전체 명세 완료
- [x] 주요 컴포넌트 Props 인터페이스 정의
- [x] Zustand 스토어 구조 설계
- [x] Claude API 프롬프트 템플릿 설계
- [x] 스케줄러 실행 계획 정의
- [x] Redis 캐싱 전략 수립
- [x] TypeScript 타입 정의 완료

---

## 13. 다음 단계

> Design 완료 후 → `/pdca do stock-news-dashboard` 로 구현 시작

**구현 우선순위**:
1. Phase 1: 백엔드 기반 (FastAPI + DB + yfinance)
2. Phase 2: 프론트엔드 UI (대시보드 + 지수 위젯)
3. Phase 3: AI 뉴스 분석 파이프라인
4. Phase 4: 스케줄러 + 배포
