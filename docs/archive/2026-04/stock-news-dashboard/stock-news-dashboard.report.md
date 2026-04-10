# [Report] stock-news-dashboard — PDCA 완료 보고서

> **Feature**: StockLens — AI 주식 뉴스 시황 분석 대시보드
> **Level**: Dynamic
> **Final Match Rate**: 93%
> **PDCA Cycle**: 2026-04-10 (1 session, 1 iteration)

---

## 1. 프로젝트 요약

### 서비스 개요
관심 종목을 등록하면 국내외 주요 지수와 종목별 뉴스 시황을 Claude AI가 매일 자동 분석·요약해주는 **개인용 주식 투자 대시보드**

### 핵심 기능
- 8개 국내외 주요 지수 실시간 표시 (KOSPI, KOSDAQ, S&P500, NASDAQ, Dow, Nikkei, Shanghai, FTSE)
- 종목 검색 + 관심 종목 관리 (최대 20개)
- Claude API 기반 뉴스 감성 분석 + 3줄 요약
- 캔들스틱 주가 차트 (1일/1주/1달/3달)
- 평일 08:00 / 15:30 자동 업데이트 스케줄러

---

## 2. PDCA 사이클 추적

```
[Plan] ✅ → [Design] ✅ → [Do] ✅ → [Check] ✅ → [Act] ✅ → [Report] ✅
```

| Phase | 상태 | 주요 산출물 |
|-------|:----:|-----------|
| Plan | ✅ | `docs/01-plan/features/stock-news-dashboard.plan.md` |
| Design | ✅ | `docs/02-design/features/stock-news-dashboard.design.md` |
| Do | ✅ | backend/ (FastAPI) + frontend/ (Next.js) 전체 구현 |
| Check | ✅ | `docs/03-analysis/stock-news-dashboard.analysis.md` (82%) |
| Act | ✅ | 13개 항목 수정 → 93% 달성 (1 iteration) |
| Report | ✅ | 이 문서 |

---

## 3. 기술 스택

| 계층 | 기술 | 용도 |
|------|------|------|
| 프론트엔드 | Next.js 14 (App Router) | SSR/SSG + 반응형 UI |
| 스타일링 | Tailwind CSS | 빠른 UI 개발 |
| 차트 | TradingView Lightweight Charts | 캔들스틱 주가 차트 |
| 상태관리 | Zustand + persist | 포트폴리오 로컬 저장 |
| 백엔드 | FastAPI (Python 3.12) | 비동기 REST API |
| DB | PostgreSQL | 종목·분석 데이터 저장 |
| 캐시 | Redis | 주가 15분, 분석 24시간 캐싱 |
| AI | Claude API (claude-sonnet-4-6) | 뉴스 감성 분석 + 시장 요약 |
| 주가 | yfinance | 국내외 주가·지수 데이터 |
| 뉴스 | Google News RSS | 종목별 뉴스 수집 |
| 스케줄러 | APScheduler | 평일 자동 업데이트 |

---

## 4. 구현 파일 목록

### 백엔드 (16개 파일)
```
backend/
├── Dockerfile
├── requirements.txt
├── app/
│   ├── main.py                       # FastAPI 앱 + 라이프사이클
│   ├── core/
│   │   ├── config.py                 # Pydantic 환경설정
│   │   ├── database.py               # AsyncPG 연결 풀
│   │   └── cache.py                  # Redis 캐시 유틸
│   ├── models/
│   │   ├── stock.py                  # Stock + UNIQUE(ticker, exchange)
│   │   ├── price.py                  # PriceSnapshot + IndexSnapshot + Index()
│   │   └── news_analysis.py          # NewsAnalysis + PortfolioItem + Index()
│   ├── schemas/
│   │   ├── stock.py                  # Pydantic 요청/응답 스키마
│   │   ├── analysis.py               # 뉴스 분석 스키마
│   │   └── index.py                  # 지수 스키마
│   ├── routers/
│   │   ├── indices.py                # GET /api/v1/indices
│   │   ├── stocks.py                 # GET /search, /{ticker}, /price, /news
│   │   ├── portfolio.py              # GET/POST/DELETE/PATCH /api/v1/portfolio
│   │   ├── market.py                 # GET /api/v1/market/summary
│   │   └── admin.py                  # POST /api/v1/admin/refresh/{ticker}
│   ├── services/
│   │   ├── price_service.py          # yfinance 주가/지수 수집
│   │   ├── news_service.py           # RSS 뉴스 수집 + 프롬프트 포맷
│   │   ├── ai_service.py             # Claude API 뉴스 분석 + 시장 요약
│   │   └── scheduler_service.py      # APScheduler 설정 관리
│   └── tasks/
│       └── morning_update.py         # 일괄 업데이트 태스크
```

### 프론트엔드 (22개 파일)
```
frontend/
├── package.json, tsconfig.json, tailwind.config.ts, next.config.mjs
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (Inter 폰트, 메타)
│   ├── page.tsx                      # 메인 대시보드
│   ├── globals.css                   # CSS 변수 (라이트/다크)
│   └── stock/[ticker]/page.tsx       # 종목 상세 페이지
├── components/
│   ├── dashboard/
│   │   ├── IndexWidget.tsx           # 지수 카드 (KR/해외 색상 규칙)
│   │   ├── IndexGrid.tsx             # 8개 지수 그리드
│   │   ├── MarketSummary.tsx         # AI 시장 요약 배너
│   │   └── PortfolioSection.tsx      # 관심 종목 목록
│   ├── stock/
│   │   ├── StockCard.tsx             # 종목 카드 (가격+감성)
│   │   ├── StockHeader.tsx           # 상세 헤더 (가격+지표)
│   │   ├── StockChartSection.tsx     # 캔들스틱 차트 + 기간 탭
│   │   ├── NewsAnalysis.tsx          # AI 뉴스 분석 섹션
│   │   └── SentimentBadge.tsx        # 감성 스코어 배지
│   └── search/
│       ├── SearchBar.tsx             # 디바운스 검색
│       └── SearchResults.tsx         # 드롭다운 결과 + 추가
├── hooks/
│   ├── useIndices.ts
│   ├── usePortfolio.ts
│   ├── useStockDetail.ts
│   └── useNewsAnalysis.ts
├── lib/
│   ├── api.ts                        # API 클라이언트
│   ├── store.ts                      # Zustand 전역 상태
│   └── utils.ts                      # 포맷 유틸리티
└── types/
    └── index.ts                      # TypeScript 타입 7종
```

### 인프라 (3개 파일)
```
docker-compose.yml                    # PostgreSQL + Redis + Backend + Frontend
.env.example                          # 환경변수 템플릿
```

---

## 5. API 엔드포인트 요약

| Method | 경로 | 설명 | 캐시 |
|--------|------|------|------|
| GET | `/api/v1/indices` | 8개 지수 조회 | 15분 |
| GET | `/api/v1/stocks/search?q=` | 종목 검색 + in_portfolio | 5분 |
| GET | `/api/v1/stocks/{ticker}` | 종목 상세 정보 | 15분 |
| GET | `/api/v1/stocks/{ticker}/price` | 주가 차트 데이터 | 1시간 |
| GET | `/api/v1/stocks/{ticker}/news` | AI 뉴스 분석 | 24시간 |
| GET | `/api/v1/portfolio` | 관심 종목 목록 | - |
| POST | `/api/v1/portfolio` | 관심 종목 추가 | - |
| DELETE | `/api/v1/portfolio/{ticker}` | 관심 종목 삭제 | - |
| PATCH | `/api/v1/portfolio/{ticker}` | 그룹 변경 | - |
| GET | `/api/v1/market/summary` | AI 시장 요약 | 24시간 |
| POST | `/api/v1/admin/refresh/{ticker}` | 수동 갱신 트리거 | - |
| GET | `/health` | 헬스체크 | - |

---

## 6. DB 스키마

| 테이블 | 목적 | 주요 제약 |
|--------|------|----------|
| `stocks` | 종목 마스터 | UNIQUE(ticker, exchange) |
| `portfolio_items` | 관심 종목 | FK → stocks(CASCADE) |
| `price_snapshots` | 일별 주가 | UNIQUE(stock_id, date) + Index |
| `news_analyses` | AI 분석 결과 | UNIQUE(stock_id, date) + Index + CHECK(sentiment) |
| `index_snapshots` | 지수 스냅샷 | UNIQUE(code, date) + Index |

---

## 7. Gap 분석 이력

### 초기 분석 (Check Phase)
- **Match Rate: 82%**
- High Gap: 8개, Medium: 16개, Low: 10개

### Iteration 1 (Act Phase)
- **수정 항목: 13개** (High 6 + Medium 7)
- 주요 수정: schemas/ 디렉토리, admin.py, market.py, hooks/ 4개, scheduler_service.py, UNIQUE 제약, Index 3개, Zustand 필드, 키 통일, in_portfolio

### 최종 결과
- **Match Rate: 93%** (목표 90% 달성)
- 미수정 항목은 모두 의도적 설계 결정 (문서화됨)

---

## 8. 접근성 (WCAG 2.2 Level AA)

| 항목 | 구현 상태 |
|------|----------|
| 시맨틱 HTML | `<main>`, `<nav>`, `<article>`, `<section>` 사용 |
| 헤딩 구조 | `<h1>` 1개/페이지, `<h2>` 섹션별 |
| ARIA 레이블 | 검색, 차트, 뉴스 분석, 목록에 aria-label 적용 |
| 키보드 내비게이션 | focus-visible:ring-2 스타일, 탭 순서 보장 |
| 색상 대비 | CSS 변수 기반 라이트/다크 지원 |
| 동작 감소 | prefers-reduced-motion: reduce 대응 |
| 실시간 갱신 | aria-live="polite" (시장 요약) |

---

## 9. 예상 운영 비용 (월)

| 항목 | 서비스 | 비용 |
|------|--------|------|
| 프론트 호스팅 | Vercel 무료 티어 | $0 |
| 백엔드 호스팅 | Railway ($5 크레딧) | $0~$5 |
| DB | Supabase 무료 티어 | $0 |
| 캐시 | Upstash Redis 무료 티어 | $0 |
| AI 분석 | Claude API (20종목 × 2회/일) | $2~$5 |
| **합계** | | **$2~$10/월** |

---

## 10. 실행 방법

```bash
# 1. 환경 설정
cp .env.example .env
# .env에 ANTHROPIC_API_KEY 입력

# 2. Docker Compose 실행
docker compose up -d

# 3. 접속
# 프론트엔드: http://localhost:3000
# 백엔드 API: http://localhost:8000
# API 문서: http://localhost:8000/docs
```

---

## 11. 향후 확장 계획 (v2.0)

| 우선순위 | 기능 | 설명 |
|---------|------|------|
| P1 | 포트폴리오 수익률 | 매수 단가 입력 → 수익률 자동 계산 |
| P1 | 실시간 WebSocket | 장중 실시간 주가 업데이트 |
| P2 | 섹터 히트맵 | 업종별 등락률 시각화 |
| P2 | 커스텀 알림 | 급등락(±5%), 중요 뉴스 푸시 |
| P3 | 모바일 앱 | React Native 크로스플랫폼 |
| P3 | 종목 상관관계 | 포트폴리오 내 종목 간 분석 |

---

## 12. 교훈 (Lessons Learned)

### 잘된 점
1. **PDCA 사이클이 효과적**: Plan → Design → Do → Check → Act 순서로 진행하여 구조적으로 누락 없이 구현
2. **Gap 분석 1회 iteration으로 93% 달성**: 설계 문서가 상세할수록 구현 품질이 높아짐
3. **Claude AI 활용 비용 효율적**: 개인 프로젝트 기준 월 $10 이하로 매일 자동 분석 가능

### 개선할 점
1. **초기 구현 시 schemas/ 누락**: Design에 명시했지만 Do 단계에서 빠뜨림 → 체크리스트 활용 권장
2. **컴포넌트 명명 차이**: Design과 다른 이름으로 구현 → 설계 반영 시점 명확화 필요
3. **커스텀 훅 미구현**: 컴포넌트에 인라인으로 작성 후 리팩토링 → TDD 방식이 더 적합했을 수 있음

---

*보고서 생성일: 2026-04-10 | PDCA Cycle: Plan → Design → Do → Check(82%) → Act(93%) → Report*
