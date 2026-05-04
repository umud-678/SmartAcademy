import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Alert, Box, Button, Card, CardActionArea, CardContent, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { alpha, useTheme } from '@mui/material/styles'
import { enqueueSnackbar } from 'notistack'
import { Link as RouterLink } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { useAdminData } from '@/contexts/AdminDataContext'
import { flattenInstallments, groupOccupancyBars, groupsWithClassesToday, revenueByMonth, studentsPerCourse } from '@/lib/adminSelectors'

const shortcuts = [
  {
    to: '/admin/students',
    title: 'Tələbələr',
    subtitle: 'Siyahı, filtr, ödəniş planı',
    icon: <PeopleAltOutlinedIcon sx={{ fontSize: 26 }} />,
  },
  {
    to: '/admin/groups',
    title: 'Qruplar',
    subtitle: 'Yeni qrup axını',
    icon: <GroupsOutlinedIcon sx={{ fontSize: 26 }} />,
  },
  {
    to: '/admin/courses',
    title: 'Kurslar',
    subtitle: 'Qiymət və aktivlik',
    icon: <MenuBookOutlinedIcon sx={{ fontSize: 26 }} />,
  },
  {
    to: '/admin/payments/dashboard',
    title: 'Ödənişlər',
    subtitle: 'Gecikmiş və gözlənilən',
    icon: <AttachMoneyOutlinedIcon sx={{ fontSize: 26 }} />,
  },
  {
    to: '/admin/reports',
    title: 'Hesabat',
    subtitle: 'CSV çıxarışı',
    icon: <AssessmentOutlinedIcon sx={{ fontSize: 26 }} />,
  },
]

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7']

export function AdminDashboardPage() {
  const theme = useTheme()
  const { stats, reset, state } = useAdminData()

  const lineData = revenueByMonth(state, 6)
  const pieData = studentsPerCourse(state)
  const barData = groupOccupancyBars(state)
  const overdueRows = flattenInstallments(state)
    .filter((r) => r.status === 'overdue')
    .slice(0, 6)
  const todayRows = groupsWithClassesToday(state)

  const kpis = [
    { title: 'Aktiv tələbə', value: String(stats.activeStudents), hint: 'Vəziyyət: aktiv' },
    { title: 'Aktiv qrup', value: String(stats.activeGroups), hint: 'Arxiv qruplar çıxarılıb' },
    { title: 'Bu ay yığılan', value: `${stats.paidMonthAzn} ₼`, hint: 'Ödənilmiş sətirlər' },
    { title: 'Gecikmiş', value: `${stats.overdueTotalAzn} ₼`, hint: `${stats.overdueCount} sətir` },
    { title: 'Aktiv müəllim', value: String(stats.teachers), hint: 'Vəziyyət: aktiv' },
    { title: 'Gözlənilən', value: `${stats.expectedPendingAzn} ₼`, hint: 'Gözləyən taksitlər' },
  ]

  const showAlert = stats.overdueCount > 0 || stats.lowAttendanceStudents > 0

  return (
    <Box>
      <AdminPageHeader
        title="İdarə paneli"
        description="KPI, qrafiklər və tez əməliyyatlar — məlumatlar brauzerdə saxlanılır (localStorage)."
        actions={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RestartAltOutlinedIcon />}
            onClick={() => {
              reset()
              enqueueSnackbar('Nümunə məlumatlar bərpa edildi', { variant: 'info' })
            }}
            sx={{ textTransform: 'none', fontWeight: 700, borderColor: 'divider' }}
          >
            Məlumatı sıfırla
          </Button>
        }
      />

      {showAlert ? (
        <Alert severity="warning" icon={<WarningAmberRoundedIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          <strong>{stats.overdueCount}</strong> gecikmiş ödəniş sətiri və <strong>{stats.lowAttendanceStudents}</strong> tələbənin davamiyyəti 80%-dən
          aşağıdır.
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          Hazırda kritik xəbərdarlıq yoxdur.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {kpis.map((k) => (
          <Grid key={k.title} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                height: 1,
                borderColor: 'divider',
                background: (t) =>
                  t.palette.mode === 'light'
                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, #fff 55%)`
                    : undefined,
                transition: 'transform 0.15s, box-shadow 0.15s',
                '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
              }}
            >
              <CardContent sx={{ py: 2.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.08 }}>
                  {k.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, letterSpacing: '-0.03em' }}>
                  {k.value}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                  <TrendingUpOutlinedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="caption" color="text.secondary">
                    {k.hint}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', p: 2 }}>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>Aylıq gəlir (ödənilmiş)</Typography>
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.9)} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke={theme.palette.primary.main} strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Card>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', p: 2, height: 300 }}>
                  <Typography sx={{ fontWeight: 800, mb: 1 }}>Kurslara görə tələbə</Typography>
                  <Box sx={{ width: '100%', height: 220 }}>
                    {pieData.length ? (
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78} label>
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                        Qrupla əlaqəli tələbə yoxdur.
                      </Typography>
                    )}
                  </Box>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', p: 2, height: 300 }}>
                  <Typography sx={{ fontWeight: 800, mb: 1 }}>Qrup doluluğu</Typography>
                  <Box sx={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.9)} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={56} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="fill" fill={theme.palette.secondary.main} radius={[6, 6, 0, 0]} name="Faiz %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
              <CardContent>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Gecikmiş ödənişlər</Typography>
                {overdueRows.length ? (
                  <List dense disablePadding>
                    {overdueRows.map((r) => (
                      <ListItem key={r.key} disableGutters sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={r.student}
                          secondary={`${r.amount} ₼ · ${r.due}`}
                          primaryTypographyProps={{ fontWeight: 700, noWrap: true }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Gecikmiş sətir yoxdur.
                  </Typography>
                )}
                <Button component={RouterLink} to="/admin/payments" fullWidth sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}>
                  Ödəniş moduluna keç
                </Button>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
              <CardContent>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Bu gün dərsi olan qruplar</Typography>
                {todayRows.length ? (
                  <List dense disablePadding>
                    {todayRows.map((r) => (
                      <ListItem key={`${r.groupId}-${r.time}`} disableGutters sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={r.groupName}
                          secondary={`${r.time} · ${r.room} · ${r.courseName}`}
                          primaryTypographyProps={{ fontWeight: 700 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Bu gün üçün cədvəl uyğunluğu yoxdur.
                  </Typography>
                )}
                <Button component={RouterLink} to="/admin/groups" fullWidth sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}>
                  Qruplara bax
                </Button>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
              <CardContent>
                <Typography sx={{ fontWeight: 800, mb: 1 }}>Tez əməliyyatlar</Typography>
                <Stack spacing={1}>
                  {shortcuts.slice(0, 4).map((s) => (
                    <Button key={s.to} component={RouterLink} to={s.to} variant="contained" color="inherit" sx={{ textTransform: 'none', fontWeight: 700 }}>
                      {s.title}
                    </Button>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 0.14, display: 'block', mb: 1.5 }}>
        Modullar
      </Typography>
      <Grid container spacing={2}>
        {shortcuts.map((s) => (
          <Grid key={s.to} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: 1, overflow: 'hidden', borderColor: 'divider', '&:hover': { borderColor: 'primary.light' } }}>
              <CardActionArea component={RouterLink} to={s.to} sx={{ height: 1 }}>
                <CardContent sx={{ py: 2.5 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {s.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        {s.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {s.subtitle}
                      </Typography>
                    </Box>
                    <ArrowForwardIosIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
