import type { AuthUser, UserRole } from '@/types/user'

function getSigningSecret(): string {
  return import.meta.env.VITE_AUTH_JWT_SECRET ?? 'sa-local-auth-signing-key-change-in-production'
}

const text = new TextEncoder()

function toB64url(data: BufferSource): string {
  const bytes =
    data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  let bin = ''
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', text.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

type TokenPayload = {
  v: 1
  sub: string
  email: string
  role: UserRole
  fullName: string
  exp: number
}

export async function createAuthToken(user: AuthUser, ttlMs = 7 * 24 * 60 * 60 * 1000): Promise<string> {
  const secret = getSigningSecret()
  const payload: TokenPayload = {
    v: 1,
    sub: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    exp: Date.now() + ttlMs,
  }
  const payloadStr = JSON.stringify(payload)
  const payloadB64 = toB64url(text.encode(payloadStr))
  const key = await importHmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, text.encode(payloadB64))
  return `${payloadB64}.${toB64url(sig)}`
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sigB64] = parts
  if (!payloadB64 || !sigB64) return null
  const secret = getSigningSecret()
  try {
    const key = await importHmacKey(secret)
    const sigBytes = fromB64url(sigB64)
    const ok = await crypto.subtle.verify('HMAC', key, sigBytes as BufferSource, text.encode(payloadB64))
    if (!ok) return null
    const json = new TextDecoder().decode(fromB64url(payloadB64))
    const payload = JSON.parse(json) as TokenPayload
    if (payload.v !== 1 || !payload.sub || !payload.email || !payload.role || !payload.exp) return null
    if (Date.now() > payload.exp) return null
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      fullName: payload.fullName || payload.email.split('@')[0] || 'İstifadəçi',
    }
  } catch {
    return null
  }
}
