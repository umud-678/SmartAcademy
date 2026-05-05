import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Stack, Typography } from '@mui/material'
import { PasswordSettingsCard } from '@/components/settings/PasswordSettingsCard'

export function StudentSettingsPage() {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <SettingsOutlinedIcon color="primary" />
        <Typography variant="h5" fontWeight={900}>
          Ayarlar
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Hesab təhlükəsizliyi üçün parol ayarları.
      </Typography>
      <PasswordSettingsCard role="student" />
    </Stack>
  )
}
