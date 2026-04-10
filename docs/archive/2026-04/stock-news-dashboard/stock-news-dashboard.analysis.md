# [Check] stock-news-dashboard — Gap Analysis

> **Match Rate: 82%**
> **Analysis Date**: 2026-04-10
> **Design**: docs/02-design/features/stock-news-dashboard.design.md

---

## 종합 점수

| 카테고리 | 점수 | 상태 |
|---------|:----:|:----:|
| 파일 구조 | 72% | WARNING |
| DB 스키마 | 95% | PASS |
| API 엔드포인트 | 82% | WARNING |
| 컴포넌트 | 78% | WARNING |
| 타입 정의 | 92% | PASS |
| 상태 관리 (Zustand) | 85% | WARNING |
| 캐싱 전략 | 90% | PASS |
| 스케줄러 | 85% | WARNING |
| 인프라/환경 | 60% | FAIL |
| **전체** | **82%** | **WARNING** |

---

## 구현 완료 항목 (PASS) — 28개

- DB 모델 5개 테이블 (stocks, portfolio_items, price_snapshots, news_analyses, index_snapshots)
- DB 제약 조건 (UniqueConstraint, CheckConstraint, FK cascade)
- API: GET /api/v1/indices (15분 캐시)
- API: GET /api/v1/stocks/search (최소 2자, market 필터)
- API: GET /api/v1/stocks/{ticker} (주가 전체 필드)
- API: GET /api/v1/stocks/{ticker}/price (period 검증, candle 형식)
- API: GET /api/v1/stocks/{ticker}/news (DB조회 + 실시간 fallback)
- API: GET /api/v1/portfolio (감성 데이터 포함)
- API: POST /api/v1/portfolio (중복 409, 종목 자동 생성)
- API: DELETE /api/v1/portfolio/{ticker} (204)
- API: PATCH /api/v1/portfolio/{ticker} (그룹 변경)
- IndexWidget, SentimentBadge, NewsAnalysis, StockCard, SearchBar, SearchResults, StockChartSection 컴포넌트
- IndexWidget 색상 규칙 (KR: 빨강/파랑, 해외: 초록/빨강)
- Zustand 스토어 (포트폴리오 CRUD + 검색 + persist)
- TypeScript 타입 7종 (IndexData, StockDetail, NewsAnalysis, PortfolioItem, CandleData, NewsSource, StockSearchResult)
- Claude AI 프롬프트 2종 (뉴스 분석 + 시장 요약)
- Redis 캐시 5종 (15분/15분/24시간/1시간/5분)
- 스케줄러 (평일 08:00 / 15:30)
- 아침 업데이트 태스크 (지수 + 시장 요약 + 종목 분석)

---

## Gap 목록

### HIGH Priority — 즉시 수정 필요 (8개)

| # | 항목 | 설명 |
|---|------|------|
| H-1 | `routers/admin.py` 파일 없음 | admin 엔드포인트가 main.py에 `GET`으로 인라인 선언됨 (설계: 별도 파일 + `POST`) |
| H-2 | Admin 엔드포인트 메서드 오류 | 설계: `POST /api/v1/admin/refresh/{ticker}`, 구현: `GET`. `estimated_at` 필드도 누락 |
| H-3 | `schemas/` 디렉토리 없음 | stock.py, analysis.py, index.py Pydantic 응답 스키마 미구현. API가 raw dict 반환 |
| H-4 | `services/scheduler_service.py` 없음 | 스케줄러 로직이 main.py에 인라인 선언됨 |
| H-5 | `GET /api/v1/market/summary` 라우터 없음 | 프론트엔드가 호출하지만 백엔드에 라우터 미정의. 스케줄러는 캐시에 저장하지만 서빙 엔드포인트 없음 |
| H-6 | `frontend/hooks/` 디렉토리 없음 | useIndices, usePortfolio, useStockDetail, useNewsAnalysis 훅 미구현. 컴포넌트에 인라인으로 처리 |
| H-7 | `.env.example` 파일 없음 | 프로젝트 루트에 환경변수 예시 파일 없음 |
| H-8 | `frontend/app/api/proxy/route.ts` 없음 | CORS 프록시 라우트 미구현. 프론트엔드가 백엔드 직접 호출 |

### MEDIUM Priority — 단기 수정 (16개)

| # | 항목 | 설계 | 구현 |
|---|------|------|------|
| M-1 | 컴포넌트명 불일치 | `PortfolioList.tsx` | `PortfolioSection.tsx` |
| M-2 | 컴포넌트명 불일치 | `StockChart.tsx` | `StockChartSection.tsx` |
| M-3 | StockInfo 컴포넌트 없음 | 독립 컴포넌트 | `StockHeader.tsx`에 통합 |
| M-4 | NewsList 컴포넌트 없음 | 독립 컴포넌트 | `NewsAnalysis.tsx`에 통합 |
| M-5 | `tasks/midday_update.py` 없음 | 별도 파일 | `morning_update.py`의 `run_full_update` 공유 |
| M-6 | Zustand `updateGroup` 없음 | store에 정의됨 | api.ts에만 있고 store에 없음 |
| M-7 | Zustand `selectedTicker` 없음 | store에 정의됨 | 미구현 |
| M-8 | Stock 모델 UNIQUE 제약 없음 | `UNIQUE (ticker, exchange)` | `__table_args__` 미정의 |
| M-9 | DB 인덱스 3개 없음 | 3개 Index() 명시 | SQLAlchemy에 Index() 정의 없음 |
| M-10 | `week52High` 키 불일치 | `week52_high` | `week_52_high` |
| M-11 | 검색 응답 `in_portfolio` 없음 | 백엔드가 반환 | 프론트엔드 클라이언트 사이드 처리 |
| M-12 | `models/index_snapshot.py` 없음 | 별도 파일 | `models/price.py`에 통합 |
| M-13 | `services/scheduler_service.py` 없음 | 별도 파일 | main.py에 인라인 |
| M-14 | Pydantic 스키마 인라인 선언 | schemas/ 디렉토리 | 라우터 파일에 인라인 |
| M-15 | `useIndices` 등 커스텀 훅 없음 | hooks/ 디렉토리 | 컴포넌트에 인라인 useEffect |
| M-16 | alembic 설정 없음 | alembic/ 디렉토리 | 미구성 |

### LOW Priority (10개)
- L-1~L-10: 컴포넌트 ui/ 디렉토리, 타입 확장, 옵셔널 필드, 설계 문서 업데이트 등 (기능 영향 없음)

---

## Match Rate 계산 상세

| 카테고리 | 설계 항목 | 구현 항목 | 비율 |
|---------|:--------:|:--------:|:----:|
| 백엔드 파일 구조 | 17 | 12 | 71% |
| 프론트 파일 구조 | 18 | 13 | 72% |
| DB 스키마 (테이블) | 5 | 5 | 100% |
| DB 스키마 (컬럼) | ~40 | 39 | 98% |
| DB 스키마 (제약/인덱스) | 6 | 3 | 50% |
| API 엔드포인트 | 9 | 7.5 | 83% |
| 컴포넌트 Props | 4 | 4 | 100% |
| TypeScript 타입 | 5 | 5 | 100% |
| Zustand 스토어 | 9 | 7 | 78% |
| 캐싱 전략 | 5 | 5 | 100% |
| 스케줄러 | 2 | 2 | 100% |
| AI 프롬프트 | 3 | 3 | 100% |
| 인프라 파일 | 3 | 1 | 33% |

**전체 Match Rate: 82%** (목표: 90% 이상)

---

## 권장 조치 순서

### 즉시 (High Priority)
1. `backend/app/schemas/` 디렉토리 생성 + Pydantic 스키마 구현
2. `backend/app/routers/admin.py` 생성, `POST`로 변경, `estimated_at` 추가
3. `GET /api/v1/market/summary` 라우터 추가
4. `.env.example` 파일 루트에 생성
5. `Stock` 모델에 `UNIQUE(ticker, exchange)` 제약 추가
6. DB 인덱스 3개 SQLAlchemy `Index()` 정의

### 단기 (Medium Priority)
7. `frontend/hooks/` 커스텀 훅 4개 추출
8. Zustand에 `updateGroup`, `selectedTicker` 추가
9. `week_52_high` → `week52_high` 키 통일
10. `GET /api/v1/stocks/search` 응답에 `in_portfolio` 필드 추가
