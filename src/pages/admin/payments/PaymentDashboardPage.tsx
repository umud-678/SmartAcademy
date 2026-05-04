import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { alpha, useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAdminData } from '@/contexts/AdminDataContext'
import { flattenInstallments, groupById, revenueByMonth, revenueDiscountSplit, type FlatPayment } from '@/lib/adminSelectors'

const PIE_COLORS = ['#6366f1', '#22c55e']

export function PaymentDashboardPage() {
  const theme = useTheme()
  const { state, stats } = useAdminData()
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [month, setMonth] = useState('')
  const [courseF, setCourseF] = useState('')

  const rows = useMemo(() => {
    let list = flattenInstallments(state)
    if (overdueOnly) list = list.filter((r) => r.status === 'overdue')
    if (month) list = list.filter((r) => r.due.startsWith(month))
    if (courseF) {
      list = list.filter((r) => {
        const st = state.students.find((s) => s.id === r.studentId)
        const g = st ? groupById(state, st.groupId) : undefined
        return g?.courseId === courseF
      })
    }
    return list.sort((a, b) => a.due.localeCompare(b.due))
  }, [state, overdueOnly, month, courseF])

  const columns: DataTableColumn<FlatPayment>[] = [
    {
      id: 'student',
      label: 'Tələbə',
      render: (r) => (
        <Button component={RouterLink} to={`/admin/students/${r.studentId}`} sx={{ textTransform: 'none', fontWeight: 700 }}>
          {r.student}
        </Button>
      ),
    },
    { id: 'group', label: 'Qrup' },
    { id: 'amount', label: 'Məbləğ', render: (r) => `${r.amount} ₼` },
    { id: 'due', label: 'Son tarix' },
    {
      id: 'status',
      label: 'Vəziyyət',
      render: (r) => (
        <StatusBadge
          label={r.status === 'paid' ? 'Ödənilib' : r.status === 'overdue' ? 'Gecikib' : r.status === 'pending' ? 'Gözləyir' : '—'}
          tone={r.status === 'paid' ? 'success' : r.status === 'overdue' ? 'error' : 'warning'}
        />
      ),
    },
  ]

  const ymNow = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const barData = revenueByMonth(state, 6)
  const pieData = revenueDiscountSplit(state)

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', height: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Bu ay yığılan
              </Typography>
              <Typography variant="h5" fontWeight={900} color="success.main">
                {stats.paidMonthAzn} ₼
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ödənilmiş taksitlər (son tarix bu ay)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', height: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Gözlənilən (cəm)
              </Typography>
              <Typography variant="h5" fontWeight={900}>
                {stats.expectedPendingAzn} ₼
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Gözləyir statuslu sətirlər
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', height: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Gecikmiş (cəm)
              </Typography>
              <Typography variant="h5" fontWeight={900} color="error">
                {stats.overdueTotalAzn} ₼
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.overdueCount} sətir
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', height: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Güzəşt alan tələbələr
              </Typography>
              <Typography variant="h5" fontWeight={900} color="primary.main">
                {stats.discountedStudents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                discount &gt; 0
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', height: 320 }}>
            <CardContent sx={{ height: 1 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                Ay üzrə yığılmış ödənişlər
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.9)} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={36} />
                  <Tooltip formatter={(value) => [`${Number(value ?? 0)} ₼`, 'Məbləğ']} />
                  <Bar dataKey="total" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', height: 320 }}>
            <CardContent sx={{ height: 1 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                Ödənilmiş məbləğ: güzəştli / güzəştsiz
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    label={({ name }) => String(name ?? '')}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={String(i)} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value ?? 0)} ₼`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 2, borderColor: 'divider' }}>
        <CardContent sx={{ py: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap alignItems={{ md: 'center' }}>
            <Button
              variant={overdueOnly ? 'contained' : 'outlined'}
              onClick={() => setOverdueOnly((o) => !o)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Yalnız gecikmiş
            </Button>
            <TextField
              size="small"
              label="Ay (YYYY-MM)"
              placeholder={ymNow}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              sx={{ minWidth: 160 }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Kurs</InputLabel>
              <Select label="Kurs" value={courseF} onChange={(e) => setCourseF(String(e.target.value))}>
                <MenuItem value="">Hamısı</MenuItem>
                {state.courses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      <DataTable columns={columns} rows={rows} getRowId={(r) => r.key} />
    </Box>
  )
}
