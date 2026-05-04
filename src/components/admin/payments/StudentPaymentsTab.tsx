import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { alpha, useTheme } from '@mui/material/styles'
import { enqueueSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAdminData } from '@/contexts/AdminDataContext'
import { finalAmountStudent } from '@/lib/adminSelectors'
import type {
  AdminStudent,
  DiscountReasonCode,
  InstallmentRow,
  PaymentMethod,
  PaymentStatus,
  StudentPaymentPlanMode,
} from '@/types/admin'
import {
  clampDiscountAzn,
  finalCourseAmount,
  installmentDisplayStatus,
  installmentDueUrgency,
} from '@/utils/installments'

const REASON_LABELS: Record<DiscountReasonCode, string> = {
  early: 'Erkən qeydiyyat',
  scholarship: 'Təqaüd',
  campaign: 'Kampaniya',
  manual: 'Əl ilə (mətn)',
}

type Draft = {
  coursePriceAzn: number
  discountAzn: number
  discountReasonCode: DiscountReasonCode
  discountReason: string
  discountAppliedAt: string
}

function draftNet(d: Draft): number {
  return finalCourseAmount(d.coursePriceAzn, d.discountAzn)
}

function draftFromStudent(s: AdminStudent): Draft {
  return {
    coursePriceAzn: s.coursePriceAzn,
    discountAzn: clampDiscountAzn(s.discountAzn),
    discountReasonCode: s.discountReasonCode,
    discountReason: s.discountReason,
    discountAppliedAt: s.discountAppliedAt ?? '',
  }
}

function studentSyncKey(s: AdminStudent): string {
  return `${s.id}|${s.coursePriceAzn}|${s.discountAzn}|${s.discountReasonCode}|${s.discountReason}|${s.discountAppliedAt ?? ''}|${s.paymentPlanMode}|${s.installments.length}|${finalAmountStudent(s)}`
}

type InnerProps = { student: AdminStudent; studentId: string }

function StudentPaymentsTabInner({ student, studentId }: InnerProps) {
  const theme = useTheme()
  const {
    state,
    studentDiscountRecalc,
    regenerateInstallments,
    applyFullPaymentPlan,
    markInstallmentPaid,
    patchInstallment,
  } = useAdminData()

  const firstPending = student.installments.find((i) => i.status !== 'paid')
  const defaultFirstDue =
    firstPending?.dueDate ?? student.installments[0]?.dueDate ?? new Date().toISOString().slice(0, 10)

  const [draft, setDraft] = useState<Draft>(() => draftFromStudent(student))
  const [planChoice, setPlanChoice] = useState<StudentPaymentPlanMode>(student.paymentPlanMode)
  const [monthsInput, setMonthsInput] = useState(() => Math.max(1, student.installments.length || 1))
  const [firstDueInput, setFirstDueInput] = useState(() => defaultFirstDue)
  const [fullDueInput, setFullDueInput] = useState(
    () => student.installments[0]?.dueDate ?? new Date().toISOString().slice(0, 10),
  )

  const [confirmPricingOpen, setConfirmPricingOpen] = useState(false)
  const [confirmRegenOpen, setConfirmRegenOpen] = useState(false)
  const [confirmFullOpen, setConfirmFullOpen] = useState(false)

  const [markOpen, setMarkOpen] = useState(false)
  const [markRow, setMarkRow] = useState<InstallmentRow | null>(null)
  const [markMethod, setMarkMethod] = useState<PaymentMethod>('transfer')
  const [markReceipt, setMarkReceipt] = useState('')

  const netPreview = draftNet(draft)
  const netStored = finalAmountStudent(student)

  const pricingDirty = useMemo(() => {
    return (
      draft.coursePriceAzn !== student.coursePriceAzn ||
      draft.discountAzn !== student.discountAzn ||
      draft.discountReasonCode !== student.discountReasonCode ||
      draft.discountReason !== student.discountReason ||
      (draft.discountAppliedAt || '') !== (student.discountAppliedAt ?? '')
    )
  }, [student, draft])

  const auditForStudent = useMemo(
    () => (state.paymentAuditLog ?? []).filter((e) => e.studentId === studentId).slice(0, 30),
    [state.paymentAuditLog, studentId],
  )

  const gross = draft.coursePriceAzn
  const discount = draft.discountAzn
  const reasonDisplay =
    draft.discountReasonCode === 'manual' ? draft.discountReason || '—' : REASON_LABELS[draft.discountReasonCode]

  const applyPricing = () => {
    const reasonText = draft.discountReasonCode === 'manual' ? draft.discountReason : REASON_LABELS[draft.discountReasonCode]
    const auditSummary = `Qiymət/güzəşt yeniləndi: kurs ${draft.coursePriceAzn} ₼, güzəşt ${draft.discountAzn} ₼, yekun ${netPreview} ₼`
    const notify = `Güzəşt/qiymət: ${student.name} — yekun ${netPreview} ₼`
    studentDiscountRecalc(
      student.id,
      {
        coursePriceAzn: draft.coursePriceAzn,
        discountAzn: draft.discountAzn,
        discountReasonCode: draft.discountReasonCode,
        discountReason: reasonText,
        discountAppliedAt: draft.discountAppliedAt || null,
      },
      auditSummary,
      draft.discountAzn !== student.discountAzn || draft.coursePriceAzn !== student.coursePriceAzn ? notify : undefined,
    )
    enqueueSnackbar('Yeniləndi: qalan taksitlər avtomatik bölündü', { variant: 'success' })
    setConfirmPricingOpen(false)
  }

  const onRegenerate = () => {
    const paidN = student.installments.filter((i) => i.status === 'paid').length
    if (monthsInput < paidN) {
      enqueueSnackbar(`Ay sayı ən azı ödənilmiş taksit sayı qədər olmalıdır (${paidN}).`, { variant: 'warning' })
      setConfirmRegenOpen(false)
      return
    }
    regenerateInstallments(
      student.id,
      monthsInput,
      firstDueInput,
      `Taksit planı: ${monthsInput} ay, ilk tarix ${firstDueInput}`,
    )
    enqueueSnackbar('Ödəniş planı yeniləndi (ödənilmişlər saxlanıldı)', { variant: 'success' })
    setConfirmRegenOpen(false)
  }

  const onFullPlan = () => {
    applyFullPaymentPlan(student.id, fullDueInput, `Tam ödəniş planı — son tarix ${fullDueInput}`)
    enqueueSnackbar('Tam ödəniş planı tətbiq olundu', { variant: 'success' })
    setConfirmFullOpen(false)
  }

  const instCols: DataTableColumn<InstallmentRow>[] = [
    {
      id: 'monthLabel',
      label: 'Ay',
      render: (r) => {
        const u = installmentDueUrgency(r)
        const bc = u === 'paid' ? 'success.main' : u === 'overdue' ? 'error.main' : u === 'soon' ? 'warning.main' : 'divider'
        const bg =
          u === 'overdue'
            ? alpha(theme.palette.error.main, 0.07)
            : u === 'soon'
              ? alpha(theme.palette.warning.main, 0.1)
              : u === 'paid'
                ? alpha(theme.palette.success.main, 0.08)
                : 'transparent'
        return (
          <Box sx={{ borderLeft: '4px solid', borderColor: bc, pl: 1, py: 0.25, mx: -0.5, bgcolor: bg, borderRadius: 0.5 }}>
            {r.monthLabel}
          </Box>
        )
      },
    },
    {
      id: 'amount',
      label: 'Məbləğ (₼)',
      render: (r) => (
        <TextField
          size="small"
          type="number"
          defaultValue={r.amount}
          key={`${r.id}-${r.amount}`}
          disabled={r.status === 'paid'}
          onBlur={(e) => {
            const v = Number(e.target.value)
            if (!Number.isNaN(v)) patchInstallment(student.id, r.id, { amount: v })
          }}
          sx={{ width: 110 }}
        />
      ),
    },
    {
      id: 'dueDate',
      label: 'Son tarix',
      render: (r) => (
        <TextField
          size="small"
          type="date"
          defaultValue={r.dueDate}
          key={`${r.id}-${r.dueDate}`}
          disabled={r.status === 'paid'}
          InputLabelProps={{ shrink: true }}
          onBlur={(e) => patchInstallment(student.id, r.id, { dueDate: e.target.value })}
          sx={{ width: 150 }}
        />
      ),
    },
    {
      id: 'status',
      label: 'Vəziyyət',
      render: (r) => {
        const disp = installmentDisplayStatus(r)
        return (
          <Stack spacing={0.5}>
            <StatusBadge
              label={disp === 'paid' ? 'Ödənilib' : disp === 'overdue' ? 'Gecikib' : 'Gözləyir'}
              tone={disp === 'paid' ? 'success' : disp === 'overdue' ? 'error' : 'warning'}
            />
            {r.status !== 'paid' ? (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={r.status}
                  onChange={(e) => patchInstallment(student.id, r.id, { status: e.target.value as PaymentStatus })}
                >
                  <MenuItem value="pending">Gözləyir</MenuItem>
                  <MenuItem value="overdue">Gecikib</MenuItem>
                </Select>
              </FormControl>
            ) : null}
          </Stack>
        )
      },
    },
    {
      id: 'actions',
      label: 'Əməliyyat',
      render: (r) =>
        r.status !== 'paid' ? (
          <Button size="small" variant="outlined" onClick={() => { setMarkRow(r); setMarkOpen(true) }} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Ödənildi qeyd et
          </Button>
        ) : (
          <Typography variant="caption" color="text.secondary">
            {r.paymentMethod === 'cash' ? 'Nağd' : r.paymentMethod === 'transfer' ? 'Köçürmə' : r.paymentMethod === 'online' ? 'Onlayn' : '—'}
            {r.receiptRef ? ` · ${r.receiptRef}` : ''}
          </Typography>
        ),
    },
  ]

  return (
    <Stack spacing={3}>
      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, background: (t) => (t.palette.mode === 'dark' ? alpha(t.palette.primary.main, 0.12) : alpha(t.palette.primary.main, 0.08)) }}>
          <Typography variant="overline" fontWeight={800} color="primary">
            Ödəniş xülasəsi
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Kursun tam qiyməti
              </Typography>
              <Typography variant="h6" fontWeight={900}>
                {gross} AZN
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Güzəşt
              </Typography>
              <Typography variant="h6" fontWeight={900} color="error">
                −{discount} AZN
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Güzəşt səbəbi
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {reasonDisplay}
              </Typography>
              {draft.discountAppliedAt ? (
                <Typography variant="caption" color="text.secondary">
                  Tarix: {draft.discountAppliedAt}
                </Typography>
              ) : null}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Yekun ödəniş
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <CheckCircleOutlineIcon color="success" fontSize="small" />
                <Typography variant="h6" fontWeight={900} color="success.main">
                  {netPreview} AZN
                </Typography>
              </Stack>
              {netPreview !== netStored ? (
                <Typography variant="caption" color="warning.main">
                  Saxlanılmamış önizləmə
                </Typography>
              ) : null}
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
            Güzəşt və qiymət
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Kurs qiyməti (AZN)"
                type="number"
                fullWidth
                value={draft.coursePriceAzn}
                onChange={(e) => setDraft((d) => ({ ...d, coursePriceAzn: Number(e.target.value) }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Güzəşt məbləği (AZN)"
                type="number"
                fullWidth
                value={draft.discountAzn}
                onChange={(e) => setDraft((d) => ({ ...d, discountAzn: clampDiscountAzn(e.target.value) }))}
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Güzəşt səbəbi</InputLabel>
                <Select
                  label="Güzəşt səbəbi"
                  value={draft.discountReasonCode}
                  onChange={(e) => setDraft((d) => ({ ...d, discountReasonCode: e.target.value as DiscountReasonCode }))}
                >
                  <MenuItem value="early">Erkən qeydiyyat</MenuItem>
                  <MenuItem value="scholarship">Təqaüd</MenuItem>
                  <MenuItem value="campaign">Kampaniya</MenuItem>
                  <MenuItem value="manual">Əl ilə (mətn)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={draft.discountReasonCode === 'manual' ? 'Əl ilə səbəb' : 'Əlavə qeyd'}
                fullWidth
                multiline
                minRows={2}
                value={draft.discountReason}
                onChange={(e) => setDraft((d) => ({ ...d, discountReason: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Güzəşt tarixi (istəyə bağlı)"
                type="date"
                fullWidth
                value={draft.discountAppliedAt}
                onChange={(e) => setDraft((d) => ({ ...d, discountAppliedAt: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            sx={{ mt: 2, textTransform: 'none', fontWeight: 800 }}
            disabled={!pricingDirty || netPreview < 0 || draft.discountAzn > draft.coursePriceAzn}
            onClick={() => setConfirmPricingOpen(true)}
          >
            Qiymətləndirməni tətbiq et
          </Button>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
            Ödəniş forması
          </Typography>
          <FormControl>
            <RadioGroup row value={planChoice} onChange={(_, v) => setPlanChoice(v as StudentPaymentPlanMode)}>
              <FormControlLabel value="installments" control={<Radio />} label="Hissə-hissə (aylıq)" />
              <FormControlLabel value="full" control={<Radio />} label="Tam ödəniş" />
            </RadioGroup>
          </FormControl>

          {planChoice === 'full' ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }} alignItems={{ sm: 'center' }}>
              <TextField
                label="Son tarix"
                type="date"
                value={fullDueInput}
                onChange={(e) => setFullDueInput(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 200 }}
              />
              <Button variant="contained" onClick={() => setConfirmFullOpen(true)} sx={{ textTransform: 'none', fontWeight: 800 }}>
                Tam ödəniş planını tətbiq et
              </Button>
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <TextField
                  label="Ödəniş sayı (ümumi ay)"
                  type="number"
                  value={monthsInput}
                  onChange={(e) => setMonthsInput(Math.max(1, Number(e.target.value)))}
                  sx={{ width: 200 }}
                />
                <TextField
                  label="Növbəti taksitin tarixi"
                  type="date"
                  value={firstDueInput}
                  onChange={(e) => setFirstDueInput(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 200 }}
                />
                <Button variant="contained" onClick={() => setConfirmRegenOpen(true)} sx={{ textTransform: 'none', fontWeight: 800 }}>
                  Planı yenidən qur
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Ödənilmiş taksitlər saxlanılır; qalan məbləğ seçilmiş ay sayına bölünür.
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Box>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
          Taksit cədvəli
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Qırmızı: tarix keçib · Sarı: 5 günə qədər · Yaşıl: ödənilib. Cəm taksitlər yekun məbləğə bərabər olmalıdır.
        </Typography>
        <DataTable
          key={student.installments.map((i) => `${i.id}:${i.amount}:${i.status}`).join('|')}
          columns={instCols}
          rows={student.installments}
          getRowId={(r) => r.id}
        />
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
            Ödəniş tarixçəsi (audit)
          </Typography>
          {auditForStudent.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Hələ qeyd yoxdur.
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />} spacing={1}>
              {auditForStudent.map((e) => (
                <Box key={e.id}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(e.at).toLocaleString('az-AZ')}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {e.summary}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmPricingOpen}
        onClose={() => setConfirmPricingOpen(false)}
        onConfirm={applyPricing}
        title="Qiymət / güzəşt dəyişikliyi"
        description="Yekun məbləğ dəyişdi. Qalan (ödənilməmiş) taksitlər avtomatik yenidən bölünəcək. Ödənilmiş aylar toxunulmaz qalır. Davam edilsin?"
        confirmLabel="Bəli, yenidən böl"
      />

      <ConfirmDialog
        open={confirmRegenOpen}
        onClose={() => setConfirmRegenOpen(false)}
        onConfirm={onRegenerate}
        title="Taksit planının yenilənməsi"
        description="Ödəniş planı seçdiyiniz ay sayına uyğun yenilənəcək. Mövcud ödənilmiş taksitlər saxlanılacaq."
        confirmLabel="Yenilə"
      />

      <ConfirmDialog
        open={confirmFullOpen}
        onClose={() => setConfirmFullOpen(false)}
        onConfirm={onFullPlan}
        title="Tam ödəniş planı"
        description="Ödənilmiş taksitlər saxlanılır; qalıq məbləğ tək sətirdə göstəriləcək. Davam edirsiniz?"
        confirmLabel="Tətbiq et"
      />

      <Dialog open={markOpen} onClose={() => setMarkOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Ödənişi qeydə al</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {markRow ? `${markRow.monthLabel} · ${markRow.amount} ₼` : ''}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Ödəniş üsulu</InputLabel>
              <Select label="Ödəniş üsulu" value={markMethod} onChange={(e) => setMarkMethod(e.target.value as PaymentMethod)}>
                <MenuItem value="cash">Nağd</MenuItem>
                <MenuItem value="transfer">Köçürmə</MenuItem>
                <MenuItem value="online">Onlayn</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Qəbz / əməliyyat nömrəsi" value={markReceipt} onChange={(e) => setMarkReceipt(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMarkOpen(false)} color="inherit">
            Ləğv
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!markRow) return
              markInstallmentPaid(student.id, markRow.id, { method: markMethod, receiptRef: markReceipt })
              enqueueSnackbar('Ödəniş qeydə alındı', { variant: 'success' })
              setMarkOpen(false)
              setMarkRow(null)
              setMarkReceipt('')
            }}
            sx={{ textTransform: 'none', fontWeight: 800 }}
          >
            Təsdiq et
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export function StudentPaymentsTab({ studentId }: { studentId: string }) {
  const { state } = useAdminData()
  const student = state.students.find((s) => s.id === studentId)
  if (!student) return null
  return <StudentPaymentsTabInner key={studentSyncKey(student)} student={student} studentId={studentId} />
}
