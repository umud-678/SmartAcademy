import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminData } from '@/contexts/AdminDataContext'
import { addDays, localDateKey, startOfWeekMonday, teacherWeekScheduleCells } from '@/lib/teacherPanelUtils'
import { resolveTeacherIdByEmail } from '@/lib/teacherScope'
import type { TeacherScheduleCell } from '@/lib/teacherPanelUtils'

type ViewMode = 'week' | 'month'

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const
const WEEK_LABEL: Record<number, string> = { 1: 'B.e', 2: 'Ç.a', 3: 'Ç', 4: 'C.a', 5: 'C', 6: 'Ş', 0: 'B.' }

export function TeacherSchedulePage() {
  const { user } = useAuth()
  const { state } = useAdminData()
  const [view, setView] = useState<ViewMode>('week')
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeekMonday(new Date()))
  const [picked, setPicked] = useState<TeacherScheduleCell | null>(null)

  const teacherId = useMemo(
    () => (user?.email ? resolveTeacherIdByEmail(state, user.email) : null),
    [state, user],
  )

  const cells = useMemo(
    () => (teacherId ? teacherWeekScheduleCells(state, teacherId, weekAnchor) : []),
    [state, teacherId, weekAnchor],
  )

  const byDow = useMemo(() => {
    const m: Record<number, TeacherScheduleCell[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    for (const c of cells) {
      m[c.dow].push(c)
    }
    for (const k of Object.keys(m)) {
      m[Number(k)].sort((a, b) => a.start.localeCompare(b.start))
    }
    return m
  }, [cells])

  const weekLabel = `${localDateKey(weekAnchor)} — ${localDateKey(addDays(weekAnchor, 6))}`

  if (!teacherId) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={900}>
          Dərs cədvəlim
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
        Dərs cədvəlim
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Yalnız sizə təyin olunmuş qruplar. Rənglər qrupu fərqləndirir; slot üzərinə klik — detal.
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
        <ToggleButtonGroup exclusive value={view} onChange={(_, v) => v && setView(v)} size="small">
          <ToggleButton value="week">Həftə</ToggleButton>
          <ToggleButton value="month">Ay</ToggleButton>
        </ToggleButtonGroup>
        {view === 'week' ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton aria-label="Əvvəlki həftə" onClick={() => setWeekAnchor((w) => addDays(w, -7))}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="body2" fontWeight={700}>
              {weekLabel}
            </Typography>
            <IconButton aria-label="Növbəti həftə" onClick={() => setWeekAnchor((w) => addDays(w, 7))}>
              <ChevronRightIcon />
            </IconButton>
            <Button size="small" onClick={() => setWeekAnchor(startOfWeekMonday(new Date()))} sx={{ textTransform: 'none' }}>
              Bu həftə
            </Button>
          </Stack>
        ) : null}
      </Stack>

      {view === 'week' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(7, 1fr)' },
            gap: 1,
          }}
        >
          {WEEK_ORDER.map((dow) => (
            <Card key={dow} variant="outlined" sx={{ minHeight: 160, borderRadius: 2 }}>
              <CardContent sx={{ p: 1.25 }}>
                <Typography fontWeight={900} gutterBottom>
                  {WEEK_LABEL[dow]}
                </Typography>
                <Stack spacing={1}>
                  {(byDow[dow] ?? []).map((c) => (
                    <Box
                      key={c.id}
                      component="button"
                      type="button"
                      onClick={() => setPicked(c)}
                      sx={{
                        textAlign: 'left',
                        border: 'none',
                        cursor: 'pointer',
                        p: 1,
                        borderRadius: 1,
                        bgcolor: `${c.colorHex}22`,
                        borderLeft: `4px solid ${c.colorHex}`,
                        '&:hover': { filter: 'brightness(0.97)' },
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" display="block">
                        {c.start}–{c.end}
                      </Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {c.groupName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.room}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Ay görünüşü üçün tam təqvim paketi (məsələn, MUI X DateCalendar və qruplar) sonrakı mərhələdə əlavə oluna bilər. Hal-hazırda həftə görünüşü real məlumatla işləyir.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(picked)} onClose={() => setPicked(null)} maxWidth="xs" fullWidth>
        {picked ? (
          <>
            <DialogTitle sx={{ fontWeight: 900 }}>{picked.groupName}</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {picked.courseName}
              </Typography>
              <Typography variant="body2">
                Tarix: <b>{picked.dateKey}</b>
              </Typography>
              <Typography variant="body2">
                Saat: <b>
                  {picked.start}–{picked.end}
                </b>
              </Typography>
              <Typography variant="body2">
                Otaq: <b>{picked.room}</b>
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button component={RouterLink} to={`/teacher/groups/${picked.groupId}`} onClick={() => setPicked(null)} variant="contained" sx={{ textTransform: 'none' }}>
                Qrupa keç
              </Button>
              <Button onClick={() => setPicked(null)} sx={{ textTransform: 'none' }}>
                Bağla
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Stack>
  )
}
