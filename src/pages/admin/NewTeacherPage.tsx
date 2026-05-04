import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { useAdminData } from '@/contexts/AdminDataContext'

export function NewTeacherPage() {
  const { teacherAdd } = useAdminData()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const save = () => {
    if (!name.trim() || !email.trim()) {
      enqueueSnackbar('Ad və e-poçt mütləqdir', { variant: 'warning' })
      return
    }
    teacherAdd({
      name: name.trim(),
      email: email.trim(),
      status: 'active',
      lessonsTaught: 0,
      teacherAttendancePct: 100,
    })
    enqueueSnackbar('Müəllim əlavə olundu', { variant: 'success' })
    navigate('/admin/teachers')
  }

  return (
    <Box>
      <AdminPageHeader title="Yeni müəllim" description="Əsas məlumat — qruplar sonra təyin edilir." />
      <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 520, borderColor: 'divider' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Ad Soyad" required value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="E-poçt" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <Typography variant="caption" color="text.secondary">
            Statistik sahələri (dərs sayı, davamiyyət) avtomatik və ya detal səhifədən yenilənə bilər.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={save} sx={{ textTransform: 'none', fontWeight: 800 }}>
              Saxla
            </Button>
            <Button onClick={() => navigate(-1)} sx={{ textTransform: 'none' }}>
              Ləğv
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
