import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useEffect, useState } from 'react'

const mock = {
  course: 'Full-Stack Web',
  group: 'FS-2026-A',
  teacher: 'A. Məmmədov',
  attendancePct: 88,
  balance: 120,
  paid: 880,
  nextLesson: { date: '2026-05-06', time: '18:00' },
}

const promoSlides = [
  {
    title: 'Yeni kurs: Data Science əsasları',
    subtitle: 'İşləyən tələbələr üçün axşam qrupları açıldı.',
    cta: 'Ətraflı məlumat',
    tone: 'linear-gradient(120deg, #1d4ed8 0%, #2563eb 55%, #38bdf8 100%)',
  },
  {
    title: 'English Speaking Club',
    subtitle: 'Hər həftə canlı danışıq sessiyası və mentor dəstəyi.',
    cta: 'Qoşul',
    tone: 'linear-gradient(120deg, #0f766e 0%, #0d9488 55%, #14b8a6 100%)',
  },
  {
    title: 'Karyera xidməti paketi',
    subtitle: 'CV, müsahibə hazırlığı və şirkətlərə yönləndirmə.',
    cta: 'Müraciət et',
    tone: 'linear-gradient(120deg, #7c3aed 0%, #9333ea 55%, #a855f7 100%)',
  },
]

const otherServices = [
  { title: 'QA və Test mühəndisliyi', meta: '3 ay · Sertifikat', badge: 'Populyar' },
  { title: 'UI/UX Dizayn + Figma', meta: 'Praktik layihələr', badge: 'Yeni' },
  { title: 'DevOps (Docker/CI-CD)', meta: 'Middle səviyyəyə hazırlıq', badge: 'Top' },
  { title: 'Kibertəhlükəsizlik əsasları', meta: 'Hands-on lab sessiyaları', badge: 'Kampaniya' },
]

const notices = [
  { text: 'Bu həftə sonu masterclass: "AI ilə məhsuldarlıq".', severity: 'info' as const },
  { text: 'Ödənişin 2-ci hissəsi üçün son tarix: 10 May.', severity: 'warning' as const },
  { text: 'Yeni mentorluq proqramı üçün qeydiyyat açıqdır.', severity: 'success' as const },
]

export function StudentDashboardPage() {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((v) => (v + 1) % promoSlides.length)
    }, 4500)
    return () => window.clearInterval(id)
  }, [])

  const currentPromo = promoSlides[slide]!

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Ana ekran</Typography>
      <Typography variant="body2" color="text.secondary">
        Reklamlar, elanlar və akademiya xidmətləri.
      </Typography>

      <Card
        sx={{
          borderRadius: 3,
          color: '#fff',
          background: currentPromo.tone,
          position: 'relative',
          overflow: 'hidden',
          transition: 'background 0.4s ease',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
            transform: 'translateX(-100%)',
            animation: 'saPromoShine 3.5s linear infinite',
          },
          '@keyframes saPromoShine': {
            '100%': { transform: 'translateX(100%)' },
          },
        }}
      >
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" gap={2}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <LocalOfferOutlinedIcon />
                <Typography fontWeight={800}>Kampaniya və elanlar</Typography>
              </Stack>
              <Typography variant="h5" fontWeight={900}>
                {currentPromo.title}
              </Typography>
              <Typography sx={{ mt: 0.8, opacity: 0.95 }}>{currentPromo.subtitle}</Typography>
            </Box>
            <Button variant="contained" color="inherit" sx={{ color: '#1e3a8a', fontWeight: 800, textTransform: 'none', minWidth: 160 }}>
              {currentPromo.cta}
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {promoSlides.map((_, idx) => (
              <Box
                key={idx}
                onClick={() => setSlide(idx)}
                sx={{
                  width: idx === slide ? 24 : 8,
                  height: 8,
                  borderRadius: 999,
                  bgcolor: idx === slide ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={1.25}>
        {notices.map((n) => (
          <Grid key={n.text} size={{ xs: 12, md: 4 }}>
            <Alert severity={n.severity} icon={<NotificationsActiveOutlinedIcon fontSize="inherit" />}>
              {n.text}
            </Alert>
          </Grid>
        ))}
      </Grid>

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

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <InfoOutlinedIcon color="primary" />
                <Typography fontWeight={800}>Digər kurs və xidmətlər</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Karyera inkişafı üçün əlavə xidmətlər və fərqli istiqamətlər.
              </Typography>
              <Grid container spacing={1.5}>
                {otherServices.map((service) => (
                  <Grid key={service.title} size={{ xs: 12, sm: 6 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2.5, borderStyle: 'dashed' }}>
                      <CardContent sx={{ pb: '16px !important' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography fontWeight={700}>{service.title}</Typography>
                          <Chip size="small" label={service.badge} color="primary" variant="outlined" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {service.meta}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%' }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <LocationOnOutlinedIcon color="error" />
                <Typography fontWeight={800}>Əlaqə və ünvan</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Yasamal rayonu, Mətbuat prospekti 45, Bakı
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <PhoneOutlinedIcon fontSize="small" color="action" />
                <Typography variant="body2">+994 55 123 45 67</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                support@smartacademy.edu
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  minHeight: 220,
                }}
              >
                <Box
                  component="iframe"
                  title="SmartAcademy xəritə"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=49.79%2C40.35%2C49.90%2C40.43&layer=mapnik"
                  sx={{ width: '100%', height: 230, border: 0 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
