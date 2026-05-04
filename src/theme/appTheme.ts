import { alpha, createTheme } from '@mui/material/styles'

export function createAppTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark'

  const primaryMain = isDark ? '#8b9fff' : '#2563eb'
  const primaryLight = isDark ? '#b4c0ff' : '#3b82f6'
  const primaryDark = isDark ? '#5c6fd6' : '#1d4ed8'

  const bgDefault = isDark ? '#070b12' : '#f1f5f9'
  const bgPaper = isDark ? '#0c1220' : '#ffffff'
  const divider = isDark ? alpha('#cbd5e1', 0.12) : '#e2e8f0'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primaryMain,
        light: primaryLight,
        dark: primaryDark,
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? '#94a3b8' : '#64748b',
        contrastText: isDark ? '#0f172a' : '#ffffff',
      },
      success: { main: isDark ? '#4ade80' : '#2e7d32', contrastText: isDark ? '#052e16' : '#fff' },
      warning: { main: isDark ? '#fbbf24' : '#ed6c02', contrastText: isDark ? '#422006' : '#fff' },
      error: { main: isDark ? '#f87171' : '#d32f2f', contrastText: '#fff' },
      info: { main: isDark ? '#38bdf8' : '#0288d1', contrastText: isDark ? '#082f49' : '#fff' },
      background: {
        default: bgDefault,
        paper: bgPaper,
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b',
        disabled: isDark ? alpha('#f1f5f9', 0.38) : undefined,
      },
      divider,
      action: {
        active: isDark ? alpha('#f8fafc', 0.56) : alpha('#0f172a', 0.54),
        hover: isDark ? alpha('#f8fafc', 0.08) : alpha('#0f172a', 0.04),
        selected: isDark ? alpha(primaryMain, 0.22) : alpha(primaryMain, 0.12),
        disabled: isDark ? alpha('#f8fafc', 0.28) : undefined,
        disabledBackground: isDark ? alpha('#f8fafc', 0.08) : undefined,
      },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"DM Sans", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: bgDefault,
            color: isDark ? '#f1f5f9' : undefined,
            scrollbarColor: isDark ? `${alpha('#94a3b8', 0.45)} transparent` : undefined,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            ...(isDark && {
              boxShadow: `0 1px 0 ${alpha('#fff', 0.04)} inset, 0 4px 24px ${alpha('#000', 0.35)}`,
            }),
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            ...(isDark && {
              border: `1px solid ${alpha('#94a3b8', 0.14)}`,
              backgroundColor: alpha(bgPaper, 0.92),
              backdropFilter: 'blur(8px)',
            }),
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            ...(isDark && {
              borderRightColor: divider,
            }),
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            ...(theme.palette.mode === 'dark' && {
              backgroundColor: alpha(theme.palette.common.white, 0.05),
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(theme.palette.common.white, 0.18),
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
            }),
          }),
          notchedOutline: ({ theme }) => ({
            ...(theme.palette.mode === 'dark' && {
              borderColor: alpha(theme.palette.common.white, 0.12),
            }),
          }),
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: ({ theme }) => ({
            ...(theme.palette.mode === 'dark' && {
              backgroundColor: alpha(theme.palette.background.paper, 0.98),
              border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
              backdropFilter: 'blur(12px)',
            }),
          }),
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            ...(theme.palette.mode === 'dark' && {
              backgroundImage: `linear-gradient(165deg, ${alpha('#1e293b', 0.98)} 0%, ${theme.palette.background.paper} 100%)`,
              border: `1px solid ${alpha('#fff', 0.06)}`,
            }),
          }),
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: ({ theme }) => ({
            ...(theme.palette.mode === 'dark' && {
              backgroundColor: alpha('#1e293b', 0.95),
              border: `1px solid ${alpha('#fff', 0.08)}`,
              fontSize: 12,
            }),
          }),
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            ...(theme.palette.mode === 'dark' && {
              backgroundColor: alpha(theme.palette.common.white, 0.04),
              color: theme.palette.text.secondary,
            }),
          }),
        },
      },
    },
  })
}
