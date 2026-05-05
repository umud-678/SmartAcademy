import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { enqueueSnackbar } from 'notistack'
import { verifyAuthToken } from '@/lib/authToken'
import type { AuthUser } from '@/types/user'

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  authReady: boolean
  applySession: (next: { token: string; user: AuthUser; remember?: boolean }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_TOKEN = 'sa_token'
const STORAGE_USER = 'sa_user'
const SESSION_TOKEN = 'sa_token_session'
const SESSION_USER = 'sa_user_session'

function readTokenRaw(): string | null {
  return localStorage.getItem(STORAGE_TOKEN) ?? sessionStorage.getItem(SESSION_TOKEN)
}

function clearAllAuthStorage() {
  localStorage.removeItem(STORAGE_TOKEN)
  localStorage.removeItem(STORAGE_USER)
  sessionStorage.removeItem(SESSION_TOKEN)
  sessionStorage.removeItem(SESSION_USER)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const tokenRef = useRef<string | null>(null)
  tokenRef.current = token

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const t = readTokenRaw()
      if (!t) {
        if (!cancelled) {
          setToken(null)
          setUser(null)
          setAuthReady(true)
        }
        return
      }
      const verified = await verifyAuthToken(t)
      if (cancelled) return
      if (!verified) {
        clearAllAuthStorage()
        setToken(null)
        setUser(null)
      } else {
        if (sessionStorage.getItem(SESSION_TOKEN) === t) {
          sessionStorage.setItem(SESSION_USER, JSON.stringify(verified))
        } else {
          localStorage.setItem(STORAGE_USER, JSON.stringify(verified))
        }
        setToken(t)
        setUser(verified)
      }
      setAuthReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /** Token müddəti və ya imza etibarsız olduqda sessiya bağlanır. */
  useEffect(() => {
    if (!authReady) return
    const id = window.setInterval(() => {
      void (async () => {
        const t = tokenRef.current
        if (!t) return
        const verified = await verifyAuthToken(t)
        if (!verified) {
          clearAllAuthStorage()
          setToken(null)
          setUser(null)
          enqueueSnackbar('Sessiyanın müddəti bitdi və ya giriş etibarsızdır. Yenidən daxil olun.', { variant: 'warning' })
        }
      })()
    }, 45_000)
    return () => window.clearInterval(id)
  }, [authReady])

  const applySession = useCallback((next: { token: string; user: AuthUser; remember?: boolean }) => {
    const remember = next.remember !== false
    clearAllAuthStorage()
    if (remember) {
      localStorage.setItem(STORAGE_TOKEN, next.token)
      localStorage.setItem(STORAGE_USER, JSON.stringify(next.user))
    } else {
      sessionStorage.setItem(SESSION_TOKEN, next.token)
      sessionStorage.setItem(SESSION_USER, JSON.stringify(next.user))
    }
    setToken(next.token)
    setUser(next.user)
  }, [])

  const logout = useCallback(() => {
    clearAllAuthStorage()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      authReady,
      isAuthenticated: Boolean(authReady && token && user),
      applySession,
      logout,
    }),
    [user, token, authReady, applySession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook provider ilə eyni modulda saxlanılır
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth yalnız AuthProvider daxilində istifadə olunmalıdır')
  return ctx
}
