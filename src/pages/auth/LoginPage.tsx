import AppleIcon from '@mui/icons-material/Apple'
import FacebookIcon from '@mui/icons-material/Facebook'
import GoogleIcon from '@mui/icons-material/Google'
import TwitterIcon from '@mui/icons-material/Twitter'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { enqueueSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LoginIllustration } from '@/pages/auth/LoginIllustration'
import { useAdminData } from '@/contexts/AdminDataContext'
import { useAuth } from '@/contexts/AuthContext'
import { authenticateAppUser, type LoginFailureCode } from '@/lib/authService'
import { ROLE_HOME } from '@/types/user'

/** `true`: e-poçt tapılmadı və şifrə səhvi üçün eyni mesaj (enumeration əleyhinə). */
const LOGIN_OPAQUE_CREDENTIAL_ERRORS = true

const STORAGE_LOGIN_FAILS = 'sa_login_fail_count'

const INPUT_RADIUS = 10
const PILL_RADIUS = 999

const ui = {
  welcome: 'SmartAcademy-yə xoş gəlmisiniz',
  blurb:
    'Kurslar, davamiyyət və ödənişləri bir yerdə idarə edin. Məktəb və tədris mərkəzləri üçün aydın idarəetmə paneli.',
  join: 'İndi qoşul!',
  signInTitle: 'Daxil ol',
  emailPh: 'E-poçt və ya telefon',
  passPh: 'Şifrə',
  recover: 'Şifrəni bərpa et?',
  signInCta: 'Daxil ol',
  orWith: 'Və ya davam et',
  footerCopy: '© 2026 SmartAcademy. Bütün hüquqlar qorunur.',
  about: 'Haqqımızda',
  terms: 'İstifadə şərtləri',
  privacy: 'Məxfilik',
  cookies: 'Cookie siyasəti',
  register: 'Qeydiyyat',
  topSignIn: 'Daxil ol',
} as const

const LOGIN_ERRORS: Record<LoginFailureCode, string> = {
  not_found: 'Bu e-poçt üzrə istifadəçi tapılmadı.',
  wrong_password: 'Şifrə yanlışdır.',
  inactive: 'Hesab deaktivdir. İdarəçi ilə əlaqə saxlayın.',
  not_configured: 'Hesab üçün şifrə təyin edilməyib. İdarəçi ilə əlaqə saxlayın.',
}

function loginFailureMessage(code: LoginFailureCode): string {
  if (LOGIN_OPAQUE_CREDENTIAL_ERRORS && (code === 'not_found' || code === 'wrong_password')) {
    return 'E-poçt və ya şifrə yanlışdır.'
  }
  return LOGIN_ERRORS[code]
}

function readLoginFailCount(): number {
  try {
    const n = parseInt(sessionStorage.getItem(STORAGE_LOGIN_FAILS) || '0', 10)
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

function setLoginFailCount(n: number) {
  if (n <= 0) sessionStorage.removeItem(STORAGE_LOGIN_FAILS)
  else sessionStorage.setItem(STORAGE_LOGIN_FAILS, String(n))
}

export function LoginPage() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const primary = theme.palette.primary.main
  const pageBg = isDark ? theme.palette.background.default : '#F4F7FF'
  const textPrimary = theme.palette.text.primary
  const textMuted = theme.palette.text.secondary
  const registerBg = isDark ? alpha(primary, 0.16) : '#E8ECFF'
  const registerHoverBg = isDark ? alpha(primary, 0.24) : '#DCE3FF'
  const inputBg = isDark ? alpha(theme.palette.common.white, 0.06) : '#fff'
  const inputBorder = isDark ? alpha(theme.palette.common.white, 0.12) : '#E5E7EB'
  const inputBorderHover = isDark ? alpha(theme.palette.common.white, 0.2) : '#D1D5DB'
  const socialBg = isDark ? alpha(theme.palette.common.white, 0.06) : '#fff'
  const socialBorder = isDark ? alpha(theme.palette.common.white, 0.12) : '#E5E7EB'
  const socialHoverBg = isDark ? alpha(theme.palette.common.white, 0.1) : '#F9FAFB'

  const { isAuthenticated, user, authReady, applySession } = useAuth()
  const { state } = useAdminData()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [email, setEmail] = useState('telebe@demo.edu')
  const [password, setPassword] = useState('demo')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const fieldSx = useMemo(
    () => ({
      '& .MuiOutlinedInput-root': {
        borderRadius: `${INPUT_RADIUS}px`,
        bgcolor: inputBg,
        '& fieldset': { borderColor: inputBorder },
        '&:hover fieldset': { borderColor: inputBorderHover },
        '&.Mui-focused fieldset': { borderColor: primary },
      },
      '& .MuiInputLabel-root': { color: textMuted },
    }),
    [inputBg, inputBorder, inputBorderHover, primary, textMuted],
  )

  if (!authReady) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: pageBg }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isAuthenticated && user) {
    return <Navigate to={from && from !== '/login' ? from : ROLE_HOME[user.role]} replace />
  }

  const submit = async () => {
    if (!email.trim() || !password) {
      enqueueSnackbar('E-poçt və şifrə daxil edin', { variant: 'warning' })
      return
    }
    setBusy(true)
    try {
      const fails = readLoginFailCount()
      if (fails >= 3) {
        const delayMs = fails >= 5 ? 5000 : 2000
        await new Promise((r) => setTimeout(r, delayMs))
      }
      const r = await authenticateAppUser(email, password, state.appUsers, state.teachers, state.students)
      if (!r.ok) {
        if (r.code === 'not_found' || r.code === 'wrong_password') {
          setLoginFailCount(fails + 1)
        }
        enqueueSnackbar(loginFailureMessage(r.code), { variant: r.code === 'inactive' ? 'warning' : 'error' })
        return
      }
      setLoginFailCount(0)
      applySession({ token: r.token, user: r.user, remember: rememberMe })
      enqueueSnackbar('Giriş uğurlu', { variant: 'success' })
      navigate(from && from !== '/login' ? from : ROLE_HOME[r.user.role], { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: pageBg,
        color: textPrimary,
        ...(isDark && {
          backgroundImage: `radial-gradient(100% 60% at 50% 0%, ${alpha(primary, 0.14)} 0%, transparent 55%), linear-gradient(180deg, ${alpha('#0f172a', 0.5)} 0%, ${pageBg} 40%)`,
        }),
      }}
    >
      <Stack direction="row" justifyContent="flex-end" alignItems="center" flexWrap="wrap" gap={2} px={{ xs: 2, sm: 4 }} py={2}>
        <Typography component="span" sx={{ color: primary, fontWeight: 700, fontSize: 15, cursor: 'default' }}>
          {ui.topSignIn}
        </Typography>
        <Button
          variant="contained"
          disableElevation
          onClick={() => enqueueSnackbar('Qeydiyyat tezliklə əlavə olunacaq', { variant: 'info' })}
          sx={{
            bgcolor: registerBg,
            color: primary,
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 3,
            px: 2.5,
            boxShadow: 'none',
            '&:hover': { bgcolor: registerHoverBg, boxShadow: 'none' },
          }}
        >
          {ui.register}
        </Button>
      </Stack>

      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          alignItems: 'center',
          gap: { xs: 3, md: 6 },
          px: { xs: 2, sm: 4, md: 6, lg: 10 },
          py: { xs: 2, md: 4 },
          maxWidth: 1280,
          mx: 'auto',
          width: 1,
        }}
      >
        <Stack spacing={3} sx={{ display: { xs: 'none', md: 'flex' }, pr: { md: 2 } }}>
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: { md: '2.25rem', lg: '2.75rem' },
                lineHeight: 1.2,
                color: textPrimary,
                letterSpacing: '-0.02em',
              }}
            >
              {ui.welcome}
            </Typography>
            <Typography sx={{ mt: 2, color: textMuted, fontSize: 16, lineHeight: 1.65, maxWidth: 440 }}>
              {ui.blurb}
            </Typography>
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => enqueueSnackbar('Qoşulma tezliklə əlavə olunacaq', { variant: 'info' })}
              sx={{
                mt: 2,
                display: 'inline-block',
                color: primary,
                fontWeight: 700,
                fontSize: 16,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                p: 0,
              }}
            >
              {ui.join}
            </Link>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
            <LoginIllustration />
          </Box>
        </Stack>

        <Stack spacing={3} sx={{ maxWidth: 420, width: 1, mx: { xs: 'auto', md: 0 }, justifySelf: { md: 'end' } }}>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, lineHeight: 1.25 }}>
              {ui.welcome}
            </Typography>
            <Typography sx={{ mt: 1, color: textMuted, fontSize: 14, lineHeight: 1.55 }}>
              {ui.blurb}
            </Typography>
            <Box sx={{ mt: 2, maxHeight: 160, overflow: 'hidden' }}>
              <LoginIllustration />
            </Box>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary }}>
            {ui.signInTitle}
          </Typography>

          <TextField
            fullWidth
            placeholder={ui.emailPh}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            disabled={busy}
            sx={fieldSx}
          />
          <TextField
            fullWidth
            placeholder={ui.passPh}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={busy}
            sx={fieldSx}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Şifrəni göstər/gizlət"
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                    sx={{ color: textMuted }}
                  >
                    {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ textAlign: 'right', mt: -1 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => enqueueSnackbar('Bərpa linki tezliklə əlavə olunacaq', { variant: 'info' })}
              sx={{ color: textMuted, fontSize: 13, cursor: 'pointer', border: 'none', background: 'none' }}
            >
              {ui.recover}
            </Link>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.5 }}>
            Giriş üçün <b>panel istifadəçisi</b> lazımdır (Admin → Tənzimləmələr — istifadəçilər). Yalnız tələbə kartındakı e-poçt kifayət etmir,
            həmin ünvan ayrıca istifadəçi kimi əlavə olunmalıdır. E-poçt və ya bazada olan tələbə telefonu daxil edə bilərsiniz. Nümunə:{' '}
            <b>admin@smartacademy.edu</b>, <b>telebe@demo.edu</b> və ya telefon <b>+994501112233</b> (şifrə: <b>demo</b>).
          </Typography>

          <FormControlLabel
            control={<Checkbox checked={rememberMe} onChange={(_, c) => setRememberMe(c)} size="small" disabled={busy} />}
            label={
              <Typography variant="body2">
                Məni xatırla — söndürülsə, giriş yalnız bu brauzer sessiyası üçün saxlanılır (cihazı bağlayanda çıxış).
              </Typography>
            }
            sx={{ alignSelf: 'flex-start', mt: -0.5 }}
          />

          <Button
            fullWidth
            size="large"
            variant="contained"
            disableElevation
            disabled={busy}
            onClick={() => void submit()}
            sx={{
              py: 1.75,
              borderRadius: PILL_RADIUS,
              bgcolor: primary,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 16,
              boxShadow: `0 8px 24px ${alpha(primary, 0.35)}`,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
                boxShadow: `0 10px 28px ${alpha(primary, 0.42)}`,
              },
            }}
          >
            {busy ? (
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                <CircularProgress size={22} color="inherit" />
                <span>Giriş…</span>
              </Stack>
            ) : (
              ui.signInCta
            )}
          </Button>

          <Stack direction="row" alignItems="center" spacing={2} sx={{ color: textMuted }}>
            <Divider sx={{ flex: 1, borderColor: 'divider' }} />
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
              {ui.orWith}
            </Typography>
            <Divider sx={{ flex: 1, borderColor: 'divider' }} />
          </Stack>

          <Stack direction="row" spacing={2} justifyContent="center">
            {(
              [
                { Icon: GoogleIcon, label: 'Google', color: '#EA4335' },
                { Icon: TwitterIcon, label: 'Twitter', color: '#1DA1F2' },
                { Icon: FacebookIcon, label: 'Facebook', color: '#1877F2' },
                { Icon: AppleIcon, label: 'Apple', color: textPrimary },
              ] as const
            ).map(({ Icon, label, color }) => (
              <IconButton
                key={label}
                aria-label={label}
                onClick={() => enqueueSnackbar(`${label}: tezliklə`, { variant: 'info' })}
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  bgcolor: socialBg,
                  border: `1px solid ${socialBorder}`,
                  color,
                  '&:hover': { bgcolor: socialHoverBg, borderColor: inputBorderHover },
                }}
              >
                <Icon sx={{ fontSize: 22 }} />
              </IconButton>
            ))}
          </Stack>
        </Stack>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        sx={{
          px: { xs: 2, sm: 4 },
          py: 2.5,
          borderTop: 1,
          borderColor: 'divider',
          color: textMuted,
          fontSize: 13,
        }}
      >
        <Typography variant="body2" sx={{ color: textMuted, fontSize: 13 }}>
          {ui.footerCopy}
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={2} justifyContent="center">
          {[ui.about, ui.terms, ui.privacy, ui.cookies].map((item) => (
            <Link
              key={item}
              component="button"
              type="button"
              variant="body2"
              onClick={() => enqueueSnackbar(item, { variant: 'info' })}
              sx={{ color: textMuted, fontSize: 13, cursor: 'pointer', border: 'none', background: 'none' }}
            >
              {item}
            </Link>
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}
