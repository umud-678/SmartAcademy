import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Alert, Box, Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { StudentPaymentsTab } from '@/components/admin/payments/StudentPaymentsTab'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAdminData } from '@/contexts/AdminDataContext'
import { groupLabel, studentDebt } from '@/lib/adminSelectors'
import type { LessonLogRow, LessonPresence, StudentStatus } from '@/types/admin'

const LESSON_PRESENCE_AZ: Record<LessonPresence, string> = {
  present: 'İştirak edib',
  absent: 'Qayıb',
  late: 'Gecikib',
  excused: 'Üzürlü',
}

export function StudentDetailPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { state, studentUpdate } = useAdminData()
  const [tab, setTab] = useState(0)

  const student = useMemo(() => state.students.find((s) => s.id === studentId), [state.students, studentId])

  if (!studentId) return <Navigate to="/admin/students" replace />
  if (!student) return <Navigate to="/admin/students" replace />

  const logCols: DataTableColumn<LessonLogRow>[] = [
    { id: 'date', label: 'Tarix' },
    { id: 'lesson', label: 'Dərs' },
    {
      id: 'status',
      label: 'İştirak',
      render: (r) => (
        <StatusBadge
          label={LESSON_PRESENCE_AZ[r.status]}
          tone={r.status === 'present' ? 'success' : r.status === 'absent' ? 'error' : 'warning'}
        />
      ),
    },
    {
      id: 'note',
      label: 'Qeyd',
      render: (r) => (r.note?.trim() ? r.note : '—'),
    },
  ]

  return (
    <Box>
      <AdminPageHeader
        title={student.name}
        description={`Qrup: ${groupLabel(state, student.groupId)} · E-poçt: ${student.email}`}
        actions={
          <Button variant="outlined" onClick={() => navigate('/admin/students')} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Siyahıya qayıt
          </Button>
        }
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Card variant="outlined" sx={{ flex: 1, borderRadius: 3, borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Vəziyyət
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {student.status === 'active' ? 'Aktiv' : 'Deaktiv'}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1, borderRadius: 3, borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Davamiyyət
            </Typography>
            <Typography variant="h6" fontWeight={800} color={student.attendanceRate < 80 ? 'warning.main' : 'success.main'}>
              {student.attendanceRate}%
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1, borderRadius: 3, borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Borc (qalıq)
            </Typography>
            <Typography variant="h6" fontWeight={800} color="error">
              {studentDebt(student)} ₼
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, pt: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Məlumatlar" />
          <Tab label="Davamiyyət" />
          <Tab label="Ödənişlər" />
        </Tabs>
        <CardContent sx={{ p: 3 }}>
          {tab === 0 ? (
            <Stack spacing={2} sx={{ maxWidth: 520 }}>
              <TextField label="Telefon" value={student.phone} onChange={(e) => studentUpdate(student.id, { phone: e.target.value })} fullWidth />
              <TextField
                label="Valideyn nömrəsi"
                value={student.parentPhone}
                onChange={(e) => studentUpdate(student.id, { parentPhone: e.target.value })}
                fullWidth
              />
              <TextField label="E-poçt" value={student.email} onChange={(e) => studentUpdate(student.id, { email: e.target.value })} fullWidth />
              <TextField
                label="Qeydiyyat tarixi"
                type="date"
                value={student.registeredAt}
                onChange={(e) => studentUpdate(student.id, { registeredAt: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>Vəziyyət</InputLabel>
                <Select
                  label="Vəziyyət"
                  value={student.status}
                  onChange={(e) => studentUpdate(student.id, { status: e.target.value as StudentStatus })}
                >
                  <MenuItem value="active">Aktiv</MenuItem>
                  <MenuItem value="suspended">Deaktiv</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Qrup</InputLabel>
                <Select
                  label="Qrup"
                  value={student.groupId ?? ''}
                  onChange={(e) => studentUpdate(student.id, { groupId: e.target.value || null })}
                >
                  <MenuItem value="">—</MenuItem>
                  {state.groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={() => enqueueSnackbar('Yadda saxlanıldı', { variant: 'success' })}
                sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 800 }}
              >
                Dəyişikliklər saxlanılıb (avtomatik)
              </Button>
            </Stack>
          ) : null}
          {tab === 1 ? (
            <Stack spacing={2}>
              {student.attendanceRate < 80 ? (
                <Alert severity="warning" icon={<WarningAmberRoundedIcon />}>
                  Ümumi davamiyyət 80%-dən aşağıdır.
                </Alert>
              ) : null}
              <DataTable columns={logCols} rows={student.lessonLogs} getRowId={(r) => r.id} emptyTitle="Dərs qeydi yoxdur" />
            </Stack>
          ) : null}
          {tab === 2 ? <StudentPaymentsTab studentId={student.id} /> : null}
        </CardContent>
      </Card>
    </Box>
  )
}
