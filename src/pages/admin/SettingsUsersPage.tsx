import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAdminData } from '@/contexts/AdminDataContext'
import type { AdminAppUser, AppUserRole } from '@/types/admin'

function randomTempPassword() {
  const part = () => Math.random().toString(36).slice(2, 6)
  return `Sa${part()}${part()}!`
}

export function SettingsUsersPage() {
  const { state, appUserAdd, appUserUpdate, appUserDelete } = useAdminData()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<AppUserRole>('student')
  const [email, setEmail] = useState('')
  const [active, setActive] = useState(true)
  const [tempPw, setTempPw] = useState(() => randomTempPassword())

  const columns: DataTableColumn<AdminAppUser>[] = [
    { id: 'email', label: 'E-poçt', render: (u) => <Typography fontWeight={700}>{u.email}</Typography> },
    {
      id: 'role',
      label: 'Rol',
      render: (u) => (u.role === 'admin' ? 'İdarəçi' : u.role === 'teacher' ? 'Müəllim' : 'Tələbə'),
    },
    {
      id: 'active',
      label: 'Vəziyyət',
      render: (u) => <StatusBadge label={u.active ? 'Aktiv' : 'Deaktiv'} tone={u.active ? 'success' : 'warning'} />,
    },
    {
      id: 'act',
      label: '',
      align: 'right',
      render: (u) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Button size="small" variant="outlined" onClick={() => appUserUpdate(u.id, { active: !u.active })} sx={{ textTransform: 'none' }}>
            {u.active ? 'Deaktiv et' : 'Aktiv et'}
          </Button>
          <Button size="small" color="error" variant="outlined" onClick={() => appUserDelete(u.id)} sx={{ textTransform: 'none' }}>
            Sil
          </Button>
        </Stack>
      ),
    },
  ]

  const submit = () => {
    if (!email.trim()) {
      enqueueSnackbar('E-poçt daxil edin', { variant: 'warning' })
      return
    }
    appUserAdd({ id: crypto.randomUUID(), role, email: email.trim(), active })
    enqueueSnackbar(`İstifadəçi yaradıldı. Müvəqqəti şifrə: ${tempPw}`, { variant: 'success', autoHideDuration: 12_000 })
    setOpen(false)
    setEmail('')
    setTempPw(randomTempPassword())
  }

  return (
    <Box>
      <AdminPageHeader
        title="Tənzimləmələr — istifadəçilər"
        description="İdarəçi, müəllim və tələbə üçün istifadəçi qeydləri (nümunə rejimi). Autentifikasiya serverə qoşulanda şifrələr təhlükəsiz saxlanılacaq."
        actions={
          <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => setOpen(true)} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Yeni istifadəçi
          </Button>
        }
      />
      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
        <CardContent sx={{ p: 0 }}>
          <DataTable columns={columns} rows={state.appUsers} getRowId={(u) => u.id} />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Yeni istifadəçi</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select label="Rol" value={role} onChange={(e) => setRole(e.target.value as AppUserRole)}>
                <MenuItem value="admin">İdarəçi</MenuItem>
                <MenuItem value="teacher">Müəllim</MenuItem>
                <MenuItem value="student">Tələbə</MenuItem>
              </Select>
            </FormControl>
            <TextField label="E-poçt" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth required />
            <TextField
              label="Müvəqqəti şifrə"
              value={tempPw}
              onChange={(e) => setTempPw(e.target.value)}
              fullWidth
              helperText="Bu nümunə rejimində yalnız bildirişdə göstərilir; saxlanılmır."
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button size="small" variant="outlined" onClick={() => setTempPw(randomTempPassword())} sx={{ textTransform: 'none' }}>
                Təsadüfi şifrə
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyOutlinedIcon />}
                onClick={() => {
                  void navigator.clipboard.writeText(tempPw)
                  enqueueSnackbar('Kopyalandı', { variant: 'info' })
                }}
                sx={{ textTransform: 'none' }}
              >
                Kopyala
              </Button>
            </Stack>
            <FormControlLabel control={<Switch checked={active} onChange={(_, v) => setActive(v)} />} label="Aktiv" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Ləğv</Button>
          <Button variant="contained" onClick={submit} sx={{ textTransform: 'none', fontWeight: 800 }}>
            Yarat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
