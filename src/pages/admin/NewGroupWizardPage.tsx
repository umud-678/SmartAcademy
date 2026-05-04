import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { enqueueSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { clampGroupMaxStudents, GROUP_MAX_STUDENTS_MAX, GROUP_MAX_STUDENTS_MIN } from '@/constants/groupCapacity'
import { useAdminData } from '@/contexts/AdminDataContext'
import { WEEKDAY_SHORT_AZ } from '@/lib/adminSelectors'
import type { AdminGroup, AdminStudent, ScheduleSlot } from '@/types/admin'
import { buildEqualInstallments, finalCourseAmount } from '@/utils/installments'

const steps = ['Əsas məlumatlar', 'Dərs saatları', 'Tələbə əlavə et']

type ManualRow = { tempId: string; name: string; email: string; phone: string; parentPhone: string }

function newSlot(): ScheduleSlot {
  return { id: crypto.randomUUID(), days: [], start: '18:00', end: '20:00', room: 'Online' }
}

export function NewGroupWizardPage() {
  const { state, groupAdd, studentAdd } = useAdminData()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [courseId, setCourseId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [maxStudents, setMaxStudents] = useState(16)
  const [slots, setSlots] = useState<ScheduleSlot[]>([newSlot()])
  const [manualRows, setManualRows] = useState<ManualRow[]>([])
  const [draftName, setDraftName] = useState('')
  const [draftEmail, setDraftEmail] = useState('')
  const [draftPhone, setDraftPhone] = useState('')
  const [draftParentPhone, setDraftParentPhone] = useState('')

  const effectiveMax = clampGroupMaxStudents(maxStudents)

  const selectedTotal = manualRows.length
  const capacityLeft = Math.max(0, effectiveMax - selectedTotal)

  const addManualRow = () => {
    const n = draftName.trim()
    if (!n) {
      enqueueSnackbar('Ad Soyad daxil edin', { variant: 'warning' })
      return
    }
    const pp = draftParentPhone.trim()
    if (!pp) {
      enqueueSnackbar('Valideyn nömrəsi daxil edin', { variant: 'warning' })
      return
    }
    setManualRows((m) => {
      if (m.length >= effectiveMax) {
        enqueueSnackbar('Maksimum tələbə sayına çatıldı', { variant: 'warning' })
        return m
      }
      const em = draftEmail.trim()
      if (em && state.students.some((st) => st.email.toLowerCase() === em.toLowerCase())) {
        enqueueSnackbar('Bu e-poçt artıq mövcud tələbədə var', { variant: 'warning' })
        return m
      }
      if (em && m.some((r) => (r.email?.trim() ?? '').toLowerCase() === em.toLowerCase())) {
        enqueueSnackbar('Bu e-poçt artıq siyahıdadır', { variant: 'warning' })
        return m
      }
      return [...m, { tempId: crypto.randomUUID(), name: n, email: draftEmail.trim(), phone: draftPhone.trim(), parentPhone: pp }]
    })
    setDraftName('')
    setDraftEmail('')
    setDraftPhone('')
    setDraftParentPhone('')
  }

  const toggleDay = (slotId: string, day: number) => {
    setSlots((rows) =>
      rows.map((s) =>
        s.id === slotId ? { ...s, days: s.days.includes(day) ? s.days.filter((d) => d !== day) : [...s.days, day].sort((a, b) => a - b) } : s,
      ),
    )
  }

  const finish = () => {
    if (!name.trim() || !courseId || !teacherId) {
      enqueueSnackbar('Qrup adı, kurs və müəllim seçin', { variant: 'warning' })
      return
    }
    const badSlot = slots.some((s) => s.days.length === 0)
    if (badSlot) {
      enqueueSnackbar('Hər cədvəl sətri üçün ən azı bir həftə günü seçin', { variant: 'warning' })
      return
    }
    const cap = clampGroupMaxStudents(maxStudents)
    if (cap !== maxStudents) setMaxStudents(cap)

    const id = crypto.randomUUID()
    const group: AdminGroup = {
      id,
      name: name.trim(),
      courseId,
      teacherId,
      maxStudents: cap,
      studentIds: [],
      status: 'active',
      schedule: slots,
    }
    groupAdd(group)
    const course = state.courses.find((c) => c.id === courseId)
    const priceAzn = course?.priceAzn ?? 0
    const fin = finalCourseAmount(priceAzn, 0)
    const firstDue = new Date().toISOString().slice(0, 10)
    const installments = buildEqualInstallments(fin, 5, firstDue, 'pending')
    for (const row of manualRows) {
      const sid = crypto.randomUUID()
      const email =
        row.email.trim() ||
        `yeniqeydiyyat.${sid.replace(/-/g, '').slice(0, 12)}@smartacademy.local`
      const student: AdminStudent = {
        id: sid,
        name: row.name.trim(),
        email,
        phone: row.phone.trim() || '—',
        parentPhone: row.parentPhone.trim(),
        registeredAt: new Date().toISOString().slice(0, 10),
        groupId: id,
        status: 'active',
        attendanceRate: 100,
        coursePriceAzn: priceAzn,
        discountAzn: 0,
        discountReasonCode: 'manual',
        discountReason: '',
        discountAppliedAt: null,
        paymentPlanMode: 'installments',
        installments,
        lessonLogs: [],
        gradeByGroupId: {},
        gradeHistoryByGroupId: {},
      }
      studentAdd(student)
    }
    enqueueSnackbar('Qrup yaradıldı', { variant: 'success' })
    navigate(`/admin/groups/${id}`, { replace: true })
  }

  const step0Complete = useMemo(() => {
    const maxOk =
      Number.isFinite(maxStudents) &&
      maxStudents >= GROUP_MAX_STUDENTS_MIN &&
      maxStudents <= GROUP_MAX_STUDENTS_MAX
    const courseOk = Boolean(courseId && state.courses.some((c) => c.id === courseId && !c.disabled))
    const teacherOk = Boolean(teacherId && state.teachers.some((t) => t.id === teacherId))
    return Boolean(name.trim() && courseOk && teacherOk && maxOk)
  }, [name, courseId, teacherId, maxStudents, state.courses, state.teachers])

  const step1Complete = useMemo(
    () =>
      slots.length > 0 &&
      slots.every(
        (s) => s.days.length > 0 && Boolean(s.start?.trim()) && Boolean(s.end?.trim()) && Boolean(s.room?.trim()),
      ),
    [slots],
  )

  const nextDisabled = step === 0 ? !step0Complete : step === 1 ? !step1Complete : false

  const nextTooltip =
    step === 0 && !step0Complete
      ? 'Qrup adı, kurs, müəllim seçin və max tələbəni 6–32 arasında daxil edin.'
      : step === 1 && !step1Complete
        ? 'Hər cədvəl üçün ən azı bir həftə günü, başlama/bitmə saatı və otaq daxil edin.'
        : ''

  return (
    <Box>
      <AdminPageHeader
        title="Yeni qrup"
        description={`3 addım: əsas məlumat → dərs saatları → tələbələr (yalnız əl ilə). Qrup limiti: ${GROUP_MAX_STUDENTS_MIN}–${GROUP_MAX_STUDENTS_MAX} tələbə.`}
      />
      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', mb: 2 }}>
        <CardContent>
          <Stepper activeStep={step} alternativeLabel>
            {steps.map((l) => (
              <Step key={l}>
                <StepLabel>{l}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 720 }}>
          {step === 0 ? (
            <>
              <TextField
                label="Qrup adı"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                error={!name.trim()}
                helperText={!name.trim() ? 'Qrup adı mütləqdir' : undefined}
              />
              <FormControl fullWidth required error={!courseId || !state.courses.some((c) => c.id === courseId && !c.disabled)}>
                <InputLabel>Kurs</InputLabel>
                <Select label="Kurs" value={courseId} onChange={(e) => setCourseId(String(e.target.value))}>
                  <MenuItem value="" disabled>
                    <em>Kurs seçin</em>
                  </MenuItem>
                  {state.courses.map((c) => (
                    <MenuItem key={c.id} value={c.id} disabled={c.disabled}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required error={!teacherId || !state.teachers.some((t) => t.id === teacherId)}>
                <InputLabel>Müəllim</InputLabel>
                <Select label="Müəllim" value={teacherId} onChange={(e) => setTeacherId(String(e.target.value))}>
                  <MenuItem value="" disabled>
                    <em>Müəllim seçin</em>
                  </MenuItem>
                  {state.teachers.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Max tələbə sayı"
                type="number"
                required
                value={Number.isFinite(maxStudents) ? maxStudents : ''}
                onChange={(e) => {
                  const v = e.target.value
                  setMaxStudents(v === '' ? Number.NaN : Number(v))
                }}
                onBlur={() => setMaxStudents((v) => (Number.isFinite(v) ? clampGroupMaxStudents(v) : GROUP_MAX_STUDENTS_MIN))}
                fullWidth
                inputProps={{ min: GROUP_MAX_STUDENTS_MIN, max: GROUP_MAX_STUDENTS_MAX }}
                error={!Number.isFinite(maxStudents) || maxStudents < GROUP_MAX_STUDENTS_MIN || maxStudents > GROUP_MAX_STUDENTS_MAX}
                helperText={
                  !Number.isFinite(maxStudents) || maxStudents < GROUP_MAX_STUDENTS_MIN || maxStudents > GROUP_MAX_STUDENTS_MAX
                    ? `${GROUP_MAX_STUDENTS_MIN}–${GROUP_MAX_STUDENTS_MAX} arası tam ədəd daxil edin`
                    : `İcazə: ${GROUP_MAX_STUDENTS_MIN}–${GROUP_MAX_STUDENTS_MAX} (məsələn, 16, 24, 32)`
                }
              />
            </>
          ) : null}

          {step === 1 ? (
            <Stack spacing={2}>
              {!step1Complete ? (
                <Typography variant="body2" color="warning.main" fontWeight={700}>
                  Növbəti addıma keçmək üçün hər cədvəl sətri üçün həftə günləri, vaxt və otaq tam doldurulmalıdır.
                </Typography>
              ) : null}
              {slots.map((slot) => (
                <Card key={slot.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                    Həftə günləri
                  </Typography>
                  <FormGroup row sx={{ flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {WEEKDAY_SHORT_AZ.map((label, day) => (
                      <FormControlLabel
                        key={day}
                        control={<Checkbox checked={slot.days.includes(day)} onChange={() => toggleDay(slot.id, day)} />}
                        label={label}
                      />
                    ))}
                  </FormGroup>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      label="Başlama"
                      type="time"
                      value={slot.start}
                      onChange={(e) => setSlots((rows) => rows.map((s) => (s.id === slot.id ? { ...s, start: e.target.value } : s)))}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <TextField
                      label="Bitmə"
                      type="time"
                      value={slot.end}
                      onChange={(e) => setSlots((rows) => rows.map((s) => (s.id === slot.id ? { ...s, end: e.target.value } : s)))}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <TextField
                      label="Otaq"
                      value={slot.room}
                      onChange={(e) => setSlots((rows) => rows.map((s) => (s.id === slot.id ? { ...s, room: e.target.value } : s)))}
                      fullWidth
                    />
                  </Stack>
                </Card>
              ))}
              <Button variant="outlined" onClick={() => setSlots((s) => [...s, newSlot()])} sx={{ alignSelf: 'flex-start', textTransform: 'none' }}>
                + Əlavə cədvəl sətiri
              </Button>
            </Stack>
          ) : null}

          {step === 2 ? (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Siyahıda: <b>{selectedTotal}</b> / {effectiveMax} (boş yer: {capacityLeft})
              </Typography>

              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                  Tələbələr (əl ilə)
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                  Bütün tələbələri buradan əlavə edin: ad mütləqdir; e-poçt boşdursa avtomatik ünvan verilir. &quot;Qrupu yarat&quot; düyməsi həm qrupu, həm də siyahıdakı tələbələri yaradır.
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    label="Ad Soyad"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    fullWidth
                    required
                    size="small"
                  />
                  <TextField
                    label="E-poçt (istəyə bağlı)"
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    fullWidth
                    size="small"
                    type="email"
                  />
                  <TextField
                    label="Telefon (istəyə bağlı)"
                    value={draftPhone}
                    onChange={(e) => setDraftPhone(e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Valideyn nömrəsi"
                    value={draftParentPhone}
                    onChange={(e) => setDraftParentPhone(e.target.value)}
                    fullWidth
                    required
                    size="small"
                  />
                  <Button variant="outlined" onClick={addManualRow} disabled={capacityLeft === 0} sx={{ alignSelf: 'flex-start', textTransform: 'none' }}>
                    Siyahıya əlavə et
                  </Button>
                </Stack>
                {manualRows.length > 0 ? (
                  <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                    {manualRows.map((r) => (
                      <Stack key={r.tempId} direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          <b>{r.name}</b>
                          {r.email ? ` · ${r.email}` : ' · (avtomatik e-poçt)'}
                          {r.phone ? ` · ${r.phone}` : ''}
                          {` · valideyn: ${r.parentPhone}`}
                        </Typography>
                        <IconButton
                          size="small"
                          aria-label="Sil"
                          onClick={() => setManualRows((m) => m.filter((x) => x.tempId !== r.tempId))}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                ) : null}
              </Box>
            </Stack>
          ) : null}

          <Stack direction="row" spacing={1} sx={{ pt: 2 }}>
            <Button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} sx={{ textTransform: 'none' }}>
              Geri
            </Button>
            {step < 2 ? (
              nextDisabled ? (
                <Tooltip title={nextTooltip} placement="top" arrow>
                  <span>
                    <Button variant="contained" disabled sx={{ textTransform: 'none', fontWeight: 800 }}>
                      Növbəti
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => {
                    if (step === 0) {
                      const c = clampGroupMaxStudents(Number.isFinite(maxStudents) ? maxStudents : GROUP_MAX_STUDENTS_MIN)
                      setMaxStudents(c)
                      setManualRows((m) => (m.length > c ? m.slice(0, c) : m))
                    }
                    if (step === 1) {
                      setManualRows((m) => (m.length > effectiveMax ? m.slice(0, effectiveMax) : m))
                    }
                    setStep((s) => s + 1)
                  }}
                  sx={{ textTransform: 'none', fontWeight: 800 }}
                >
                  Növbəti
                </Button>
              )
            ) : (
              <Button variant="contained" onClick={finish} sx={{ textTransform: 'none', fontWeight: 800 }}>
                Qrupu yarat
              </Button>
            )}
            <Button onClick={() => navigate('/admin/groups')} sx={{ textTransform: 'none' }}>
              Ləğv
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
