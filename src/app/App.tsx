import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'
import { AppRouter } from '@/app/router'
import { AdminDataProvider } from '@/contexts/AdminDataContext'
import { AdminShellProvider } from '@/contexts/AdminShellContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeModeProvider } from '@/theme/ThemeModeContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <AuthProvider>
            <AdminDataProvider>
              <AdminShellProvider>
                <BrowserRouter>
                  <AppRouter />
                </BrowserRouter>
              </AdminShellProvider>
            </AdminDataProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  )
}
