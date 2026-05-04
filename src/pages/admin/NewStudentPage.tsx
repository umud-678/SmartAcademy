import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { useAdminData } from '@/contexts/AdminDataContext'
import type { AdminStudent, DiscountReasonCode, StudentStatus } from '@/types/admin'
import { buildEqualInstallments, clampDiscountAzn, finalCourseAmount } from '@/utils/installments'

export function NewStudentPage() {
  const { state, studentAdd } = useAdminData()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [teacherFilter, setTeacherFilter] = useState<string>('')
  const [groupId, setGroupId] = useState<string>('')
  const [status, setStatus] = useState<StudentStatus>('active')
  const [coursePriceAzn, setCoursePriceAzn] = useState(5000)
  const [discountAzn, setDiscountAzn] = useState(0)
  const [discountReason, setDiscountReason] = useState('')
  const [discountReasonCode, setDiscountReasonCode] = useState<DiscountReasonCode>('manual')
  const [discountAppliedAt, setDiscountAppliedAt] = useState('')
  const [months, setMonths] = useState(5)
  const [firstDue, setFirstDue] = useState(new Date().toISOString().slice(0, 10))
  const [attendanceRate, setAttendanceRate] = useState(100)

  const activeTeachers = useMemo(() => state.teachers.filter((t) => t.status === 'active'), [state.teachers])

  const filteredGroups = useMemo(() => {
    return state.groups.filter((g) => {
      if (g.status !== 'active') return false
      if (teacherFilter && g.teacherId !== teacherFilter) return false
      return true
    })
  }, [state.groups, teacherFilter])

  useEffect(() => {
    if (!groupId) return
    const g = state.groups.find((x) => x.id === groupId)
    if (!g || g.status !== 'active' || (teacherFilter && g.teacherId !== teacherFilter)) setGroupId('')
  }, [teacherFilter, groupId, state.groups])

  const save = () => {
    if (!name.trim() || !email.trim()) {
      enqueueSnackbar('Ad və e-poçt mütləqdir', { variant: 'warning' })
      return
    }
    if (!parentPhone.trim()) {
      enqueueSnackbar('Valideyn nömrəsi mütləqdir', { variant: 'warning' })
      return
    }
    const id = crypto.randomUUID()
    const fin = finalCourseAmount(coursePriceAzn, discountAzn)
    const installments = buildEqualInstallments(fin, months, firstDue, 'pending')
    const student: AdminStudent = {
      id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '—',
      parentPhone: parentPhone.trim(),
      registeredAt: new Date().toISOString().slice(0, 10),
      groupId: groupId || null,
      status,
      attendanceRate,
      coursePriceAzn,
      discountAzn,
      discountReasonCode,
      discountReason,
      discountAppliedAt: discountAppliedAt || null,
      paymentPlanMode: 'installments',
      installments,
      lessonLogs: [],
      gradeByGroupId: {},
      gradeHistoryByGroupId: {},
    }
    studentAdd(student)
    enqueueSnackbar('Tələbə yaradıldı', { variant: 'success' })
    navigate(`/admin/students/${id}`, { replace: true })
  }

  return (
    <Box>
      <AdminPageHeader
        title="Yeni tələbə"
        description="Əsas məlumat, aktiv müəllim və onun qrupu, ödəniş planı (avtomatik taksit)."
      />
      <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 720, borderColor: 'divider' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
            Şəxsi məlumat
          </Typography>
          <TextField label="Ad Soyad" required value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="E-poçt" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <TextField label="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
          <TextField label="Valideyn nömrəsi" required value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} fullWidth />
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
            Müəllim və qrup
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
            <FormControl fullWidth>
              <InputLabel>Müəllim (aktiv)</InputLabel>
              <Select
                label="Müəllim (aktiv)"
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(String(e.target.value))}
              >
                <MenuItem value="">— Hamısı (bütün aktiv qruplar)</MenuItem>
                {activeTeachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              component={RouterLink}
              to="/admin/teachers/new"
              variant="outlined"
              startIcon={<AddOutlinedIcon />}
              sx={{ textTransform: 'none', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              Yeni müəllim
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Müəllim seçsəniz, yalnız onun aktiv qrupları siyahıda görünür. Qrup seçəndə müəllim avtomatik uyğunlaşır.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Qrup</InputLabel>
            <Select
              label="Qrup"
              value={groupId}
              onChange={(e) => {
                const v = String(e.target.value)
                setGroupId(v)
                const g = state.groups.find((x) => x.id === v)
                if (g?.teacherId) setTeacherFilter(g.teacherId)
              }}
            >
              <MenuItem value="">— Qrupsuz</MenuItem>
              {filteredGroups.map((g) => {
                const t = state.teachers.find((x) => x.id === g.teacherId)
                return (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
                    {t ? ` · ${t.name}` : ''}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Vəziyyət</InputLabel>
            <Select label="Vəziyyət" value={status} onChange={(e) => setStatus(e.target.value as StudentStatus)}>
              <MenuItem value="active">Aktiv</MenuItem>
              <MenuItem value="suspended">Deaktiv</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Başlanğıc davamiyyət %"
            type="number"
            value={attendanceRate}
            onChange={(e) => setAttendanceRate(Number(e.target.value))}
            fullWidth
          />
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ mt: 1 }}>
            Ödəniş planı
          </Typography>
          <TextField label="Kurs qiyməti (AZN)" type="number" value={coursePriceAzn} onChange={(e) => setCoursePriceAzn(Number(e.target.value))} fullWidth />
          <TextField
            label="Endirim (AZN)"
            type="number"
            value={discountAzn}
            onChange={(e) => setDiscountAzn(clampDiscountAzn(e.target.value))}
            fullWidth
            inputProps={{ min: 0, step: 1 }}
          />
          <FormControl fullWidth>
            <InputLabel>Güzəşt səbəbi (növ)</InputLabel>
            <Select
              label="Güzəşt səbəbi (növ)"
              value={discountReasonCode}
              onChange={(e) => setDiscountReasonCode(e.target.value as DiscountReasonCode)}
            >
              <MenuItem value="early">Erkən qeydiyyat</MenuItem>
              <MenuItem value="scholarship">Təqaüd</MenuItem>
              <MenuItem value="campaign">Kampaniya</MenuItem>
              <MenuItem value="manual">Əl ilə (mətn)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Güzəşt tarixi (istəyə bağlı)"
            type="date"
            value={discountAppliedAt}
            onChange={(e) => setDiscountAppliedAt(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label={discountReasonCode === 'manual' ? 'Endirim səbəbi (mətn)' : 'Əlavə qeyd'}
            value={discountReason}
            onChange={(e) => setDiscountReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <Typography variant="body2">
            Yekun: <b>{finalCourseAmount(coursePriceAzn, discountAzn)} AZN</b>
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField label="Taksit sayı (ay)" type="number" value={months} onChange={(e) => setMonths(Number(e.target.value))} fullWidth />
            <TextField label="1-ci ödəniş tarixi" type="date" value={firstDue} onChange={(e) => setFirstDue(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={save} sx={{ textTransform: 'none', fontWeight: 800 }}>
              Saxla və detala keç
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
