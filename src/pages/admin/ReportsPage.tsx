import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { enqueueSnackbar } from 'notistack'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { useAdminData } from '@/contexts/AdminDataContext'
import { courseById, flattenInstallments, groupById, groupLabel } from '@/lib/adminSelectors'
import { downloadCsv } from '@/utils/csv'

const reports = [
  {
    key: 'groups',
    title: 'Qrup hesabatı',
    desc: 'Kurs, müəllim, doluluq və vəziyyət.',
  },
  {
    key: 'teachers',
    title: 'Müəllim hesabatı',
    desc: 'E-poçt, vəziyyət, dərs sayı və iştirak faizi.',
  },
  {
    key: 'attendance',
    title: 'Davamiyyət hesabatı',
    desc: 'Tələbə və qrup üzrə ümumi faiz.',
  },
  {
    key: 'payments',
    title: 'Ödəniş hesabatı',
    desc: 'Bütün taksit sətirləri (məbləğ, tarix, vəziyyət).',
  },
] as const

export function ReportsPage() {
  const { state } = useAdminData()

  const exportGroups = () => {
    const headers = ['Qrup', 'Kurs', 'Müəllim', 'Tələbə sayı', 'Limit', 'Doluluq %', 'Vəziyyət']
    const rows = state.groups.map((g) => {
      const fill = g.maxStudents > 0 ? Math.round((g.studentIds.length / g.maxStudents) * 100) : 0
      return [
        g.name,
        courseById(state, g.courseId)?.name ?? '—',
        state.teachers.find((t) => t.id === g.teacherId)?.name ?? '—',
        String(g.studentIds.length),
        String(g.maxStudents),
        String(fill),
        g.status,
      ]
    })
    downloadCsv('qruplar.csv', headers, rows)
    enqueueSnackbar('CSV yükləndi', { variant: 'success' })
  }

  const exportTeachers = () => {
    const headers = ['Müəllim', 'E-poçt', 'Vəziyyət', 'Keçirdiyi dərs', 'İştirak %', 'Aktiv qrup sayı']
    const rows = state.teachers.map((t) => {
      const ag = state.groups.filter((g) => g.teacherId === t.id && g.status === 'active').length
      return [t.name, t.email, t.status, String(t.lessonsTaught), String(t.teacherAttendancePct), String(ag)]
    })
    downloadCsv('muellimler.csv', headers, rows)
    enqueueSnackbar('CSV yükləndi', { variant: 'success' })
  }

  const exportAttendance = () => {
    const headers = ['Tələbə', 'Qrup', 'Davamiyyət %', 'Vəziyyət']
    const rows = state.students.map((s) => [s.name, groupLabel(state, s.groupId), String(s.attendanceRate), s.status])
    downloadCsv('davamiyyet.csv', headers, rows)
    enqueueSnackbar('CSV yükləndi', { variant: 'success' })
  }

  const exportPayments = () => {
    const headers = ['Tələbə', 'Qrup', 'Kurs', 'Ay etiketi', 'Son tarix', 'Məbləğ', 'Vəziyyət']
    const rows = flattenInstallments(state).map((p) => {
      const st = state.students.find((s) => s.id === p.studentId)
      const g = st ? groupById(state, st.groupId) : undefined
      const ins = st?.installments.find((i) => i.id === p.installmentId)
      const courseName = g ? courseById(state, g.courseId)?.name ?? '—' : '—'
      return [p.student, p.group, courseName, ins?.monthLabel ?? '—', p.due, String(p.amount), p.status]
    })
    downloadCsv('odenisler.csv', headers, rows)
    enqueueSnackbar('CSV yükləndi', { variant: 'success' })
  }

  const handlers = {
    groups: exportGroups,
    teachers: exportTeachers,
    attendance: exportAttendance,
    payments: exportPayments,
  }

  return (
    <Box>
      <AdminPageHeader
        title="Ümumi hesabat"
        description="Cari admin məlumatlarından CSV faylı yaradılır (brauzer yükləməsi)."
      />
      <Grid container spacing={2}>
        {reports.map((r) => (
          <Grid key={r.key} size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: 1, borderColor: 'divider' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: 1, p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {r.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, flex: 1, lineHeight: 1.6 }}>
                  {r.desc}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                  <Button
                    size="medium"
                    variant="contained"
                    startIcon={<DownloadOutlinedIcon />}
                    onClick={() => handlers[r.key]()}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    CSV yüklə
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
