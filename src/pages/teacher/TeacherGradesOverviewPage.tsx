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
import { useAuth } from '@/contexts/AuthContext'
import { useAdminData } from '@/contexts/AdminDataContext'
import { courseById } from '@/lib/adminSelectors'
import { resolveTeacherIdByEmail, studentsInGroup, teacherActiveGroups } from '@/lib/teacherScope'

export function TeacherGradesOverviewPage() {
  const { user } = useAuth()
  const { state } = useAdminData()

  const teacherId = useMemo(
    () => (user?.email ? resolveTeacherIdByEmail(state, user.email) : null),
    [state, user],
  )

  const groups = useMemo(() => (teacherId ? teacherActiveGroups(state, teacherId) : []), [state, teacherId])

  if (!teacherId) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={900}>
          Qiymət və qeyd — ümumi baxış
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
        Qiymət və qeyd — ümumi baxış
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Hər qrup üzrə cari bal və son yenilənmə. Ətraflı tarixçə üçün qrupun <b>Qiymətləndirmə</b> tabı.
      </Typography>

      {groups.map((g) => {
        const course = courseById(state, g.courseId)
        const roster = studentsInGroup(state, g.id)
        return (
          <Card key={g.id} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                <div>
                  <Typography variant="h6" fontWeight={900}>
                    {g.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {course?.name ?? 'Kurs'}
                  </Typography>
                </div>
                <Typography component={RouterLink} to={`/teacher/groups/${g.id}`} variant="body2" fontWeight={800} sx={{ textDecoration: 'none', alignSelf: 'flex-start' }}>
                  Qrupa keç →
                </Typography>
              </Stack>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tələbə</TableCell>
                    <TableCell align="right">Bal</TableCell>
                    <TableCell>Qeyd</TableCell>
                    <TableCell>Son yeniləmə</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roster.map((s) => {
                    const gr = s.gradeByGroupId?.[g.id]
                    return (
                      <TableRow key={s.id} hover>
                        <TableCell>{s.name}</TableCell>
                        <TableCell align="right">{gr?.score != null ? gr.score : '—'}</TableCell>
                        <TableCell sx={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {gr?.note?.trim() ? gr.note : '—'}
                        </TableCell>
                        <TableCell>
                          {gr?.updatedAt
                            ? new Date(gr.updatedAt).toLocaleString('az-AZ', { dateStyle: 'short', timeStyle: 'short' })
                            : '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      })}

      {groups.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Aktiv qrup yoxdur.
        </Typography>
      ) : null}
    </Stack>
  )
}
