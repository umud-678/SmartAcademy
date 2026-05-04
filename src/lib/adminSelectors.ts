import type { AdminGroup, AdminState, AdminStudent, PaymentStatus } from '@/types/admin'
import { finalCourseAmount, installmentDisplayStatus } from '@/utils/installments'

export function groupById(state: AdminState, id: string | null): AdminGroup | undefined {
  if (!id) return undefined
  return state.groups.find((g) => g.id === id)
}

export function courseById(state: AdminState, id: string) {
  return state.courses.find((c) => c.id === id)
}

export function teacherById(state: AdminState, id: string) {
  return state.teachers.find((t) => t.id === id)
}

export function groupLabel(state: AdminState, groupId: string | null): string {
  return groupById(state, groupId)?.name ?? '—'
}

export function studentDebt(s: AdminStudent): number {
  return s.installments.filter((i) => i.status !== 'paid').reduce((a, i) => a + i.amount, 0)
}

export function studentNextDue(s: AdminStudent): string {
  const pend = s.installments.filter((i) => i.status !== 'paid').sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  return pend?.dueDate ?? '—'
}

export type FlatPayment = {
  key: string
  studentId: string
  installmentId: string
  student: string
  group: string
  amount: number
  due: string
  /** Tarixə görə hesablanmış (UI / filtr) */
  status: PaymentStatus
  storedStatus: PaymentStatus
}

export function flattenInstallments(state: AdminState): FlatPayment[] {
  const rows: FlatPayment[] = []
  for (const s of state.students) {
    const gname = groupLabel(state, s.groupId)
    for (const ins of s.installments) {
      rows.push({
        key: `${s.id}_${ins.id}`,
        studentId: s.id,
        installmentId: ins.id,
        student: s.name,
        group: gname,
        amount: ins.amount,
        due: ins.dueDate,
        storedStatus: ins.status,
        status: installmentDisplayStatus(ins),
      })
    }
  }
  return rows
}

export function patchStudentInstallment(
  student: AdminStudent,
  installmentId: string,
  patch: Partial<{ amount: number; dueDate: string; status: PaymentStatus }>,
): AdminStudent {
  return {
    ...student,
    installments: student.installments.map((i) => (i.id === installmentId ? { ...i, ...patch } : i)),
  }
}

export function finalAmountStudent(s: AdminStudent): number {
  return finalCourseAmount(s.coursePriceAzn, s.discountAzn)
}

export function activeGroupsCount(state: AdminState): number {
  return state.groups.filter((g) => g.status === 'active').length
}

/** JS `Date.getDay()` ilə uyğun: 0=Bazar … 6=Şənbə */
export const WEEKDAY_SHORT_AZ = ['B.', 'B.e', 'Ç.a', 'Ç.', 'C.a', 'C.', 'Ş.']

export type TodayGroupRow = {
  groupId: string
  groupName: string
  courseName: string
  teacherName: string
  time: string
  room: string
}

export function groupsWithClassesToday(state: AdminState, ref: Date = new Date()): TodayGroupRow[] {
  const dow = ref.getDay()
  const rows: TodayGroupRow[] = []
  for (const g of state.groups) {
    if (g.status !== 'active') continue
    const course = courseById(state, g.courseId)
    const teacher = teacherById(state, g.teacherId)
    for (const slot of g.schedule) {
      if (!slot.days.includes(dow)) continue
      rows.push({
        groupId: g.id,
        groupName: g.name,
        courseName: course?.name ?? '—',
        teacherName: teacher?.name ?? '—',
        time: `${slot.start}–${slot.end}`,
        room: slot.room,
      })
    }
  }
  return rows
}

export function revenueByMonth(state: AdminState, monthsBack = 6): { key: string; label: string; total: number }[] {
  const flat = flattenInstallments(state).filter((r) => r.storedStatus === 'paid')
  const now = new Date()
  const buckets: { key: string; label: string; total: number }[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`
    const total = flat.filter((r) => r.due.startsWith(key)).reduce((a, r) => a + r.amount, 0)
    buckets.push({ key, label, total })
  }
  return buckets
}

/** Ödənilmiş məbləğlər üzrə güzəştli / güzəştsiz tələbə payı (yığılmış). */
export function revenueDiscountSplit(state: AdminState): { name: string; value: number }[] {
  let withDiscount = 0
  let without = 0
  for (const s of state.students) {
    const paidSum = s.installments.filter((i) => i.status === 'paid').reduce((a, i) => a + i.amount, 0)
    if (s.discountAzn > 0) withDiscount += paidSum
    else without += paidSum
  }
  return [
    { name: 'Güzəştli tələbələr', value: Math.round(withDiscount * 100) / 100 },
    { name: 'Güzəştsiz', value: Math.round(without * 100) / 100 },
  ]
}

export function studentsWithDiscountCount(state: AdminState): number {
  return state.students.filter((s) => s.discountAzn > 0).length
}

export function studentsPerCourse(state: AdminState): { name: string; value: number }[] {
  const map = new Map<string, number>()
  for (const s of state.students) {
    const g = groupById(state, s.groupId)
    const cid = g?.courseId
    if (!cid) continue
    const c = courseById(state, cid)
    const name = c?.name ?? cid
    map.set(name, (map.get(name) ?? 0) + 1)
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }))
}

export function groupOccupancyBars(state: AdminState): { name: string; fill: number; count: number; max: number }[] {
  return state.groups
    .filter((g) => g.status === 'active')
    .map((g) => ({
      name: g.name,
      fill: g.maxStudents > 0 ? Math.round((g.studentIds.length / g.maxStudents) * 100) : 0,
      count: g.studentIds.length,
      max: g.maxStudents,
    }))
}
