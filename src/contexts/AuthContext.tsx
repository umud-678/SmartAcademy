import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser, UserRole } from '@/types/user'

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (params: { email: string; password: string; role: UserRole }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_TOKEN = 'sa_token'
const STORAGE_USER = 'sa_user'

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_TOKEN))
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  const login = useCallback(
    ({ email, role }: { email: string; password: string; role: UserRole }) => {
      const nextUser: AuthUser = {
        id: crypto.randomUUID(),
        email,
        fullName: email.split('@')[0] ?? 'İstifadəçi',
        role,
      }
      const fakeJwt = btoa(JSON.stringify({ sub: nextUser.id, role }))
      localStorage.setItem(STORAGE_TOKEN, fakeJwt)
      localStorage.setItem(STORAGE_USER, JSON.stringify(nextUser))
      setToken(fakeJwt)
      setUser(nextUser)
    },
    [],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN)
    localStorage.removeItem(STORAGE_USER)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [user, token, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook provider ilə eyni modulda saxlanılır
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth yalnız AuthProvider daxilində istifadə olunmalıdır')
  return ctx
}
