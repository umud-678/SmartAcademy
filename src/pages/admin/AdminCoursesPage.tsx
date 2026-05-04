import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useState } from 'react'
import Grid from '@mui/material/Grid2'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { useAdminData } from '@/contexts/AdminDataContext'
import type { AdminCourse } from '@/types/admin'

export function AdminCoursesPage() {
  const { state, courseAdd, courseUpdate } = useAdminData()
  const [edit, setEdit] = useState<AdminCourse | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <Box>
      <AdminPageHeader
        title="Kurslar"
        description="Siyahıdan nümunə kurslar + özünüz yazdığınız istənilən ad. «Yeni kurs» ilə əl ilə ad, müddət və qiymət daxil edin — qruplar sonra bu kursa bağlanır."
        actions={
          <Button variant="contained" onClick={() => setCreating(true)} sx={{ textTransform: 'none', fontWeight: 700 }}>
            + Yeni kurs (əl ilə ad)
          </Button>
        }
      />
      <Grid container spacing={2}>
        {state.courses.map((c) => {
          const activeGroups = state.groups.filter((g) => g.courseId === c.id && g.status === 'active').length
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.id}>
              <Card variant="outlined" sx={{ borderRadius: 3, height: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary" fontWeight={800}>
                    {c.disabled ? 'Deaktiv' : 'Aktiv'}
                  </Typography>
                  <Typography variant="h6" fontWeight={900} sx={{ mt: 0.5 }}>
                    {c.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Müddət: {c.duration}
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 2, fontWeight: 900, color: 'primary.main' }}>
                    {c.priceAzn} ₼
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Aktiv qrup: {activeGroups}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1, flexWrap: 'wrap' }}>
                  <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setEdit(c)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                    Redaktə
                  </Button>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!c.disabled}
                        onChange={(_, checked) => {
                          courseUpdate(c.id, { disabled: !checked, active: checked })
                          enqueueSnackbar(checked ? 'Kurs aktivləşdi' : 'Kurs deaktiv edildi', { variant: 'success' })
                        }}
                      />
                    }
                    label="Aktiv"
                  />
                </CardActions>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Kursu redaktə et</DialogTitle>
        <DialogContent>
          {edit ? (
            <CourseForm
              initial={edit}
              onSave={(patch) => {
                courseUpdate(edit.id, patch)
                enqueueSnackbar('Yadda saxlanıldı', { variant: 'success' })
                setEdit(null)
              }}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEdit(null)}>Bağla</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={creating} onClose={() => setCreating(false)} fullWidth maxWidth="sm">
        <DialogTitle>Yeni kurs — əl ilə ad</DialogTitle>
        <DialogContent>
          <CourseForm
            isCreate
            onSave={(patch) => {
              courseAdd({
                name: patch.name ?? 'Yeni kurs',
                duration: patch.duration ?? '—',
                priceAzn: patch.priceAzn ?? 0,
                active: true,
                disabled: false,
              })
              enqueueSnackbar('Kurs əlavə olundu', { variant: 'success' })
              setCreating(false)
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreating(false)}>Bağla</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function CourseForm({
  initial,
  isCreate,
  onSave,
}: {
  initial?: AdminCourse
  isCreate?: boolean
  onSave: (p: Partial<AdminCourse>) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [duration, setDuration] = useState(initial?.duration ?? '')
  const [priceAzn, setPriceAzn] = useState(initial?.priceAzn ?? 0)
  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <TextField
        label="Kurs adı"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        required
        placeholder="Məsələn, rəsm kursu, SAT hazırlığı, 1C mühasibat…"
        helperText={isCreate ? 'İstənilən adı özünüz yazın; mətn məhdudiyyəti yoxdur.' : undefined}
      />
      <TextField label="Müddət" value={duration} onChange={(e) => setDuration(e.target.value)} fullWidth />
      <TextField label="Qiymət (AZN)" type="number" value={priceAzn} onChange={(e) => setPriceAzn(Number(e.target.value))} fullWidth />
      <Button variant="contained" onClick={() => onSave({ name, duration, priceAzn })} sx={{ textTransform: 'none', fontWeight: 800 }}>
        Saxla
      </Button>
    </Stack>
  )
}
