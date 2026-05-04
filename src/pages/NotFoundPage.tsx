import { Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_HOME } from '@/types/user'

export function NotFoundPage() {
  const { user, isAuthenticated } = useAuth()
  const to = isAuthenticated && user ? ROLE_HOME[user.role] : '/login'

  return (
    <Stack spacing={2} sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={900}>
        404
      </Typography>
      <Typography color="text.secondary">Səhifə tapılmadı.</Typography>
      <Button component={RouterLink} to={to} variant="contained" sx={{ alignSelf: 'flex-start' }}>
        Geri qayıt
      </Button>
    </Stack>
  )
}
