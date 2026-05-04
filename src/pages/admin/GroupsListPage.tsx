import { Box, Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAdminData } from '@/contexts/AdminDataContext'
import { useAdminShell } from '@/contexts/AdminShellContext'
import { courseById, teacherById } from '@/lib/adminSelectors'
import type { AdminGroup, GroupStatus } from '@/types/admin'

export function GroupsListPage() {
  const { state } = useAdminData()
  const { globalSearch } = useAdminShell()
  const [courseF, setCourseF] = useState('')
  const [teacherF, setTeacherF] = useState('')
  const [statusF, setStatusF] = useState<'all' | GroupStatus>('all')

  const rows = useMemo(() => {
    const q = globalSearch.trim().toLowerCase()
    return state.groups.filter((g) => {
      if (statusF !== 'all' && g.status !== statusF) return false
      if (courseF && g.courseId !== courseF) return false
      if (teacherF && g.teacherId !== teacherF) return false
      if (q) {
        const tname = state.teachers.find((t) => t.id === g.teacherId)?.name ?? ''
        const blob = `${g.name} ${courseById(state, g.courseId)?.name ?? ''} ${tname}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [state.groups, state.teachers, courseF, teacherF, statusF, globalSearch, state])

  const columns: DataTableColumn<AdminGroup>[] = [
    { id: 'name', label: 'Qrup adı', render: (g) => <Typography fontWeight={800}>{g.name}</Typography> },
    { id: 'course', label: 'Kurs', render: (g) => courseById(state, g.courseId)?.name ?? '—' },
    { id: 'teacher', label: 'Müəllim', render: (g) => teacherById(state, g.teacherId)?.name ?? '—' },
    {
      id: 'fill',
      label: 'Doluluq %',
      render: (g) => {
        const pct = g.maxStudents > 0 ? Math.round((g.studentIds.length / g.maxStudents) * 100) : 0
        return (
          <Typography fontWeight={800} color={pct >= 90 ? 'warning.main' : 'text.primary'}>
            {pct}%
          </Typography>
        )
      },
    },
    {
      id: 'st',
      label: 'Vəziyyət',
      render: (g) => <StatusBadge label={g.status === 'active' ? 'Aktiv' : 'Arxiv'} tone={g.status === 'active' ? 'success' : 'warning'} />,
    },
    {
      id: 'v',
      label: '',
      align: 'right',
      render: (g) => (
        <Button component={RouterLink} to={`/admin/groups/${g.id}`} size="small" variant="outlined" sx={{ textTransform: 'none', fontWeight: 700 }}>
          Bax
        </Button>
      ),
    },
  ]

  return (
    <Box>
      <AdminPageHeader
        title="Qruplar"
        description="Kurs, müəllim və tələbə əlaqəsi — yeni qrup üçün addım-addım axın."
        actions={
          <Button component={RouterLink} to="/admin/groups/new" variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>
            + Yeni qrup
          </Button>
        }
      />
      <Card variant="outlined" sx={{ borderRadius: 3, mb: 2, borderColor: 'divider' }}>
        <CardContent sx={{ py: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap alignItems={{ md: 'center' }}>
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
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Müəllim</InputLabel>
              <Select label="Müəllim" value={teacherF} onChange={(e) => setTeacherF(String(e.target.value))}>
                <MenuItem value="">Hamısı</MenuItem>
                {state.teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Vəziyyət</InputLabel>
              <Select label="Vəziyyət" value={statusF} onChange={(e) => setStatusF(e.target.value as typeof statusF)}>
                <MenuItem value="all">Hamısı</MenuItem>
                <MenuItem value="active">Aktiv</MenuItem>
                <MenuItem value="archived">Arxiv</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>
      <DataTable columns={columns} rows={rows} getRowId={(g) => g.id} />
    </Box>
  )
}
