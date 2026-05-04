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
import { Link as RouterLink, Navigate, useParams } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { GROUP_MAX_STUDENTS_MAX, GROUP_MAX_STUDENTS_MIN } from '@/constants/groupCapacity'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { useAdminData } from '@/contexts/AdminDataContext'
import { courseById, teacherById } from '@/lib/adminSelectors'
import type { AdminStudent, GroupStatus } from '@/types/admin'

export function GroupDetailPage() {
  const { groupId } = useParams()
  const { state, groupUpdate, studentUpdate } = useAdminData()
  const [tab, setTab] = useState(0)

  const group = useMemo(() => (groupId ? state.groups.find((g) => g.id === groupId) : undefined), [state.groups, groupId])

  const members = useMemo(() => {
    if (!group) return []
    return state.students.filter((s) => s.groupId === group.id)
  }, [group, state.students])

  const attendanceRows = useMemo(() => {
    const rows: { id: string; student: string; date: string; lesson: string; status: string }[] = []
    for (const s of members) {
      for (const l of s.lessonLogs) {
        rows.push({ id: `${s.id}-${l.id}`, student: s.name, date: l.date, lesson: l.lesson, status: l.status })
      }
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date))
  }, [members])

  const studentCols: DataTableColumn<AdminStudent>[] = [
    { id: 'name', label: 'Tələbə' },
    {
      id: 'att',
      label: 'Davamiyyət %',
      render: (s) => (
        <Typography fontWeight={800} color={s.attendanceRate < 80 ? 'warning.main' : 'success.main'}>
          {s.attendanceRate}%
        </Typography>
      ),
    },
    {
      id: 'rm',
      label: '',
      align: 'right',
      render: (s) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            studentUpdate(s.id, { groupId: null })
            enqueueSnackbar('Qrupdan çıxarıldı', { variant: 'info' })
          }}
          sx={{ textTransform: 'none' }}
        >
          Çıxar
        </Button>
      ),
    },
  ]

  if (!groupId) return <Navigate to="/admin/groups" replace />
  if (!group) return <Navigate to="/admin/groups" replace />

  const fill = group.maxStudents > 0 ? Math.round((group.studentIds.length / group.maxStudents) * 100) : 0
  const course = courseById(state, group.courseId)
  const teacher = teacherById(state, group.teacherId)

  const addPool = state.students.filter((s) => s.groupId !== group.id && s.status === 'active')
  const canAdd = group.studentIds.length < group.maxStudents

  return (
    <Box>
      <AdminPageHeader
        title={group.name}
        description={`${course?.name ?? '—'} · ${teacher?.name ?? '—'}`}
        actions={
          <Button variant="outlined" component={RouterLink} to="/admin/groups" sx={{ textTransform: 'none', fontWeight: 700 }}>
            Siyahıya qayıt
          </Button>
        }
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Card variant="outlined" sx={{ flex: 1, borderRadius: 3, borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Doluluq
            </Typography>
            <Typography variant="h5" fontWeight={900}>
              {fill}% ({group.studentIds.length}/{group.maxStudents})
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1, borderRadius: 3, borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Vəziyyət
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {group.status === 'active' ? 'Aktiv' : 'Arxiv'}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', mb: 2 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 560 }}>
          <Typography variant="subtitle2" fontWeight={800}>
            Ümumi baxış — redaktə
          </Typography>
          <TextField label="Qrup adı" value={group.name} onChange={(e) => groupUpdate(group.id, { name: e.target.value })} fullWidth />
          <TextField
            label="Max tələbə sayı"
            type="number"
            value={group.maxStudents}
            onChange={(e) => groupUpdate(group.id, { maxStudents: Number(e.target.value) })}
            fullWidth
            inputProps={{ min: GROUP_MAX_STUDENTS_MIN, max: GROUP_MAX_STUDENTS_MAX }}
            helperText={`İcazə: ${GROUP_MAX_STUDENTS_MIN}–${GROUP_MAX_STUDENTS_MAX}. Qrupda artıq ${group.studentIds.length} tələbə varsa, limit avtomatik qaldırıla bilər.`}
          />
          <FormControl fullWidth>
            <InputLabel>Vəziyyət</InputLabel>
            <Select label="Vəziyyət" value={group.status} onChange={(e) => groupUpdate(group.id, { status: e.target.value as GroupStatus })}>
              <MenuItem value="active">Aktiv</MenuItem>
              <MenuItem value="archived">Arxiv</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, pt: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Ümumi baxış" />
          <Tab label="Dərs cədvəli" />
          <Tab label="Tələbələr" />
          <Tab label="Davamiyyət" />
        </Tabs>
        <CardContent sx={{ p: 3 }}>
          {tab === 0 ? (
            <Stack spacing={1}>
              <Typography>
                Kurs: <strong>{course?.name}</strong>
              </Typography>
              <Typography>
                Müəllim: <strong>{teacher?.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cədvəl və tələbələr üçün digər tablara keçin.
              </Typography>
            </Stack>
          ) : null}
          {tab === 1 ? (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Sadə redaktə: mövcud slotları dəyişin (tam idarə üçün cədvəli yenidən yazın).
              </Typography>
              {group.schedule.map((slot) => (
                <Card key={slot.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      label="Günlər (0–6, vergüllə)"
                      helperText="0=Bazar … 6=Şənbə (JS getDay)"
                      defaultValue={slot.days.join(',')}
                      onBlur={(e) => {
                        const days = e.target.value
                          .split(',')
                          .map((x) => Number(x.trim()))
                          .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6)
                        const next = group.schedule.map((s) => (s.id === slot.id ? { ...s, days } : s))
                        groupUpdate(group.id, { schedule: next })
                      }}
                      fullWidth
                    />
                    <TextField
                      label="Başlama"
                      type="time"
                      value={slot.start}
                      onChange={(e) => {
                        const next = group.schedule.map((s) => (s.id === slot.id ? { ...s, start: e.target.value } : s))
                        groupUpdate(group.id, { schedule: next })
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Bitmə"
                      type="time"
                      value={slot.end}
                      onChange={(e) => {
                        const next = group.schedule.map((s) => (s.id === slot.id ? { ...s, end: e.target.value } : s))
                        groupUpdate(group.id, { schedule: next })
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Otaq"
                      value={slot.room}
                      onChange={(e) => {
                        const next = group.schedule.map((s) => (s.id === slot.id ? { ...s, room: e.target.value } : s))
                        groupUpdate(group.id, { schedule: next })
                      }}
                    />
                  </Stack>
                </Card>
              ))}
            </Stack>
          ) : null}
          {tab === 2 ? (
            <Stack spacing={2}>
              <DataTable columns={studentCols} rows={members} getRowId={(s) => s.id} />
              <Typography variant="subtitle2" fontWeight={800}>
                Qrupa əlavə et {canAdd ? '' : '(doludur)'}
              </Typography>
              <Stack spacing={0.5}>
                {addPool.slice(0, 12).map((s) => (
                  <Button
                    key={s.id}
                    disabled={!canAdd}
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      studentUpdate(s.id, { groupId: group.id })
                      enqueueSnackbar('Əlavə olundu', { variant: 'success' })
                    }}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  >
                    + {s.name}
                  </Button>
                ))}
                {addPool.length > 12 ? (
                  <Typography variant="caption" color="text.secondary">
                    +{addPool.length - 12} tələbə daha var — tam siyahı üçün tələbə moduluna keçin.
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
          ) : null}
          {tab === 3 ? (
            <DataTable
              columns={[
                { id: 'student', label: 'Tələbə' },
                { id: 'date', label: 'Tarix' },
                { id: 'lesson', label: 'Dərs' },
                { id: 'status', label: 'Vəziyyət' },
              ]}
              rows={attendanceRows}
              getRowId={(r) => r.id}
              emptyTitle="Bu qrup üçün dərs qeydi yoxdur"
            />
          ) : null}
        </CardContent>
      </Card>
    </Box>
  )
}
