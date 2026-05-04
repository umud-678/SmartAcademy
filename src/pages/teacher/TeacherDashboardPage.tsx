import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import {
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminData } from '@/contexts/AdminDataContext'
import {
  localDateKey,
  startOfWeekMonday,
  teacherLastAttendanceDate,
  teacherLowAttendanceStudents,
  teacherRecentLateAbsent,
  teacherStudentsAvgAttendance,
  teacherTodayClassRows,
  teacherWeekLessonCount,
} from '@/lib/teacherPanelUtils'
import { resolveTeacherIdByEmail, teacherActiveGroups, teacherStudentIds } from '@/lib/teacherScope'

const STATUS_AZ: Record<'upcoming' | 'in_progress' | 'completed', { label: string; color: 'default' | 'primary' | 'success' }> = {
  upcoming: { label: 'Gəlir', color: 'primary' },
  in_progress: { label: 'Davam edir', color: 'primary' },
  completed: { label: 'Bitib', color: 'success' },
}

export function TeacherDashboardPage() {
  const { user } = useAuth()
  const { state } = useAdminData()

  const teacherId = useMemo(
    () => (user?.email ? resolveTeacherIdByEmail(state, user.email) : null),
    [state, user],
  )

  const weekStart = useMemo(() => startOfWeekMonday(new Date()), [])
  const todayKey = useMemo(() => localDateKey(new Date()), [])

  const kpis = useMemo(() => {
    if (!teacherId) return null
    const groups = teacherActiveGroups(state, teacherId).length
    const students = teacherStudentIds(state, teacherId).length
    const weekLessons = teacherWeekLessonCount(state, teacherId, weekStart)
    const lastAtt = teacherLastAttendanceDate(state, teacherId)
    return { groups, students, weekLessons, lastAtt }
  }, [state, teacherId, weekStart])

  const todayRows = useMemo(() => (teacherId ? teacherTodayClassRows(state, teacherId) : []), [state, teacherId])

  const lowList = useMemo(() => (teacherId ? teacherLowAttendanceStudents(state, teacherId, 80) : []), [state, teacherId])

  const lateAbsent = useMemo(() => (teacherId ? teacherRecentLateAbsent(state, teacherId, 21) : []), [state, teacherId])

  const perfAvg = useMemo(() => (teacherId ? teacherStudentsAvgAttendance(state, teacherId) : null), [state, teacherId])

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography variant="h5" fontWeight={900}>
          İdarə paneli
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Öz qruplarınız, dərs cədvəli, davamiyyət və qiymətlər — admin ödənişləri və sistem idarəsi burada yoxdur.
        </Typography>
      </Stack>

      {!teacherId ? (
        <Typography variant="body2" color="text.secondary">
          E-poçt admin siyahısındakı müəllimlə uyğun gəlmir. Nümunə: <b>ali.mammadov@smartacademy.edu</b>
        </Typography>
      ) : null}

      {kpis ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" component={RouterLink} to="/teacher/groups" sx={{ textDecoration: 'none', borderRadius: 3, height: 1 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <GroupsOutlinedIcon color="primary" />
                  <Typography fontWeight={800}>Aktiv qruplarım</Typography>
                </Stack>
                <Typography variant="h4">{kpis.groups}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" component={RouterLink} to="/teacher/groups" sx={{ textDecoration: 'none', borderRadius: 3, height: 1 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <PeopleAltOutlinedIcon color="success" />
                  <Typography fontWeight={800}>Ümumi tələbə</Typography>
                </Stack>
                <Typography variant="h4">{kpis.students}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" component={RouterLink} to="/teacher/schedule" sx={{ textDecoration: 'none', borderRadius: 3, height: 1 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <AccessTimeOutlinedIcon color="warning" />
                  <Typography fontWeight={800}>Bu həftə dərs</Typography>
                </Stack>
                <Typography variant="h4">{kpis.weekLessons}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Slot sayı (cədvəl üzrə)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" component={RouterLink} to="/teacher/attendance" sx={{ textDecoration: 'none', borderRadius: 3, height: 1 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <FactCheckOutlinedIcon color="action" />
                  <Typography fontWeight={800}>Son davamiyyət</Typography>
                </Stack>
                <Typography variant="h6" fontWeight={800}>
                  {kpis.lastAtt ?? '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Son qeyd tarixi
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={900} gutterBottom>
            Bu günün dərsləri ({todayKey})
          </Typography>
          {todayRows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Bu gün üçün cədvəldə slot yoxdur.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Qrup</TableCell>
                  <TableCell>Saat</TableCell>
                  <TableCell>Otaq</TableCell>
                  <TableCell>Vəziyyət</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {todayRows.map((r) => (
                  <TableRow key={`${r.groupId}-${r.start}`} hover>
                    <TableCell>
                      <Typography component={RouterLink} to={`/teacher/groups/${r.groupId}`} fontWeight={700} sx={{ textDecoration: 'none', color: 'primary.main' }}>
                        {r.groupName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {r.start}–{r.end}
                    </TableCell>
                    <TableCell>{r.room}</TableCell>
                    <TableCell>
                      <Chip size="small" label={STATUS_AZ[r.status].label} color={STATUS_AZ[r.status].color} variant={r.status === 'completed' ? 'filled' : 'outlined'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: 1 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <WarningAmberOutlinedIcon color="warning" />
                <Typography fontWeight={900}>Xəbərdarlıqlar</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Aşağı davamiyyət (80%-dən az) və son gecikmə/qayıb halları.
              </Typography>
              <Stack spacing={1}>
                {lowList.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Aşağı davamiyyətli aktiv tələbə yoxdur.
                  </Typography>
                ) : (
                  lowList.slice(0, 6).map((x) => (
                    <Typography key={x.studentId} variant="body2">
                      <b>{x.name}</b> — {x.rate}% · {x.groupName}
                    </Typography>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: 1 }}>
            <CardContent>
              <Typography fontWeight={900} gutterBottom>
                Son gecikmə / qayıb (21 gün)
              </Typography>
              {lateAbsent.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Qeyd yoxdur.
                </Typography>
              ) : (
                <Stack spacing={0.75}>
                  {lateAbsent.slice(0, 8).map((x, i) => (
                    <Typography key={`${x.date}-${x.name}-${i}`} variant="body2">
                      {x.date} · <b>{x.name}</b> · {x.status === 'late' ? 'Gecikib' : 'Qayıb'} · {x.lesson}
                    </Typography>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {teacherId && perfAvg != null ? (
        <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: 'action.hover' }}>
          <CardContent>
            <Typography fontWeight={900} gutterBottom>
              Qısa göstərici
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aktiv tələbələrin orta davamiyyəti: <b>{perfAvg}%</b> · Bu həftə planlaşdırılmış dərs slotları: <b>{kpis?.weekLessons ?? 0}</b>
            </Typography>
          </CardContent>
        </Card>
      ) : null}
    </Stack>
  )
}
