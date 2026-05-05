/** Şifrə xəşi üçün sabit duz (serverdə env ilə əvəz olunmalıdır). */
export const AUTH_PASSWORD_PEPPER = 'sa-auth-pepper-v1'

/** `demo` şifrəsi + AUTH_PASSWORD_PEPPER üçün SHA-256 (hex). Seed və köhnə localStorage miqrasiyası. */
export const AUTH_DEMO_PASSWORD_HASH_HEX =
  'b43a9cac8d4a4aa5ddf7d5332fbc9a58166e53d66fbef32b6942122ba03ed93b'

function enc(): TextEncoder {
  return new TextEncoder()
}

export async function hashPassword(plain: string): Promise<string> {
  const raw = enc().encode(`${AUTH_PASSWORD_PEPPER}:${plain}`)
  const buf = await crypto.subtle.digest('SHA-256', raw)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(plain: string, hashHex: string): Promise<boolean> {
  if (!hashHex) return false
  const h = await hashPassword(plain)
  if (h.length !== hashHex.length) return false
  let diff = 0
  for (let i = 0; i < h.length; i++) diff |= h.charCodeAt(i) ^ hashHex.charCodeAt(i)
  return diff === 0
}

export function validatePasswordPolicy(password: string): string | null {
  const p = password.trim()
  if (p.length < 8) return 'Şifrə minimum 8 simvol olmalıdır.'
  if (!/[A-Z]/.test(p)) return 'Şifrədə ən azı 1 böyük hərf olmalıdır.'
  if (!/[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?`~]/.test(p)) return 'Şifrədə ən azı 1 xüsusi işarə olmalıdır.'
  return null
}
