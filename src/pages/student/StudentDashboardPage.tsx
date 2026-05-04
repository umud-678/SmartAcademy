import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'

const mock = {
  course: 'Full-Stack Web',
  group: 'FS-2026-A',
  teacher: 'A. Məmmədov',
  attendancePct: 88,
  balance: 120,
  paid: 880,
  nextLesson: { date: '2026-05-06', time: '18:00' },
}

export function StudentDashboardPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Tələbə paneli</Typography>
      <Typography variant="body2" color="text.secondary">
        Aktiv kurs, davamiyyət, ödəniş xülasəsi və növbəti dərs (statik nümunə).
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <SchoolOutlinedIcon color="primary" />
                <Typography fontWeight={700}>Aktiv kurs</Typography>
              </Stack>
              <Typography variant="h6">{mock.course}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <GroupsOutlinedIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {mock.group} · {mock.teacher}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <PercentOutlinedIcon color="success" />
                <Typography fontWeight={700}>Davamiyyət</Typography>
              </Stack>
              <Typography variant="h4">{mock.attendancePct}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <PaymentsOutlinedIcon color="warning" />
                <Typography fontWeight={700}>Ödəniş</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Ödənilib: {mock.paid} ₼
              </Typography>
              <Typography variant="h6" color="error">
                Qalan borc: {mock.balance} ₼
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <EventAvailableOutlinedIcon color="primary" />
                <Box>
                  <Typography fontWeight={700}>Növbəti dərs</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mock.nextLesson.date} · {mock.nextLesson.time}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
