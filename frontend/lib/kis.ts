/**
 * 한국투자증권 KIS Developers Open API 클라이언트
 * https://apiportal.koreainvestment.com
 *
 * 환경변수:
 *   KIS_APP_KEY, KIS_APP_SECRET — KIS Developers에서 발급
 *   KIS_ACCOUNT_NO — 계좌번호 (예: 50012345-01)
 *   KIS_BASE_URL — 실전: https://openapi.koreainvestment.com:9443 / 모의: https://openapivts.koreainvestment.com:29443
 */

import { cacheGet, cacheSet } from './cache'

const BASE_URL = process.env.KIS_BASE_URL || 'https://openapivts.koreainvestment.com:29443'
const APP_KEY = process.env.KIS_APP_KEY || ''
const APP_SECRET = process.env.KIS_APP_SECRET || ''

let cachedToken: { token: string; expiresAt: number } | null = null

/** OAuth 토큰 발급 (24시간 유효) */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const res = await fetch(`${BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: APP_KEY,
      appsecret: APP_SECRET,
    }),
  })

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000, // 23시간
  }
  return cachedToken.token
}

/** KIS API 공통 호출 */
async function kisRequest(path: string, trId: string, params: Record<string, string> = {}): Promise<any> {
  const token = await getAccessToken()
  const query = new URLSearchParams(params).toString()
  const url = `${BASE_URL}${path}${query ? '?' + query : ''}`

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      authorization: `Bearer ${token}`,
      appkey: APP_KEY,
      appsecret: APP_SECRET,
      tr_id: trId,
    },
  })

  return res.json()
}

/** KIS API 사용 가능 여부 */
export function isKisAvailable(): boolean {
  return !!(APP_KEY && APP_SECRET)
}

/** 국내주식 현재가 조회 */
export async function getDomesticStockPrice(ticker: string) {
  const cacheKey = `kis:dom:${ticker}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const data = await kisRequest(
    '/uapi/domestic-stock/v1/quotations/inquire-price',
    'FHKST01010100',
    { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: ticker }
  )

  if (data.rt_cd !== '0') return null

  const o = data.output
  const result = {
    ticker,
    name: o.hts_kor_isnm,
    current_price: Number(o.stck_prpr),
    change: Number(o.prdy_vrss),
    change_pct: Number(o.prdy_ctrt),
    open: Number(o.stck_oprc),
    high: Number(o.stck_hgpr),
    low: Number(o.stck_lwpr),
    volume: Number(o.acml_vol),
    market_cap: Number(o.hts_avls),
    per: Number(o.per) || null,
    pbr: Number(o.pbr) || null,
    eps: Number(o.eps) || null,
    week52_high: Number(o.stck_dryy_hgpr) || null,
    week52_low: Number(o.stck_dryy_lwpr) || null,
    market: 'KR',
    exchange: o.rprs_mrkt_kor_name || 'KOSPI',
    updated_at: new Date().toISOString(),
  }

  cacheSet(cacheKey, result, 10 * 1000) // 10초 캐시 (실시간)
  return result
}

/** 해외주식 현재가 조회 */
export async function getOverseasStockPrice(ticker: string, exchange: string = 'NAS') {
  const cacheKey = `kis:ovs:${ticker}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  // 거래소 코드: NAS(나스닥), NYS(뉴욕), AMS(아멕스), HKS(홍콩), SHS(상해), SZS(심천), TSE(도쿄), LIS(런던)
  const exchMap: Record<string, string> = {
    NASDAQ: 'NAS', NYSE: 'NYS', AMEX: 'AMS', NAS: 'NAS', NYS: 'NYS',
  }
  const exchCode = exchMap[exchange.toUpperCase()] || 'NAS'

  const data = await kisRequest(
    '/uapi/overseas-price/v1/quotations/price',
    'HHDFS00000300',
    { AUTH: '', EXCD: exchCode, SYMB: ticker }
  )

  if (data.rt_cd !== '0') return null

  const o = data.output
  const result = {
    ticker,
    name: o.rsym || ticker,
    current_price: Number(o.last),
    change: Number(o.diff),
    change_pct: Number(o.rate),
    open: Number(o.open),
    high: Number(o.high),
    low: Number(o.low),
    volume: Number(o.tvol),
    market_cap: null,
    per: null,
    pbr: null,
    eps: null,
    week52_high: Number(o.h52p) || null,
    week52_low: Number(o.l52p) || null,
    market: 'US',
    exchange: exchCode,
    updated_at: new Date().toISOString(),
  }

  cacheSet(cacheKey, result, 10 * 1000)
  return result
}

/** 국내 주요지수 조회 */
export async function getDomesticIndex(indexCode: string) {
  const cacheKey = `kis:idx:${indexCode}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  // 지수 코드: 0001(코스피), 1001(코스닥), 2001(코스피200)
  const data = await kisRequest(
    '/uapi/domestic-stock/v1/quotations/inquire-index-price',
    'FHPUP02100000',
    { FID_COND_MRKT_DIV_CODE: 'U', FID_INPUT_ISCD: indexCode }
  )

  if (data.rt_cd !== '0') return null

  const o = data.output
  return {
    value: Number(o.bstp_nmix_prpr),
    change: Number(o.bstp_nmix_prdy_vrss),
    change_pct: Number(o.bstp_nmix_prdy_ctrt),
    updated_at: new Date().toISOString(),
  }
}
