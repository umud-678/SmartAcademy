import { Box, Tab, Tabs } from '@mui/material'
import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export function AdminPaymentsLayout() {
  const navigate = useNavigate()
  const loc = useLocation()
  const tab = useMemo(() => (loc.pathname.includes('/payments/students') ? 1 : 0), [loc.pathname])

  return (
    <Box>
      <AdminPageHeader
        title="Ödənişlər"
        description="Ümumi nəzarət, gecikmələr və hər tələbənin güzəşt / taksit planı — detallı redaktə tələbə kartında."
      />
      <Tabs
        value={tab}
        onChange={(_, v) => navigate(v === 0 ? '/admin/payments/dashboard' : '/admin/payments/students')}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Ödəniş paneli" sx={{ textTransform: 'none', fontWeight: 700 }} />
        <Tab label="Tələbə ödənişləri" sx={{ textTransform: 'none', fontWeight: 700 }} />
      </Tabs>
      <Outlet />
    </Box>
  )
}
