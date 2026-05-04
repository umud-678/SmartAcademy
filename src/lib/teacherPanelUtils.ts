import type { AdminGroup, AdminState } from '@/types/admin'
import { groupById } from '@/lib/adminSelectors'
import { resolveTeacherIdByEmail, teacherActiveGroups, teacherStudentIds } from '@/lib/teacherScope'

export const TEACHER_GROUP_COLORS = ['#6366f1', '#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#eab308']

export function localDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}

export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function minutesNow(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

export function shortWeekdayAz(dow: number): string {
  const map = ['B.', 'B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş']
  return map[dow] ?? '?'
}

const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DOW_LABEL: Record<number, string> = { 0: 'B.', 1: 'B.e', 2: 'Ç.a', 3: 'Ç', 4: 'C.a', 5: 'C', 6: 'Ş' }

export function formatDaysAbbrev(days: number[]): string {
  return [...days]
    .sort((a, b) => DOW_ORDER.indexOf(a) - DOW_ORDER.indexOf(b))
    .map((d) => DOW_LABEL[d] ?? String(d))
    .join(', ')
}

export function formatGroupScheduleSlots(g: AdminGroup): string {
  if (!g.schedule.length) return '—'
  return g.schedule.map((s) => `${formatDaysAbbrev(s.days)} ${s.start}–${s.end} · ${s.room}`).join(' · ')
}

export function logsExistForGroupOnDate(state: AdminState, groupId: string, dateKey: string): boolean {
  const g = groupById(state, groupId)
  if (!g) return false
  for (const sid of g.studentIds) {
    const s = state.students.find((x) => x.id === sid)
    if (!s) continue
    for (const log of s.lessonLogs) {
      if (log.date !== dateKey) continue
      if (log.groupId === groupId) return true
      if (log.lesson.includes(`(${groupId})`)) return true
    }
  }
  return false
}

export function lessonOverrideFor(g: AdminGroup, dateKey: string, slotId: string): 'cancelled' | 'postponed' | null {
  const o = (g.lessonDayOverrides ?? []).find((x) => x.date === dateKey && x.slotId === slotId)
  return o?.status ?? null
}

export type GroupWeekLessonRow = {
  dateKey: string
  dayShort: string
  slotId: string
  start: string
  end: string
  room: string
  uiStatus: 'cancelled' | 'postponed' | 'held' | 'no_log' | 'scheduled'
}

export function groupWeekLessonRows(
  state: AdminState,
  groupId: string,
  weekStartMonday: Date,
  todayKey: string,
): GroupWeekLessonRow[] {
  const g = groupById(state, groupId)
  if (!g) return []
  const rows: GroupWeekLessonRow[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStartMonday, i)
    const dateKey = localDateKey(d)
    const dow = d.getDay()
    for (const slot of g.schedule) {
      if (!slot.days.includes(dow)) continue
      const ovr = lessonOverrideFor(g, dateKey, slot.id)
      if (ovr === 'cancelled') {
        rows.push({
          dateKey,
          dayShort: shortWeekdayAz(dow),
          slotId: slot.id,
          start: slot.start,
          end: slot.end,
          room: slot.room,
          uiStatus: 'cancelled',
        })
        continue
      }
      if (ovr === 'postponed') {
        rows.push({
          dateKey,
          dayShort: shortWeekdayAz(dow),
          slotId: slot.id,
          start: slot.start,
          end: slot.end,
          room: slot.room,
          uiStatus: 'postponed',
        })
        continue
      }
      const held = logsExistForGroupOnDate(state, groupId, dateKey)
      if (held) {
        rows.push({
          dateKey,
          dayShort: shortWeekdayAz(dow),
          slotId: slot.id,
          start: slot.start,
          end: slot.end,
          room: slot.room,
          uiStatus: 'held',
        })
      } else if (dateKey < todayKey) {
        rows.push({
          dateKey,
          dayShort: shortWeekdayAz(dow),
          slotId: slot.id,
          start: slot.start,
          end: slot.end,
          room: slot.room,
          uiStatus: 'no_log',
        })
      } else {
        rows.push({
          dateKey,
          dayShort: shortWeekdayAz(dow),
          slotId: slot.id,
          start: slot.start,
          end: slot.end,
          room: slot.room,
          uiStatus: 'scheduled',
        })
      }
    }
  }
  rows.sort((a, b) => (a.dateKey + a.start).localeCompare(b.dateKey + b.start))
  return rows
}

export type TodayClassRow = {
  groupId: string
  groupName: string
  start: string
  end: string
  room: string
  status: 'upcoming' | 'in_progress' | 'completed'
}

export function teacherTodayClassRows(state: AdminState, teacherId: string, now: Date = new Date()): TodayClassRow[] {
  const dow = now.getDay()
  const mn = minutesNow(now)
  const rows: TodayClassRow[] = []
  for (const g of teacherActiveGroups(state, teacherId)) {
    for (const slot of g.schedule) {
      if (!slot.days.includes(dow)) continue
      const startM = timeToMinutes(slot.start)
      const endM = timeToMinutes(slot.end)
      let status: TodayClassRow['status']
      if (mn < startM) status = 'upcoming'
      else if (mn >= startM && mn < endM) status = 'in_progress'
      else status = 'completed'
      rows.push({
        groupId: g.id,
        groupName: g.name,
        start: slot.start,
        end: slot.end,
        room: slot.room,
        status,
      })
    }
  }
  rows.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
  return rows
}

export function teacherWeekLessonCount(state: AdminState, teacherId: string, weekStartMonday: Date): number {
  let n = 0
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStartMonday, i)
    const dow = d.getDay()
    for (const g of teacherActiveGroups(state, teacherId)) {
      for (const slot of g.schedule) {
        if (slot.days.includes(dow)) n++
      }
    }
  }
  return n
}

export function teacherLastAttendanceDate(state: AdminState, teacherId: string): string | null {
  let max: string | null = null
  const ids = teacherStudentIds(state, teacherId)
  for (const id of ids) {
    const s = state.students.find((x) => x.id === id)
    if (!s) continue
    for (const log of s.lessonLogs) {
      if (!max || log.date > max) max = log.date
    }
  }
  return max
}

export function teacherStudentsAvgAttendance(state: AdminState, teacherId: string): number | null {
  const ids = teacherStudentIds(state, teacherId)
  if (!ids.length) return null
  let sum = 0
  let c = 0
  for (const id of ids) {
    const s = state.students.find((x) => x.id === id)
    if (!s) continue
    sum += s.attendanceRate
    c++
  }
  return c ? Math.round(sum / c) : null
}

export function teacherLowAttendanceStudents(state: AdminState, teacherId: string, threshold = 75) {
  const out: { studentId: string; name: string; rate: number; groupName: string }[] = []
  const idSet = new Set(teacherStudentIds(state, teacherId))
  for (const s of state.students) {
    if (!idSet.has(s.id)) continue
    if (s.status !== 'active') continue
    if (s.attendanceRate >= threshold) continue
    const gn = groupById(state, s.groupId ?? '')?.name ?? '—'
    out.push({ studentId: s.id, name: s.name, rate: s.attendanceRate, groupName: gn })
  }
  return out.sort((a, b) => a.rate - b.rate)
}

export function teacherRecentLateAbsent(state: AdminState, teacherId: string, withinDays = 14) {
  const cutoff = addDays(new Date(), -withinDays)
  const cutoffKey = localDateKey(cutoff)
  const idSet = new Set(teacherStudentIds(state, teacherId))
  const rows: { date: string; name: string; status: string; lesson: string }[] = []
  for (const s of state.students) {
    if (!idSet.has(s.id)) continue
    for (const log of s.lessonLogs) {
      if (log.date < cutoffKey) continue
      if (log.status === 'absent' || log.status === 'late') {
        rows.push({ date: log.date, name: s.name, status: log.status, lesson: log.lesson })
      }
    }
  }
  rows.sort((a, b) => (b.date + b.lesson).localeCompare(a.date + a.lesson))
  return rows.slice(0, 15)
}

export type TeacherScheduleCell = {
  id: string
  dateKey: string
  dow: number
  groupId: string
  groupName: string
  courseName: string
  start: string
  end: string
  room: string
  colorHex: string
}

export function teacherWeekScheduleCells(state: AdminState, teacherId: string, weekStartMonday: Date): TeacherScheduleCell[] {
  const groups = teacherActiveGroups(state, teacherId)
  const cells: TeacherScheduleCell[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStartMonday, i)
    const dateKey = localDateKey(d)
    const dow = d.getDay()
    groups.forEach((g, gi) => {
      const colorHex = TEACHER_GROUP_COLORS[gi % TEACHER_GROUP_COLORS.length]
      const courseName = state.courses.find((c) => c.id === g.courseId)?.name ?? '—'
      for (const slot of g.schedule) {
        if (!slot.days.includes(dow)) continue
        if (lessonOverrideFor(g, dateKey, slot.id) === 'cancelled') continue
        cells.push({
          id: `${g.id}-${slot.id}-${dateKey}`,
          dateKey,
          dow,
          groupId: g.id,
          groupName: g.name,
          courseName,
          start: slot.start,
          end: slot.end,
          room: slot.room,
          colorHex,
        })
      }
    })
  }
  cells.sort((a, b) => (a.dateKey + a.start).localeCompare(b.dateKey + b.start))
  return cells
}

export function teacherMenuAlertLines(state: AdminState, email: string | undefined): { id: string; text: string }[] {
  if (!email) return []
  const tid = resolveTeacherIdByEmail(state, email)
  if (!tid)
    return [{ id: 'no-match', text: 'Giriş e-poçtu siyahıdakı müəllimlə uyğun gəlmir (nümunə üçün: seed müəllim e-poçtu).' }]
  const lines: { id: string; text: string }[] = []
  for (const x of teacherLowAttendanceStudents(state, tid, 80).slice(0, 4)) {
    lines.push({ id: `low-${x.studentId}`, text: `${x.name}: davamiyyət ${x.rate}% (${x.groupName})` })
  }
  const today = teacherTodayClassRows(state, tid)
  if (today.length) {
    lines.push({ id: 'today', text: `Bu gün cədvəldə ${today.length} dərs slotu var.` })
  }
  const pending = teacherLastAttendanceDate(state, tid)
  if (pending) {
    lines.push({ id: 'last-att', text: `Son davamiyyət qeydi: ${pending}` })
  }
  return lines.slice(0, 10)
}
