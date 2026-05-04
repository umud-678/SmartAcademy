import type { AdminGroup, AdminState, AdminStudent, LessonLogRow } from '@/types/admin'
import { courseById, groupById } from '@/lib/adminSelectors'

export function attendanceRateFromLessonLogs(logs: LessonLogRow[]): number {
  if (!logs.length) return 100
  const good = logs.filter((l) => l.status === 'present' || l.status === 'late' || l.status === 'excused').length
  return Math.min(100, Math.max(0, Math.round((good / logs.length) * 100)))
}

/** Giriş e-poçtuna görə admin siyahısındakı müəllimin identifikatoru */
export function resolveTeacherIdByEmail(state: AdminState, email: string): string | null {
  const e = email.trim().toLowerCase()
  return state.teachers.find((t) => t.email.toLowerCase() === e)?.id ?? null
}

export function teacherActiveGroups(state: AdminState, teacherId: string): AdminGroup[] {
  return state.groups.filter((g) => g.teacherId === teacherId && g.status === 'active')
}

export function teacherStudentIds(state: AdminState, teacherId: string): string[] {
  const set = new Set<string>()
  for (const g of teacherActiveGroups(state, teacherId)) {
    for (const sid of g.studentIds) set.add(sid)
  }
  return [...set]
}

export function studentsInGroup(state: AdminState, groupId: string): AdminStudent[] {
  const g = state.groups.find((x) => x.id === groupId)
  if (!g) return []
  return g.studentIds
    .map((id) => state.students.find((s) => s.id === id))
    .filter((s): s is AdminStudent => Boolean(s))
}

export function groupBelongsToTeacher(state: AdminState, groupId: string, teacherId: string): boolean {
  const g = groupById(state, groupId)
  return Boolean(g && g.teacherId === teacherId)
}

export function studentPrimaryGroupName(state: AdminState, student: AdminStudent): string {
  return groupById(state, student.groupId)?.name ?? '—'
}

export function courseNameForGroup(state: AdminState, groupId: string): string {
  const g = groupById(state, groupId)
  if (!g) return '—'
  return courseById(state, g.courseId)?.name ?? '—'
}

/** Müəllimin aktiv qruplarındakı tələbələr (qrup konteksti ilə) */
export function teacherAssignedStudentRows(
  state: AdminState,
  teacherId: string,
): { student: AdminStudent; groupId: string; groupName: string }[] {
  const rows: { student: AdminStudent; groupId: string; groupName: string }[] = []
  for (const g of teacherActiveGroups(state, teacherId)) {
    for (const student of studentsInGroup(state, g.id)) {
      rows.push({ student, groupId: g.id, groupName: g.name })
    }
  }
  rows.sort((a, b) => a.student.name.localeCompare(b.student.name, 'az'))
  return rows
}

/** Bu gün (ref) həmin müəllimin qruplarında dərs olan xətlər */
export function teacherTodayLines(state: AdminState, teacherId: string, ref = new Date()): string[] {
  const dow = ref.getDay()
  const lines: string[] = []
  for (const g of teacherActiveGroups(state, teacherId)) {
    for (const slot of g.schedule) {
      if (!slot.days.includes(dow)) continue
      lines.push(`${g.name} — ${slot.start}–${slot.end} (${slot.room})`)
    }
  }
  return lines
}
