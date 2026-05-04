import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns'
import type { AdminStudent, InstallmentRow, PaymentMethod, PaymentStatus } from '@/types/admin'

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Güzəşt məbləği mənfi ola bilməz. */
export function clampDiscountAzn(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, round2(n))
}

export function finalCourseAmount(coursePriceAzn: number, discountAzn: number): number {
  const d = clampDiscountAzn(discountAzn)
  return Math.max(0, round2(coursePriceAzn - d))
}

/** Bərabər bölünmüş taksitlər (son ay qalıq düzəlişi ilə). */
export function buildEqualInstallments(
  totalAzn: number,
  count: number,
  firstDueIso: string,
  defaultStatus: PaymentStatus = 'pending',
): InstallmentRow[] {
  if (count < 1 || totalAzn <= 0) return []
  const base = Math.floor((totalAzn * 100) / count) / 100
  const rows: InstallmentRow[] = []
  let acc = 0
  const start = new Date(firstDueIso + 'T12:00:00')
  for (let i = 0; i < count; i++) {
    const d = new Date(start)
    d.setMonth(d.getMonth() + i)
    const due = d.toISOString().slice(0, 10)
    const isLast = i === count - 1
    const amount = isLast ? round2(totalAzn - acc) : base
    acc += amount
    rows.push({
      id: crypto.randomUUID(),
      monthLabel: `${i + 1}. ay`,
      amount,
      dueDate: due,
      status: defaultStatus,
    })
  }
  return rows
}

/** Ödənilməmiş sətirlərin məbləğini yekun məbləğə uyğun yenidən böl (ödəniliblər toxunulmaz). */
export function redistributePendingAmounts(student: AdminStudent): InstallmentRow[] {
  const net = finalCourseAmount(student.coursePriceAzn, student.discountAzn)
  const rows = student.installments.map((r) => ({ ...r }))
  const paid = rows.filter((r) => r.status === 'paid')
  const unpaid = rows.filter((r) => r.status !== 'paid')
  const paidSum = paid.reduce((a, r) => a + r.amount, 0)
  let remaining = round2(net - paidSum)
  if (remaining < 0) remaining = 0
  if (unpaid.length === 0) return rows
  const base = Math.floor((remaining * 100) / unpaid.length) / 100
  let acc = 0
  for (let i = 0; i < unpaid.length; i++) {
    const row = unpaid[i]
    const isLast = i === unpaid.length - 1
    const amt = isLast ? round2(remaining - acc) : base
    acc += amt
    const idx = rows.findIndex((x) => x.id === row.id)
    if (idx >= 0) rows[idx] = { ...rows[idx], amount: amt }
  }
  return rows
}

/** Ödənilmiş hissələri saxlayaraq qalan məbləği yeni taksitlərə bölür. */
export function regenerateInstallmentsKeepPaid(student: AdminStudent, totalMonths: number, firstPendingDue: string): InstallmentRow[] {
  const net = finalCourseAmount(student.coursePriceAzn, student.discountAzn)
  const paid = student.installments
    .filter((i) => i.status === 'paid')
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const paidSum = paid.reduce((a, r) => a + r.amount, 0)
  let remaining = round2(net - paidSum)
  if (remaining < 0) remaining = 0
  if (totalMonths < paid.length) {
    return student.installments
  }
  const nPending = totalMonths - paid.length
  if (nPending <= 0) {
    if (remaining <= 0) return paid
    const last = paid[paid.length - 1]
    if (!last) return buildEqualInstallments(net, 1, firstPendingDue, 'pending')
    return [
      ...paid.slice(0, -1),
      { ...last, amount: round2(last.amount + remaining) },
    ]
  }
  const pendingRows = buildEqualInstallments(remaining, nPending, firstPendingDue, 'pending')
  return [...paid, ...pendingRows]
}

export function sumInstallmentAmounts(rows: InstallmentRow[]): number {
  return round2(rows.reduce((a, r) => a + r.amount, 0))
}

export function studentWithInstallmentPatch(
  student: AdminStudent,
  installmentId: string,
  patch: Partial<InstallmentRow>,
): AdminStudent {
  return {
    ...student,
    installments: student.installments.map((i) => (i.id === installmentId ? { ...i, ...patch } : i)),
  }
}

export function installmentsMatchNet(student: AdminStudent, epsilon = 0.02): boolean {
  const net = finalCourseAmount(student.coursePriceAzn, student.discountAzn)
  return Math.abs(sumInstallmentAmounts(student.installments) - net) <= epsilon
}

/** UI: tarix keçibsə gecikmiş kimi göstər (ödənilib deyilərsə toxunma). */
export function installmentDisplayStatus(row: InstallmentRow, today = new Date()): PaymentStatus {
  if (row.status === 'paid') return 'paid'
  const due = parseISO(row.dueDate)
  const t0 = startOfDay(today)
  if (startOfDay(due) < t0) return 'overdue'
  return row.status === 'overdue' ? 'overdue' : 'pending'
}

export type DueUrgency = 'paid' | 'overdue' | 'soon' | 'upcoming'

export function installmentDueUrgency(row: InstallmentRow, today = new Date()): DueUrgency {
  if (row.status === 'paid') return 'paid'
  const days = differenceInCalendarDays(startOfDay(parseISO(row.dueDate)), startOfDay(today))
  if (days < 0) return 'overdue'
  if (days <= 5) return 'soon'
  return 'upcoming'
}

export function markInstallmentPaidFields(
  row: InstallmentRow,
  method: PaymentMethod,
  receiptRef: string,
  paidAtIso?: string,
): InstallmentRow {
  const paidAt = paidAtIso ?? new Date().toISOString().slice(0, 10)
  return {
    ...row,
    status: 'paid',
    paidAt,
    paymentMethod: method,
    receiptRef: receiptRef.trim() || undefined,
  }
}
