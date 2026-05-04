import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
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
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAdminData } from '@/contexts/AdminDataContext'
import { useAdminShell } from '@/contexts/AdminShellContext'
import type { AdminTeacher, TeacherStatus } from '@/types/admin'

export function TeachersListPage() {
  const { state, teacherUpdate } = useAdminData()
  const { globalSearch } = useAdminShell()
  const [edit, setEdit] = useState<AdminTeacher | null>(null)

  const rows = useMemo(() => {
    const q = globalSearch.trim().toLowerCase()
    return state.teachers
      .filter((t) => {
        if (!q) return true
        return `${t.name} ${t.email}`.toLowerCase().includes(q)
      })
      .map((t) => ({
        t,
        activeGroups: state.groups.filter((g) => g.teacherId === t.id && g.status === 'active').length,
      }))
  }, [state.teachers, state.groups, globalSearch])

  const columns: DataTableColumn<(typeof rows)[0]>[] = [
    { id: 'name', label: 'Ad Soyad', render: ({ t }) => <Typography fontWeight={700}>{t.name}</Typography> },
    { id: 'ag', label: 'Aktiv qrup sayı', render: ({ activeGroups }) => activeGroups },
    {
      id: 'st',
      label: 'Vəziyyət',
      render: ({ t }) => <StatusBadge label={t.status === 'active' ? 'Aktiv' : 'Deaktiv'} tone={t.status === 'active' ? 'success' : 'warning'} />,
    },
    {
      id: 'act',
      label: '',
      align: 'right',
      render: ({ t }) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Button component={RouterLink} to={`/admin/teachers/${t.id}`} size="small" variant="outlined" startIcon={<VisibilityOutlinedIcon />}>
            Bax
          </Button>
          <Button size="small" variant="contained" startIcon={<EditOutlinedIcon />} onClick={() => setEdit(t)} sx={{ textTransform: 'none' }}>
            Redaktə
          </Button>
        </Stack>
      ),
    },
  ]

  return (
    <Box>
      <AdminPageHeader
        title="Müəllimlər"
        description="Qrup sayı və status — ətraflı statistika müəllim kartındadır."
        actions={
          <Button component={RouterLink} to="/admin/teachers/new" variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>
            + Yeni müəllim
          </Button>
        }
      />
      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
        <CardContent sx={{ p: 0 }}>
          <DataTable columns={columns} rows={rows} getRowId={(r) => r.t.id} />
        </CardContent>
      </Card>

      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Müəllim — tez redaktə</DialogTitle>
        <DialogContent>
          {edit ? (
            <EditTeacherForm
              teacher={edit}
              onSave={(patch) => {
                teacherUpdate(edit.id, patch)
                enqueueSnackbar('Yeniləndi', { variant: 'success' })
                setEdit(null)
              }}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEdit(null)}>Bağla</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function EditTeacherForm({ teacher, onSave }: { teacher: AdminTeacher; onSave: (p: Partial<AdminTeacher>) => void }) {
  const [name, setName] = useState(teacher.name)
  const [email, setEmail] = useState(teacher.email)
  const [status, setStatus] = useState<TeacherStatus>(teacher.status)
  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <TextField label="Ad Soyad" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
      <TextField label="E-poçt" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
      <FormControl fullWidth>
        <InputLabel>Vəziyyət</InputLabel>
        <Select label="Vəziyyət" value={status} onChange={(e) => setStatus(e.target.value as TeacherStatus)}>
          <MenuItem value="active">Aktiv</MenuItem>
          <MenuItem value="inactive">Deaktiv</MenuItem>
        </Select>
      </FormControl>
      <Button variant="contained" onClick={() => onSave({ name, email, status })} sx={{ textTransform: 'none', fontWeight: 800 }}>
        Saxla
      </Button>
    </Stack>
  )
}
