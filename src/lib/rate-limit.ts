import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiting para endpoints sensibles (auth).
 *
 * Backend híbrido:
 *   - Si están definidas UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN, usa
 *     Upstash Redis (sliding window) — robusto y consistente entre las
 *     instancias serverless de Vercel.
 *   - Si no, cae a un limitador en memoria (best-effort). En serverless cada
 *     instancia tiene su propia memoria, así que solo frena ráfagas contra la
 *     misma instancia. Sirve como red mínima; para protección real define las
 *     dos env vars de Upstash.
 */

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  /** epoch ms en que la ventana se libera */
  reset: number
}

const hasUpstash = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

const redis = hasUpstash ? Redis.fromEnv() : null

// Un Ratelimit de Upstash por combinación (limit, ventana), reutilizado entre requests.
const upstashLimiters = new Map<string, Ratelimit>()

function getUpstashLimiter(limit: number, windowSec: number): Ratelimit {
  const id = `${limit}:${windowSec}`
  let rl = upstashLimiters.get(id)
  if (!rl) {
    rl = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: 'rl',
      analytics: false,
    })
    upstashLimiters.set(id, rl)
  }
  return rl
}

// Fallback en memoria: sliding-window log por clave.
const memStore = new Map<string, number[]>()

function memLimit(key: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now()
  const windowMs = windowSec * 1000
  const hits = (memStore.get(key) ?? []).filter((ts) => now - ts < windowMs)

  const success = hits.length < limit
  if (success) hits.push(now)
  memStore.set(key, hits)

  // Limpieza oportunista para no crecer sin límite.
  if (memStore.size > 10_000) {
    for (const [k, v] of memStore) {
      const fresh = v.filter((ts) => now - ts < windowMs)
      if (fresh.length === 0) memStore.delete(k)
      else memStore.set(k, fresh)
    }
  }

  const oldest = hits[0] ?? now
  return {
    success,
    limit,
    remaining: Math.max(0, limit - hits.length),
    reset: oldest + windowMs,
  }
}

async function rateLimit(
  key: string,
  opts: { limit: number; windowSec: number }
): Promise<RateLimitResult> {
  const { limit, windowSec } = opts
  if (redis) {
    const res = await getUpstashLimiter(limit, windowSec).limit(key)
    return { success: res.success, limit: res.limit, remaining: res.remaining, reset: res.reset }
  }
  return memLimit(key, limit, windowSec)
}

export type RateLimitBucket = { key: string; limit: number; windowSec: number }

/**
 * Comprueba varios "buckets" en orden. Devuelve el resultado del primero que se
 * supere (para responder 429), o null si todos pasan.
 */
export async function enforceRateLimit(
  buckets: RateLimitBucket[]
): Promise<RateLimitResult | null> {
  for (const b of buckets) {
    const res = await rateLimit(b.key, b)
    if (!res.success) return res
  }
  return null
}

/** IP del cliente detrás del proxy de Vercel. */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? '127.0.0.1'
}

/** Respuesta 429 estándar con cabecera Retry-After. */
export function tooManyRequests(reset: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
  return NextResponse.json(
    { error: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  )
}
