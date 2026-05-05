import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminData } from '@/contexts/AdminDataContext'

function fmtDate(v?: string | null): string {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleDateString('az-AZ', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function StudentProfilePage() {
  const { user } = useAuth()
  const { state } = useAdminData()

  const student = useMemo(() => {
    const email = user?.email?.trim().toLowerCase()
    if (!email) return undefined
    return state.students.find((s) => s.email.trim().toLowerCase() === email)
  }, [state.students, user?.email])

  const group = useMemo(() => {
    if (!student?.groupId) return undefined
    return state.groups.find((g) => g.id === student.groupId)
  }, [state.groups, student?.groupId])

  const course = useMemo(() => {
    if (!group?.courseId) return undefined
    return state.courses.find((c) => c.id === group.courseId)
  }, [state.courses, group?.courseId])

  const teacher = useMemo(() => {
    if (!group?.teacherId) return undefined
    return state.teachers.find((t) => t.id === group.teacherId)
  }, [state.teachers, group?.teacherId])

  if (!student) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={900}>
          Profil
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tələbə profili tapılmadı. Admin paneldə bu e-poçtla tələbə kartını yoxlayın.
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={900}>
        Profil məlumatları
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Qeydiyyat və təhsil məlumatlarınız.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <SchoolOutlinedIcon color="primary" />
                <Typography fontWeight={800}>Şəxsi məlumat</Typography>
              </Stack>
              <Stack spacing={1}>
                <Typography variant="body2">Ad Soyad: <b>{student.name}</b></Typography>
                <Typography variant="body2">E-poçt: <b>{student.email}</b></Typography>
                <Typography variant="body2">Telefon: <b>{student.phone || '—'}</b></Typography>
                <Typography variant="body2">Valideyn telefonu: <b>{student.parentPhone || '—'}</b></Typography>
                <Typography variant="body2">Status: <b>{student.status === 'active' ? 'Aktiv' : 'Dayandırılıb'}</b></Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <CalendarMonthOutlinedIcon color="primary" />
                <Typography fontWeight={800}>Qeydiyyat məlumatı</Typography>
              </Stack>
              <Stack spacing={1}>
                <Typography variant="body2">Qeydiyyat tarixi: <b>{fmtDate(student.registeredAt)}</b></Typography>
                <Typography variant="body2">Kursa başlama tarixi: <b>{fmtDate(student.registeredAt)}</b></Typography>
                <Typography variant="body2">Ödəniş planı: <b>{student.paymentPlanMode === 'full' ? 'Tam ödəniş' : 'Taksitlə'}</b></Typography>
                <Typography variant="body2">Davamiyyət: <b>{student.attendanceRate}%</b></Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <GroupsOutlinedIcon color="primary" />
                <Typography fontWeight={800}>Təhsil məlumatı</Typography>
              </Stack>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">Oxuduğunuz ixtisas</Typography>
                  <Typography fontWeight={700}>{course?.name ?? '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Qrup</Typography>
                  <Typography fontWeight={700}>{group?.name ?? '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Müəllim</Typography>
                  <Typography fontWeight={700}>{teacher?.name ?? '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <Typography variant="caption" color="text.secondary">Kurs qiyməti</Typography>
                  <Typography fontWeight={700}>{student.coursePriceAzn} ₼</Typography>
                </Grid>
              </Grid>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                Əlavə suallar üçün akademiya ilə əlaqə saxlayın və ya Ayarlar bölməsindən hesab təhlükəsizliyini yeniləyin.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
