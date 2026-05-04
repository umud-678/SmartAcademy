import MenuIcon from '@mui/icons-material/Menu'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { enqueueSnackbar } from 'notistack'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { NAV_BY_ROLE, ROLE_ICON, ROLE_LABEL } from '@/app/navConfig'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminData } from '@/contexts/AdminDataContext'
import { useAdminShell } from '@/contexts/AdminShellContext'
import { teacherMenuAlertLines } from '@/lib/teacherPanelUtils'
import { useThemeMode } from '@/theme/ThemeModeContext'

const DRAWER_WIDTH_DEFAULT = 260
const DRAWER_WIDTH_ADMIN_ICON = 88

export function DashboardLayout({ children }: { children: ReactNode }) {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const { mode, toggleMode } = useThemeMode()
  const navigate = useNavigate()
  const adminData = useAdminData()
  const shell = useAdminShell()

  const navItems = useMemo(() => (user ? NAV_BY_ROLE[user.role] : []), [user])
  const isAdmin = user?.role === 'admin'
  const isTeacher = user?.role === 'teacher'
  const drawerWidth = isAdmin && isMdUp ? DRAWER_WIDTH_ADMIN_ICON : DRAWER_WIDTH_DEFAULT
  const isDark = theme.palette.mode === 'dark'

  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null)
  const [teacherNotifAnchor, setTeacherNotifAnchor] = useState<null | HTMLElement>(null)
  const unread = isAdmin ? adminData.state.notifications.filter((n) => !n.read).length : 0
  const teacherAlerts = useMemo(
    () => (isTeacher ? teacherMenuAlertLines(adminData.state, user?.email) : []),
    [isTeacher, adminData.state, user?.email],
  )

  const navButton = (item: (typeof navItems)[0], idx: number, compact: boolean) => {
    const btn = (
      <ListItemButton
        key={item.path}
        component={NavLink}
        to={item.path}
        end={idx === 0}
        onClick={() => setMobileOpen(false)}
        sx={{
          borderRadius: compact ? 2 : 1.5,
          mb: 0.5,
          justifyContent: compact ? 'center' : 'flex-start',
          minHeight: compact ? 48 : undefined,
          px: compact ? 1 : 2,
          '&.active': isAdmin
            ? {
                bgcolor: alpha(theme.palette.primary.main, 0.14),
                color: 'primary.main',
                boxShadow: compact ? 'none' : `inset 3px 0 0 ${theme.palette.primary.main}`,
              }
            : { bgcolor: 'action.selected' },
          ...(!isAdmin || !compact
            ? {}
            : {
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
              }),
        }}
      >
        <ListItemIcon sx={{ minWidth: compact ? 0 : 40, color: 'inherit', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
        {!compact ? <ListItemText primary={item.label} /> : null}
      </ListItemButton>
    )
    if (compact && isAdmin) {
      return (
        <Tooltip key={item.path} title={item.label} placement="right">
          {btn}
        </Tooltip>
      )
    }
    return btn
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          px: isAdmin && isMdUp ? 1 : 2,
          flexDirection: isAdmin && isMdUp ? 'column' : 'column',
          alignItems: isAdmin && isMdUp ? 'center' : 'flex-start',
          justifyContent: 'center',
          py: isAdmin && isMdUp ? 1.5 : 2,
          gap: 0.5,
        }}
      >
        {isAdmin && isMdUp ? (
          <Typography variant="subtitle1" fontWeight={900} sx={{ letterSpacing: -0.5 }}>
            SA
          </Typography>
        ) : (
          <>
            <Typography variant="h6" fontWeight={800} noWrap sx={{ letterSpacing: '-0.02em' }}>
              SmartAcademy
            </Typography>
            {isAdmin ? (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                İdarəçi
              </Typography>
            ) : user ? (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {user.role === 'teacher' ? 'Müəllim paneli' : user.role === 'student' ? 'Tələbə paneli' : ''}
              </Typography>
            ) : null}
          </>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ px: isAdmin && isMdUp ? 0.5 : 1, py: 1, flex: 1 }}>
        {navItems.map((item, idx) => navButton(item, idx, Boolean(isAdmin && isMdUp)))}
      </List>
      <Divider />
      <Box sx={{ p: isAdmin && isMdUp ? 1 : 2 }}>
        {!(isAdmin && isMdUp) ? (
          <>
            <Typography variant="caption" color="text.secondary">
              Rol
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              {user ? ROLE_ICON[user.role] : null}
              <Typography variant="body2" fontWeight={600}>
                {user ? ROLE_LABEL[user.role] : ''}
              </Typography>
            </Box>
          </>
        ) : (
          <Tooltip title={user?.fullName ?? ''} placement="right">
            <Avatar sx={{ width: 36, height: 36, mx: 'auto', bgcolor: 'primary.main', fontSize: 14 }}>
              {(user?.fullName ?? '?').slice(0, 1).toUpperCase()}
            </Avatar>
          </Tooltip>
        )}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: (t) =>
            isAdmin
              ? alpha(t.palette.background.paper, isDark ? 0.88 : 0.92)
              : t.palette.background.paper,
          backdropFilter: isAdmin ? 'blur(12px) saturate(160%)' : 'none',
          color: 'text.primary',
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          ...(isDark &&
            isAdmin && {
              boxShadow: `0 1px 0 ${alpha('#fff', 0.06)} inset`,
            }),
        }}
      >
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap', py: isAdmin ? 1 : 0 }}>
          {!isMdUp ? (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 0 }} aria-label="Menyu">
              <MenuIcon />
            </IconButton>
          ) : null}
          {isAdmin ? (
            <TextField
              size="small"
              placeholder="Tələbə, qrup, müəllim axtar…"
              value={shell.globalSearch}
              onChange={(e) => shell.setGlobalSearch(e.target.value)}
              sx={{
                flex: 1,
                minWidth: 200,
                maxWidth: 480,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: isDark ? alpha(theme.palette.common.white, 0.06) : theme.palette.grey[50],
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          ) : (
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h6" noWrap fontWeight={700}>
                {user?.fullName}
              </Typography>
            </Box>
          )}
          {isAdmin ? (
            <>
              <IconButton color="inherit" onClick={(e) => setNotifAnchor(e.currentTarget)} aria-label="Bildirişlər">
                <Badge badgeContent={unread} color="error" variant={unread ? 'standard' : 'dot'}>
                  <NotificationsNoneOutlinedIcon />
                </Badge>
              </IconButton>
              <Menu anchorEl={notifAnchor} open={Boolean(notifAnchor)} onClose={() => setNotifAnchor(null)}>
                {adminData.state.notifications.length === 0 ? (
                  <MenuItem disabled>Bildiriş yoxdur</MenuItem>
                ) : (
                  adminData.state.notifications.map((n) => (
                    <MenuItem
                      key={n.id}
                      dense
                      onClick={() => {
                        adminData.notificationRead(n.id)
                        setNotifAnchor(null)
                      }}
                      sx={{ opacity: n.read ? 0.65 : 1, maxWidth: 320, whiteSpace: 'normal' }}
                    >
                      {n.message}
                    </MenuItem>
                  ))
                )}
                <Divider />
                <MenuItem
                  onClick={() => {
                    adminData.notificationReadAll()
                    setNotifAnchor(null)
                  }}
                >
                  Hamısını oxundu işarələ
                </MenuItem>
              </Menu>
              <ChipProfile name={user?.fullName ?? ''} email={user?.email ?? ''} />
            </>
          ) : null}
          {isTeacher ? (
            <>
              <IconButton color="inherit" onClick={(e) => setTeacherNotifAnchor(e.currentTarget)} aria-label="Xəbərdarlıqlar">
                <Badge badgeContent={teacherAlerts.length} color="warning" invisible={teacherAlerts.length === 0} max={9}>
                  <NotificationsNoneOutlinedIcon />
                </Badge>
              </IconButton>
              <Menu anchorEl={teacherNotifAnchor} open={Boolean(teacherNotifAnchor)} onClose={() => setTeacherNotifAnchor(null)}>
                {teacherAlerts.length === 0 ? (
                  <MenuItem disabled>Hal-hazırda xəbərdarlıq yoxdur</MenuItem>
                ) : (
                  teacherAlerts.map((a) => (
                    <MenuItem key={a.id} disabled sx={{ maxWidth: 340, whiteSpace: 'normal', opacity: 1 }}>
                      {a.text}
                    </MenuItem>
                  ))
                )}
              </Menu>
            </>
          ) : null}
          <IconButton color="inherit" onClick={() => toggleMode()} aria-label="Gecə/gündüz rejimi">
            {mode === 'light' ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
              enqueueSnackbar('Çıxış edildi', { variant: 'success' })
            }}
            aria-label="Çıxış"
          >
            <LogoutOutlinedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {!isMdUp ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH_DEFAULT,
                borderRight: 'none',
                boxShadow: isDark ? `4px 0 32px ${alpha('#000', 0.45)}` : '4px 0 24px rgba(15, 23, 42, 0.08)',
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                ...(isAdmin
                  ? {
                      bgcolor: isDark ? alpha('#0b1220', 0.98) : '#fafbff',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      backgroundImage: isDark
                        ? `linear-gradient(180deg, ${alpha('#312e81', 0.45)} 0%, ${alpha('#0f172a', 0.85)} 38%, ${alpha('#070b12', 0.98)} 100%)`
                        : 'linear-gradient(180deg, #f8f5ff 0%, #f0f7ff 40%, #ffffff 100%)',
                    }
                  : {
                      bgcolor: 'background.paper',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      ...(isDark && {
                        backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha('#0f172a', 0.95)} 100%)`,
                      }),
                    }),
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: isAdmin ? (isDark ? 'background.default' : '#f1f5f9') : 'background.default',
          ...(isAdmin
            ? {
                backgroundImage: isDark
                  ? `radial-gradient(120% 80% at 50% -10%, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 55%), linear-gradient(180deg, ${alpha('#0f172a', 0.6)} 0%, ${theme.palette.background.default} 42%, ${alpha('#020617', 0.95)} 100%)`
                  : 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 38%, #f1f5f9 100%)',
              }
            : {}),
        }}
      >
        <Toolbar />
        {isAdmin ? (
          <Box sx={{ maxWidth: 1320, mx: 'auto', width: 1 }}>{children}</Box>
        ) : isTeacher ? (
          <Box sx={{ maxWidth: 1200, mx: 'auto', width: 1 }}>{children}</Box>
        ) : (
          children
        )}
      </Box>
    </Box>
  )
}

function ChipProfile({ name, email }: { name: string; email: string }) {
  return (
    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1, pl: 1 }}>
      <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main' }}>{name.slice(0, 1).toUpperCase()}</Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={800} noWrap>
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {email}
        </Typography>
      </Box>
    </Box>
  )
}
