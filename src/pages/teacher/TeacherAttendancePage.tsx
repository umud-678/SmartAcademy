import {
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminData } from '@/contexts/AdminDataContext'
import { courseById } from '@/lib/adminSelectors'
import type { AdminState } from '@/types/admin'
import { teacherLowAttendanceStudents } from '@/lib/teacherPanelUtils'
import { resolveTeacherIdByEmail, studentsInGroup, teacherActiveGroups, teacherStudentIds } from '@/lib/teacherScope'

function groupAvgRate(state: AdminState, groupId: string): number | null {
  const roster = studentsInGroup(state, groupId)
  if (!roster.length) return null
  return Math.round(roster.reduce((a, s) => a + s.attendanceRate, 0) / roster.length)
}

export function TeacherAttendancePage() {
  const { user } = useAuth()
  const { state } = useAdminData()

  const teacherId = useMemo(
    () => (user?.email ? resolveTeacherIdByEmail(state, user.email) : null),
    [state, user],
  )

  const groups = useMemo(() => (teacherId ? teacherActiveGroups(state, teacherId) : []), [state, teacherId])

  const studentRows = useMemo(() => {
    if (!teacherId) return []
    const ids = teacherStudentIds(state, teacherId)
    return ids
      .map((id) => {
        const s = state.students.find((x) => x.id === id)
        if (!s) return null
        const g = s.groupId ? state.groups.find((x) => x.id === s.groupId) : undefined
        return { s, groupName: g?.name ?? '—' }
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => a.s.attendanceRate - b.s.attendanceRate)
  }, [state, teacherId])

  const warnings = useMemo(() => (teacherId ? teacherLowAttendanceStudents(state, teacherId, 75) : []), [state, teacherId])

  if (!teacherId) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={900}>
          Davamiyyətə baxış
        </Typography>
        <Typography variant="body2" color="text.secondary">
          E-poçt admin siyahısındakı müəllimlə uyğun gəlmir. Nümunə: <b>ali.mammadov@smartacademy.edu</b>
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={900}>
        Davamiyyətə baxış
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Qrup üzrə orta göstərici və tələbələr üzrə statistika. Davamiyyəti dəyişmək üçün qrupun <b>Davamiyyət</b> tabına keçin.
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={900} gutterBottom>
            Qruplar
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Qrup</TableCell>
                <TableCell>Kurs</TableCell>
                <TableCell align="right">Tələbə</TableCell>
                <TableCell align="right">Orta davamiyyət %</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((g) => {
                const avg = groupAvgRate(state, g.id)
                const course = courseById(state, g.courseId)
                return (
                  <TableRow key={g.id} hover>
                    <TableCell>
                      <Typography fontWeight={700}>{g.name}</Typography>
                    </TableCell>
                    <TableCell>{course?.name ?? '—'}</TableCell>
                    <TableCell align="right">{g.studentIds.length}</TableCell>
                    <TableCell align="right">{avg != null ? `${avg}%` : '—'}</TableCell>
                    <TableCell align="right">
                      <Typography component={RouterLink} to={`/teacher/groups/${g.id}`} variant="body2" sx={{ fontWeight: 700, textDecoration: 'none' }}>
                        Qrup
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={900} gutterBottom>
            Tələbələr (sizin qruplarınız)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ad</TableCell>
                <TableCell>Qrup</TableCell>
                <TableCell>Vəziyyət</TableCell>
                <TableCell align="right">Davamiyyət %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {studentRows.map(({ s, groupName }) => (
                <TableRow key={s.id} hover>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{groupName}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={s.status === 'active' ? 'Aktiv' : 'Dayandırılıb'}
                      tone={s.status === 'active' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={800} color={s.attendanceRate < 75 ? 'warning.main' : 'text.primary'}>
                      {s.attendanceRate}%
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'warning.light' }}>
        <CardContent>
          <Typography fontWeight={900} gutterBottom>
            Xəbərdarlıq: aşağı davamiyyət (75%-dən az)
          </Typography>
          {warnings.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aktiv tələbələrdə bu həddi keçən yoxdur.
            </Typography>
          ) : (
            <Stack spacing={0.75}>
              {warnings.map((w) => (
                <Typography key={w.studentId} variant="body2">
                  <b>{w.name}</b> — {w.rate}% · {w.groupName}
                </Typography>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}
