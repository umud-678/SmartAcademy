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
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { useAdminData } from '@/contexts/AdminDataContext'
import { courseById, WEEKDAY_SHORT_AZ } from '@/lib/adminSelectors'
import type { AdminGroup, TeacherStatus } from '@/types/admin'

export function TeacherDetailPage() {
  const { teacherId } = useParams()
  const navigate = useNavigate()
  const { state, teacherUpdate } = useAdminData()
  const [tab, setTab] = useState(0)

  const teacher = useMemo(() => (teacherId ? state.teachers.find((t) => t.id === teacherId) : undefined), [state.teachers, teacherId])

  const myGroups = useMemo(() => state.groups.filter((g) => g.teacherId === teacher?.id), [state.groups, teacher?.id])

  const activeStudents = useMemo(() => {
    if (!teacher) return 0
    const ids = new Set<string>()
    for (const g of myGroups) {
      for (const sid of g.studentIds) ids.add(sid)
    }
    return ids.size
  }, [myGroups, teacher])

  const scheduleRows = useMemo(() => {
    const rows: { group: string; when: string; room: string }[] = []
    for (const g of myGroups) {
      for (const s of g.schedule) {
        const days = s.days.map((d) => WEEKDAY_SHORT_AZ[d]).join(', ')
        rows.push({ group: g.name, when: `${days} ${s.start}–${s.end}`, room: s.room })
      }
    }
    return rows
  }, [myGroups])

  const groupCols: DataTableColumn<AdminGroup>[] = [
    { id: 'name', label: 'Qrup' },
    {
      id: 'course',
      label: 'Kurs',
      render: (g) => courseById(state, g.courseId)?.name ?? '—',
    },
    {
      id: 'fill',
      label: 'Doluluq',
      render: (g) => `${g.studentIds.length}/${g.maxStudents}`,
    },
  ]

  if (!teacherId) return <Navigate to="/admin/teachers" replace />
  if (!teacher) return <Navigate to="/admin/teachers" replace />

  return (
    <Box>
      <AdminPageHeader
        title={teacher.name}
        description={`E-poçt: ${teacher.email}`}
        actions={
          <Button variant="outlined" onClick={() => navigate('/admin/teachers')} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Siyahıya qayıt
          </Button>
        }
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Card variant="outlined" sx={{ flex: 1, borderRadius: 3, borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Keçirdiyi dərs (qeyd)
            </Typography>
            <Typography variant="h5" fontWeight={900}>
              {teacher.lessonsTaught}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1, borderRadius: 3, borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Qrup sayı
            </Typography>
            <Typography variant="h5" fontWeight={900}>
              {myGroups.length}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1, borderRadius: 3, borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Aktiv tələbə (uniq)
            </Typography>
            <Typography variant="h5" fontWeight={900}>
              {activeStudents}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', mb: 2 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 520 }}>
          <Typography variant="subtitle2" fontWeight={800}>
            Profil
          </Typography>
          <TextField label="Ad Soyad" value={teacher.name} onChange={(e) => teacherUpdate(teacher.id, { name: e.target.value })} fullWidth />
          <TextField label="E-poçt" value={teacher.email} onChange={(e) => teacherUpdate(teacher.id, { email: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Vəziyyət</InputLabel>
            <Select
              label="Vəziyyət"
              value={teacher.status}
              onChange={(e) => teacherUpdate(teacher.id, { status: e.target.value as TeacherStatus })}
            >
              <MenuItem value="active">Aktiv</MenuItem>
              <MenuItem value="inactive">Deaktiv</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Müəllim davamiyyət %"
            type="number"
            value={teacher.teacherAttendancePct}
            onChange={(e) => teacherUpdate(teacher.id, { teacherAttendancePct: Number(e.target.value) })}
            fullWidth
          />
          <Button
            variant="contained"
            onClick={() => enqueueSnackbar('Dəyişikliklər saxlanılıb', { variant: 'success' })}
            sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 800 }}
          >
            Yadda saxla (avtomatik)
          </Button>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, pt: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Qruplar" />
          <Tab label="Dərs cədvəli" />
          <Tab label="Davamiyyət" />
        </Tabs>
        <CardContent sx={{ p: 3 }}>
          {tab === 0 ? <DataTable columns={groupCols} rows={myGroups} getRowId={(g) => g.id} /> : null}
          {tab === 1 ? (
            <DataTable
              columns={[
                { id: 'group', label: 'Qrup' },
                { id: 'when', label: 'Vaxt' },
                { id: 'room', label: 'Otaq' },
              ]}
              rows={scheduleRows}
              getRowId={(r) => `${r.group}-${r.when}-${r.room}`}
            />
          ) : null}
          {tab === 2 ? (
            <Stack spacing={1}>
              <Typography>
                Ümumi müəllim iştirakı: <strong>{teacher.teacherAttendancePct}%</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hər dərs üzrə qeydiyyat server inteqrasiyası ilə genişləndirilə bilər; hazırda yalnız ümumi göstərici saxlanılır.
              </Typography>
            </Stack>
          ) : null}
        </CardContent>
      </Card>
    </Box>
  )
}
