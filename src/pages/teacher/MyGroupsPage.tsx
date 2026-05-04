import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminData } from '@/contexts/AdminDataContext'
import { courseById } from '@/lib/adminSelectors'
import { formatGroupScheduleSlots } from '@/lib/teacherPanelUtils'
import { resolveTeacherIdByEmail, teacherActiveGroups } from '@/lib/teacherScope'

export function MyGroupsPage() {
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
          Mənim qruplarım
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
        Mənim qruplarım
      </Typography>
      <Stack spacing={2}>
        {groups.map((g) => {
          const course = courseById(state, g.courseId)
          const count = g.studentIds.length
          const pct = g.maxStudents > 0 ? Math.round((count / g.maxStudents) * 100) : 0
          const schedLabel = formatGroupScheduleSlots(g)
          return (
            <Card key={g.id} variant="outlined" sx={{ borderRadius: 3, '&:hover': { borderColor: 'primary.main' } }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <GroupsOutlinedIcon color="primary" />
                      <Box>
                        <Typography variant="h6" fontWeight={900}>
                          {g.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {course?.name ?? 'Kurs'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Button component={RouterLink} to={`/teacher/groups/${g.id}`} variant="contained" sx={{ textTransform: 'none', fontWeight: 800 }}>
                      Qrupa bax
                    </Button>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Cədvəl: <b>{schedLabel}</b>
                  </Typography>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Tələbə sayı
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {count}/{g.maxStudents} ({pct}%)
                      </Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={pct} sx={{ height: 10, borderRadius: 999 }} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )
        })}
      </Stack>
      {groups.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Aktiv qrup tapılmadı.
        </Typography>
      ) : null}
    </Stack>
  )
}
