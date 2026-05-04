import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { createAppTheme } from '@/theme/appTheme'

type ThemeModeContextValue = {
  mode: 'light' | 'dark'
  toggleMode: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('sa_theme')
    return stored === 'dark' ? 'dark' : 'light'
  })

  const toggleMode = useCallback(() => {
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light'
      localStorage.setItem('sa_theme', next)
      return next
    })
  }, [])

  const theme = useMemo(() => createAppTheme(mode), [mode])
  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode])

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook provider ilə eyni modulda saxlanılır
export function useThemeMode() {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider')
  return ctx
}
