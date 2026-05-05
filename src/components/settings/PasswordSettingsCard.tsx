import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminData } from '@/contexts/AdminDataContext'
import { hashPassword, validatePasswordPolicy } from '@/lib/authCredentials'
import type { AppUserRole } from '@/types/admin'

export function PasswordSettingsCard({ role }: { role: Extract<AppUserRole, 'student' | 'teacher'> }) {
  const { user, token, applySession } = useAuth()
  const { state, appUserUpdate } = useAdminData()
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const appUser = useMemo(() => {
    const email = user?.email?.trim().toLowerCase()
    if (!email) return undefined
    return state.appUsers.find((u) => u.role === role && u.email.trim().toLowerCase() === email)
  }, [role, state.appUsers, user?.email])

  const savePassword = async () => {
    if (!user || !token || !appUser) {
      enqueueSnackbar('Hesab məlumatı tapılmadı. Admin ilə əlaqə saxlayın.', { variant: 'error' })
      return
    }
    if (!currentPwd.trim() || !newPwd.trim() || !confirmPwd.trim()) {
      enqueueSnackbar('Cari şifrə, yeni şifrə və təkrar xanasını doldurun.', { variant: 'warning' })
      return
    }
    if (newPwd.trim() !== confirmPwd.trim()) {
      enqueueSnackbar('Yeni şifrə ilə təkrar şifrə eyni deyil.', { variant: 'warning' })
      return
    }
    const policyError = validatePasswordPolicy(newPwd)
    if (policyError) {
      enqueueSnackbar(policyError, { variant: 'warning' })
      return
    }

    setSaving(true)
    try {
      const currentHash = await hashPassword(currentPwd.trim())
      if (currentHash !== appUser.passwordHash) {
        enqueueSnackbar('Cari şifrə yanlışdır.', { variant: 'error' })
        return
      }
      const newHash = await hashPassword(newPwd.trim())
      appUserUpdate(appUser.id, { passwordHash: newHash, passwordTemporary: false })
      const remember = sessionStorage.getItem('sa_token_session') !== token
      applySession({ token, user: { ...user, mustChangePassword: false }, remember })
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      enqueueSnackbar('Parol uğurla dəyişdirildi.', { variant: 'success' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography fontWeight={800}>Təhlükəsizlik — parol</Typography>
          {user?.mustChangePassword ? (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Sizə admin tərəfindən müvəqqəti parol verilib. Davam etməzdən əvvəl parolu dəyişin.
            </Alert>
          ) : null}

          <TextField
            type={showCurrent ? 'text' : 'password'}
            label="Cari şifrə"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            autoComplete="current-password"
            fullWidth
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" size="small" onClick={() => setShowCurrent((v) => !v)} aria-label="Cari şifrəni göstər/gizlət">
                    {showCurrent ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            type={showNew ? 'text' : 'password'}
            label="Yeni şifrə"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            autoComplete="new-password"
            fullWidth
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" size="small" onClick={() => setShowNew((v) => !v)} aria-label="Yeni şifrəni göstər/gizlət">
                    {showNew ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            type={showConfirm ? 'text' : 'password'}
            label="Yeni şifrə (təkrar)"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            autoComplete="new-password"
            fullWidth
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" size="small" onClick={() => setShowConfirm((v) => !v)} aria-label="Təkrar şifrəni göstər/gizlət">
                    {showConfirm ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Typography variant="caption" color="text.secondary">
            Şərt: minimum 8 simvol, ən azı 1 böyük hərf və 1 xüsusi işarə.
          </Typography>

          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" disabled={saving} onClick={() => void savePassword()} sx={{ textTransform: 'none', fontWeight: 700 }}>
              {saving ? 'Saxlanılır…' : 'Parolu yenilə'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
