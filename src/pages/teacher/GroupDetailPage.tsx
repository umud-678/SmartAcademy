import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  Chip,
} from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminData } from '@/contexts/AdminDataContext'
import {
  addDays,
  formatGroupScheduleSlots,
  groupWeekLessonRows,
  localDateKey,
  startOfWeekMonday,
  type GroupWeekLessonRow,
} from '@/lib/teacherPanelUtils'
import { courseNameForGroup, groupBelongsToTeacher, resolveTeacherIdByEmail, studentsInGroup } from '@/lib/teacherScope'
import type { AdminStudent, AdminTeacher, LessonLogRow, LessonPresence, LessonDayOverride } from '@/types/admin'

type TabKey = 'students' | 'attendance' | 'lessons' | 'grades'

const PRESENCE_AZ: Record<LessonPresence, string> = {
  present: 'İştirak edib',
  absent: 'Qayıb',
  late: 'Gecikib',
  excused: 'Üzürlü',
}

const LESSON_STATUS_AZ: Record<GroupWeekLessonRow['uiStatus'], { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  held: { label: 'Keçirildi', color: 'success' },
  cancelled: { label: 'Ləğv edildi', color: 'error' },
  postponed: { label: 'Təxirə salındı', color: 'warning' },
  scheduled: { label: 'Planlaşdırılıb', color: 'info' },
  no_log: { label: 'Davamiyyət yoxdur', color: 'default' },
}

function parseScore(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = Number(t)
  if (!Number.isFinite(n)) return null
  return Math.min(100, Math.max(0, Math.round(n)))
}

export function GroupDetailPage() {
  const { groupId } = useParams()
  const { user } = useAuth()
  const { state, studentAddLessonLog, studentSetGroupGrade, groupLessonDayOverride, groupLessonDayOverrideRemove } = useAdminData()
  const [tab, setTab] = useState<TabKey>('students')
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()))

  const teacherId = useMemo(
    () => (user?.email ? resolveTeacherIdByEmail(state, user.email) : null),
    [state, user],
  )

  const group = useMemo(() => (groupId ? state.groups.find((g) => g.id === groupId) : undefined), [state.groups, groupId])

  const allowed = Boolean(teacherId && groupId && group && groupBelongsToTeacher(state, groupId, teacherId))

  const roster = useMemo(() => {
    if (!groupId || !teacherId || !groupBelongsToTeacher(state, groupId, teacherId)) return []
    return studentsInGroup(state, groupId)
  }, [state, groupId, teacherId])

  const courseName = useMemo(() => (groupId ? courseNameForGroup(state, groupId) : '—'), [state, groupId])

  const todayKey = useMemo(() => localDateKey(new Date()), [])
  const lessonRows = useMemo(
    () => (groupId && group ? groupWeekLessonRows(state, groupId, weekStart, todayKey) : []),
    [state, groupId, group, weekStart, todayKey],
  )

  if (!groupId || !teacherId) {
    return <Navigate to="/teacher/groups" replace />
  }
  if (!group || !allowed) {
    return <Navigate to="/teacher/groups" replace />
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5" fontWeight={900}>
          {group.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {courseName} · {formatGroupScheduleSlots(group)} · aktiv tələbə: {group.studentIds.length}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          Yalnız baxış və dərsə aid əməliyyatlar. Ödəniş, güzəşt və admin əməliyyatları bu paneldə yoxdur.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Tələbələr" value="students" sx={{ textTransform: 'none', fontWeight: 700 }} />
        <Tab label="Davamiyyət" value="attendance" sx={{ textTransform: 'none', fontWeight: 700 }} />
        <Tab label="Dərslər / cədvəl" value="lessons" sx={{ textTransform: 'none', fontWeight: 700 }} />
        <Tab label="Qiymət və qeyd" value="grades" sx={{ textTransform: 'none', fontWeight: 700 }} />
      </Tabs>

      {tab === 'students' ? <StudentsTab rows={roster} /> : null}
      {tab === 'attendance' ? (
        <AttendanceTab
          key={roster.map((r) => r.id).join(',')}
          groupId={groupId}
          teacherId={teacherId}
          roster={roster}
          studentAddLessonLog={studentAddLessonLog}
        />
      ) : null}
      {tab === 'lessons' ? (
        <LessonsTab
          groupId={groupId}
          lessonRows={lessonRows}
          weekStart={weekStart}
          setWeekStart={setWeekStart}
          groupLessonDayOverride={groupLessonDayOverride}
          groupLessonDayOverrideRemove={groupLessonDayOverrideRemove}
        />
      ) : null}
      {tab === 'grades' ? (
        <GradesTab
          key={roster.map((r) => r.id).join(',')}
          groupId={groupId}
          teacherId={teacherId}
          roster={roster}
          teachers={state.teachers}
          studentSetGroupGrade={studentSetGroupGrade}
        />
      ) : null}
    </Stack>
  )
}

function StudentsTab({ rows }: { rows: AdminStudent[] }) {
  const [open, setOpen] = useState<AdminStudent | null>(null)

  const columns: DataTableColumn<AdminStudent>[] = [
    { id: 'name', label: 'Ad Soyad' },
    {
      id: 'status',
      label: 'Vəziyyət',
      render: (r) => (
        <StatusBadge
          label={r.status === 'active' ? 'Aktiv' : 'Dayandırılıb'}
          tone={r.status === 'active' ? 'success' : 'warning'}
        />
      ),
    },
    {
      id: 'attendanceRate',
      label: 'Davamiyyət %',
      render: (r) => <Typography fontWeight={700}>{r.attendanceRate}%</Typography>,
    },
    {
      id: 'action',
      label: '',
      align: 'right',
      render: (r) => (
        <Button size="small" variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => setOpen(r)} sx={{ textTransform: 'none' }}>
          Ətraflı
        </Button>
      ),
    },
  ]

  return (
    <>
      <Typography variant="body2" color="text.secondary">
        Telefon və e-poçt yalnız baxış üçündür; redaktə admin səlahiyyətidir.
      </Typography>
      <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} emptyTitle="Bu qrupda tələbə yoxdur" />
      <Dialog open={Boolean(open)} onClose={() => setOpen(null)} maxWidth="xs" fullWidth>
        {open ? (
          <>
            <DialogTitle sx={{ fontWeight: 900 }}>{open.name}</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2">
                E-poçt: <b>{open.email || '—'}</b>
              </Typography>
              <Typography variant="body2">
                Telefon: <b>{open.phone || '—'}</b>
              </Typography>
              <Typography variant="body2">
                Valideyn nömrəsi: <b>{open.parentPhone || '—'}</b>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Davamiyyət: <b>{open.attendanceRate}%</b>
              </Typography>
              <Typography variant="body2">
                Vəziyyət: <b>{open.status === 'active' ? 'Aktiv' : 'Dayandırılıb'}</b>
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(null)} sx={{ textTransform: 'none' }}>
                Bağla
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </>
  )
}

function AttendanceTab({
  groupId,
  teacherId,
  roster,
  studentAddLessonLog,
}: {
  groupId: string
  teacherId: string
  roster: AdminStudent[]
  studentAddLessonLog: (studentId: string, entry: LessonLogRow) => void
}) {
  const [lessonDate, setLessonDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [lessonTitle, setLessonTitle] = useState('Dərs')
  const [values, setValues] = useState<Record<string, LessonPresence>>(() =>
    Object.fromEntries(roster.map((s) => [s.id, 'present' as LessonPresence])),
  )
  const [attNotes, setAttNotes] = useState<Record<string, string>>({})

  const submit = () => {
    if (!lessonTitle.trim()) {
      enqueueSnackbar('Dərs adını daxil edin', { variant: 'warning' })
      return
    }
    const recordedAt = new Date().toISOString()
    for (const s of roster) {
      const status = values[s.id] ?? 'present'
      const note = attNotes[s.id]?.trim()
      studentAddLessonLog(s.id, {
        id: crypto.randomUUID(),
        date: lessonDate,
        lesson: `${lessonTitle.trim()} (${groupId})`,
        status,
        groupId,
        note: note || undefined,
        recordedAt,
        recordedByTeacherId: teacherId,
      })
    }
    enqueueSnackbar('Davamiyyət qeydə alındı', { variant: 'success' })
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Tarix və dərs, sonra hər tələbə üçün iştirak və istəyə bağlı qeyd. &quot;Saxla&quot; hamısı üçün qeyd yaradır.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Tarix"
          type="date"
          value={lessonDate}
          onChange={(e) => setLessonDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ maxWidth: 260 }}
        />
        <TextField label="Dərs / mövzu" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} sx={{ flex: 1, minWidth: 200 }} />
      </Stack>
      <Stack spacing={1.5}>
        {roster.map((s) => (
          <Stack key={s.id} spacing={1} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
              <Typography sx={{ minWidth: 200 }} fontWeight={700}>
                {s.name}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id={`st-${s.id}`}>İştirak</InputLabel>
                <Select
                  labelId={`st-${s.id}`}
                  label="İştirak"
                  value={values[s.id] ?? 'present'}
                  onChange={(e) => setValues((prev) => ({ ...prev, [s.id]: e.target.value as LessonPresence }))}
                >
                  {(Object.keys(PRESENCE_AZ) as LessonPresence[]).map((k) => (
                    <MenuItem key={k} value={k}>
                      {PRESENCE_AZ[k]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <TextField
              size="small"
              label="Qeyd (məsələn, gecikdi)"
              value={attNotes[s.id] ?? ''}
              onChange={(e) => setAttNotes((prev) => ({ ...prev, [s.id]: e.target.value }))}
              fullWidth
            />
          </Stack>
        ))}
      </Stack>
      <Button variant="contained" onClick={submit} disabled={roster.length === 0} sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 800 }}>
        Davamiyyəti saxla
      </Button>
    </Stack>
  )
}

function LessonsTab({
  groupId,
  lessonRows,
  weekStart,
  setWeekStart,
  groupLessonDayOverride,
  groupLessonDayOverrideRemove,
}: {
  groupId: string
  lessonRows: GroupWeekLessonRow[]
  weekStart: Date
  setWeekStart: (d: Date) => void
  groupLessonDayOverride: (groupId: string, entry: LessonDayOverride) => void
  groupLessonDayOverrideRemove: (groupId: string, date: string, slotId: string) => void
}) {
  const weekLabel = `${localDateKey(weekStart)} — ${localDateKey(addDays(weekStart, 6))}`

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Seçilmiş həftə üçün cədvəl slotları. Keçirilmiş dərs üçün qrup üzrə həmin tarixdə davamiyyət qeydi olmalıdır.
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton aria-label="Əvvəlki həftə" onClick={() => setWeekStart(addDays(weekStart, -7))}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="body2" fontWeight={700}>
          {weekLabel}
        </Typography>
        <IconButton aria-label="Növbəti həftə" onClick={() => setWeekStart(addDays(weekStart, 7))}>
          <ChevronRightIcon />
        </IconButton>
        <Button size="small" onClick={() => setWeekStart(startOfWeekMonday(new Date()))} sx={{ textTransform: 'none' }}>
          Bu həftə
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tarix</TableCell>
            <TableCell>Saat</TableCell>
            <TableCell>Otaq</TableCell>
            <TableCell>Vəziyyət</TableCell>
            <TableCell align="right">Əməliyyat</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lessonRows.map((row) => {
            const meta = LESSON_STATUS_AZ[row.uiStatus]
            return (
              <TableRow key={`${row.dateKey}-${row.slotId}`} hover>
                <TableCell>
                  {row.dateKey} ({row.dayShort})
                </TableCell>
                <TableCell>
                  {row.start}–{row.end}
                </TableCell>
                <TableCell>{row.room}</TableCell>
                <TableCell>
                  <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap">
                    {row.uiStatus === 'scheduled' || row.uiStatus === 'no_log' ? (
                      <>
                        <Button
                          size="small"
                          color="error"
                          variant="text"
                          onClick={() => {
                            groupLessonDayOverride(groupId, { id: crypto.randomUUID(), date: row.dateKey, slotId: row.slotId, status: 'cancelled' })
                            enqueueSnackbar('Dərs ləğv edildi kimi işarələndi', { variant: 'info' })
                          }}
                          sx={{ textTransform: 'none' }}
                        >
                          Ləğv
                        </Button>
                        <Button
                          size="small"
                          color="warning"
                          variant="text"
                          onClick={() => {
                            groupLessonDayOverride(groupId, { id: crypto.randomUUID(), date: row.dateKey, slotId: row.slotId, status: 'postponed' })
                            enqueueSnackbar('Təxirə salındı kimi işarələndi', { variant: 'info' })
                          }}
                          sx={{ textTransform: 'none' }}
                        >
                          Təxirə
                        </Button>
                      </>
                    ) : null}
                    {row.uiStatus === 'cancelled' || row.uiStatus === 'postponed' ? (
                      <Button
                        size="small"
                        onClick={() => {
                          groupLessonDayOverrideRemove(groupId, row.dateKey, row.slotId)
                          enqueueSnackbar('Vəziyyət sıfırlandı', { variant: 'success' })
                        }}
                        sx={{ textTransform: 'none' }}
                      >
                        Normala qaytar
                      </Button>
                    ) : null}
                  </Stack>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {lessonRows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Bu həftə üçün cədvəl slotu yoxdur (qrup cədvəlini admin təyin edir).
        </Typography>
      ) : null}
    </Stack>
  )
}

function GradesTab({
  groupId,
  teacherId,
  roster,
  teachers,
  studentSetGroupGrade,
}: {
  groupId: string
  teacherId: string
  roster: AdminStudent[]
  teachers: AdminTeacher[]
  studentSetGroupGrade: (studentId: string, groupId: string, score: number | null, note: string, teacherId: string) => void
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Bal və qeyd saxlanılır; aşağıda hər tələbə üçün tarixçə (kim, nə vaxt) göstərilir.
      </Typography>
      {roster.map((s) => (
        <GradeBlock
          key={`${s.id}-${JSON.stringify(s.gradeByGroupId?.[groupId] ?? null)}`}
          student={s}
          groupId={groupId}
          teacherId={teacherId}
          teachers={teachers}
          onSave={studentSetGroupGrade}
        />
      ))}
      {roster.length === 0 ? <Typography variant="body2">Tələbə yoxdur.</Typography> : null}
    </Stack>
  )
}

function teacherName(teachers: AdminTeacher[], id: string): string {
  return teachers.find((t) => t.id === id)?.name ?? id
}

function GradeBlock({
  student,
  groupId,
  teacherId,
  teachers,
  onSave,
}: {
  student: AdminStudent
  groupId: string
  teacherId: string
  teachers: AdminTeacher[]
  onSave: (studentId: string, groupId: string, score: number | null, note: string, teacherId: string) => void
}) {
  const initial = student.gradeByGroupId?.[groupId]
  const [scoreStr, setScoreStr] = useState(initial?.score != null ? String(initial.score) : '')
  const [note, setNote] = useState(initial?.note ?? '')
  const history = [...(student.gradeHistoryByGroupId?.[groupId] ?? [])].reverse()

  return (
    <Stack spacing={1} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Typography fontWeight={800}>{student.name}</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
        <TextField label="Bal (0–100)" value={scoreStr} onChange={(e) => setScoreStr(e.target.value)} type="number" fullWidth inputProps={{ min: 0, max: 100 }} />
        <TextField label="Qeyd" value={note} onChange={(e) => setNote(e.target.value)} fullWidth />
        <Button
          variant="contained"
          onClick={() => {
            onSave(student.id, groupId, parseScore(scoreStr), note, teacherId)
            enqueueSnackbar(`${student.name}: saxlanıldı`, { variant: 'success' })
          }}
          sx={{ textTransform: 'none', fontWeight: 800, whiteSpace: 'nowrap' }}
        >
          Saxla
        </Button>
      </Stack>
      {history.length ? (
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            Tarixçə
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
            {history.slice(0, 12).map((h) => (
              <Typography key={h.id} variant="caption" color="text.secondary">
                {new Date(h.recordedAt).toLocaleString('az-AZ', { dateStyle: 'short', timeStyle: 'short' })} ·{' '}
                {teacherName(teachers, h.teacherId)} · bal: {h.score ?? '—'} · {h.note || '—'}
              </Typography>
            ))}
          </Stack>
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Hələ tarixçə yoxdur.
        </Typography>
      )}
    </Stack>
  )
}
