import { Box, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { ReactNode } from 'react'

type AdminPageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: (t) =>
          t.palette.mode === 'light'
            ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
            : `linear-gradient(135deg, ${alpha('#1e293b', 0.55)} 0%, ${alpha(t.palette.background.paper, 0.98)} 55%, ${t.palette.background.paper} 100%)`,
        boxShadow: (t) =>
          t.palette.mode === 'light'
            ? '0 1px 3px rgba(15,23,42,0.06)'
            : `0 1px 0 ${alpha('#fff', 0.06)} inset, 0 8px 32px ${alpha('#000', 0.35)}`,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'flex-start' }}
        justifyContent="space-between"
        gap={2}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'text.primary',
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
            }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 720, lineHeight: 1.65 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        {actions ? <Box sx={{ flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: 1 }}>{actions}</Box> : null}
      </Stack>
    </Paper>
  )
}
