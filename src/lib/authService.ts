import { verifyPassword } from '@/lib/authCredentials'
import { createAuthToken } from '@/lib/authToken'
import type { AdminAppUser, AdminStudent, AdminTeacher } from '@/types/admin'
import type { AuthUser, UserRole } from '@/types/user'

export type LoginFailureCode = 'not_found' | 'wrong_password' | 'inactive' | 'not_configured'

export type LoginResult =
  | { ok: true; user: AuthUser; token: string }
  | { ok: false; code: LoginFailureCode }

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

/** Eyni mobil nömrə üçün müxtəlif formatları uyğunlaşdırır (+994…, boşluqlar, son 9 rəqəm). */
function phonesMatch(inputRaw: string, storedRaw: string): boolean {
  const a = digitsOnly(inputRaw)
  const b = digitsOnly(storedRaw)
  if (!a || !b) return false
  if (a === b) return true
  const n = 9
  if (a.length >= n && b.length >= n) {
    if (a.endsWith(b.slice(-n)) || b.endsWith(a.slice(-n))) return true
  }
  return false
}

/** Giriş xanası: e-poçt və ya (bazada olan) tələbə telefonu → axtarış üçün e-poçt. */
function resolveLoginEmail(raw: string, students: AdminStudent[]): string {
  const t = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, '')
  if (!t) return ''
  if (t.includes('@')) return t.toLowerCase()
  const st = students.find((s) => phonesMatch(t, s.phone))
  if (st) return st.email.trim().toLowerCase()
  return t.toLowerCase()
}

function resolveFullName(app: AdminAppUser, teachers: AdminTeacher[], students: AdminStudent[]): string {
  const em = app.email.trim().toLowerCase()
  if (app.role === 'admin') return 'İdarəçi'
  const t = teachers.find((x) => x.email.trim().toLowerCase() === em)
  if (t) return t.name
  const s = students.find((x) => x.email.trim().toLowerCase() === em)
  if (s) return s.name
  const local = app.email.split('@')[0] ?? 'İstifadəçi'
  return local.slice(0, 1).toUpperCase() + local.slice(1)
}

export async function authenticateAppUser(
  emailRaw: string,
  password: string,
  appUsers: AdminAppUser[],
  teachers: AdminTeacher[],
  students: AdminStudent[],
): Promise<LoginResult> {
  const email = resolveLoginEmail(emailRaw, students)
  const plain = password.trim()
  if (!email || !plain) return { ok: false, code: 'wrong_password' }
  const row = appUsers.find((u) => u.email.trim().toLowerCase() === email)
  if (!row) return { ok: false, code: 'not_found' }
  if (!row.active) return { ok: false, code: 'inactive' }
  if (!row.passwordHash) return { ok: false, code: 'not_configured' }
  if (!(await verifyPassword(plain, row.passwordHash))) return { ok: false, code: 'wrong_password' }
  const role = row.role as UserRole
  const user: AuthUser = {
    id: row.id,
    email: row.email.trim(),
    role,
    fullName: resolveFullName(row, teachers, students),
  }
  const token = await createAuthToken(user)
  return { ok: true, user, token }
}
