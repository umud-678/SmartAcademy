import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
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
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { useAdminData } from '@/contexts/AdminDataContext'
import { useAdminShell } from '@/contexts/AdminShellContext'
import { groupLabel, studentDebt } from '@/lib/adminSelectors'
import type { AdminStudent } from '@/types/admin'

export function StudentsListPage() {
  const { state } = useAdminData()
  const { globalSearch } = useAdminShell()
  const [groupFilter, setGroupFilter] = useState('')
  const [statusF, setStatusF] = useState<'all' | 'active' | 'suspended'>('all')
  const [debtF, setDebtF] = useState<'all' | 'with'>('all')

  const rows = useMemo(() => {
    const gq = groupFilter.trim().toLowerCase()
    const sq = globalSearch.trim().toLowerCase()
    return state.students.filter((s) => {
      if (statusF !== 'all' && s.status !== statusF) return false
      const debt = studentDebt(s)
      if (debtF === 'with' && debt <= 0) return false
      const gname = groupLabel(state, s.groupId).toLowerCase()
      if (gq && !gname.includes(gq)) return false
      if (sq) {
        const blob = `${s.name} ${s.email} ${gname}`.toLowerCase()
        if (!blob.includes(sq)) return false
      }
      return true
    })
  }, [state, groupFilter, statusF, debtF, globalSearch])

  const columns: DataTableColumn<AdminStudent>[] = [
    { id: 'name', label: 'Ad Soyad' },
    {
      id: 'group',
      label: 'Qrup',
      render: (r) => <Typography fontWeight={600}>{groupLabel(state, r.groupId)}</Typography>,
    },
    {
      id: 'attendanceRate',
      label: 'Davamiyyət %',
      render: (r) => (
        <Typography sx={{ fontWeight: 800, color: r.attendanceRate < 80 ? 'warning.main' : 'success.main' }}>{r.attendanceRate}%</Typography>
      ),
    },
    {
      id: 'debt',
      label: 'Borc statusu',
      render: (r) => {
        const d = studentDebt(r)
        return (
          <Typography sx={{ fontWeight: 800, color: d > 0 ? 'error.main' : 'success.main' }}>{d > 0 ? `${d} ₼` : 'Yoxdur'}</Typography>
        )
      },
    },
    {
      id: 'v',
      label: '',
      align: 'right',
      render: (r) => (
        <Button component={RouterLink} to={`/admin/students/${r.id}`} size="small" variant="outlined" startIcon={<VisibilityOutlinedIcon />}>
          Bax
        </Button>
      ),
    },
  ]

  return (
    <Box>
      <AdminPageHeader
        title="Tələbələr"
        description="Siyahı, filtr və tələbə detalı — ödəniş planı və güzəşt idarəetməsi detal səhifəsindədir."
        actions={
          <Button component={RouterLink} to="/admin/students/new" variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>
            + Yeni tələbə
          </Button>
        }
      />
      <Card variant="outlined" sx={{ borderRadius: 3, mb: 2, borderColor: 'divider' }}>
        <CardContent sx={{ py: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap alignItems={{ md: 'center' }}>
            <TextField
              size="small"
              label="Qrup filtri"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              sx={{ minWidth: 180 }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Vəziyyət</InputLabel>
              <Select label="Vəziyyət" value={statusF} onChange={(e) => setStatusF(e.target.value as typeof statusF)}>
                <MenuItem value="all">Hamısı</MenuItem>
                <MenuItem value="active">Aktiv</MenuItem>
                <MenuItem value="suspended">Deaktiv</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant={debtF === 'with' ? 'contained' : 'outlined'}
              startIcon={<FilterListOutlinedIcon />}
              onClick={() => setDebtF((d) => (d === 'all' ? 'with' : 'all'))}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Borcu olanlar
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} />
    </Box>
  )
}
