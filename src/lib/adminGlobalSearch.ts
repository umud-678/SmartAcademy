import type { AdminState } from '@/types/admin'

export type AdminSearchPick =
  | { kind: 'student'; id: string }
  | { kind: 'group'; id: string }
  | { kind: 'teacher'; id: string }
  | { kind: 'paymentsHub' }
  | null

/** Admin üst axtarış: Enter ilə birbaşa keçid (minimum 2 simvol). */
export function adminSearchPick(state: AdminState, qRaw: string): AdminSearchPick {
  const q = qRaw.trim().toLowerCase()
  if (q.length < 2) return null

  if (['ödəniş', 'odenis', 'payment', 'taksit', 'borc'].some((k) => q.includes(k))) {
    return { kind: 'paymentsHub' }
  }

  const stEmail = state.students.find((s) => s.email.trim().toLowerCase() === q)
  if (stEmail) return { kind: 'student', id: stEmail.id }

  const tEmail = state.teachers.find((t) => t.email.trim().toLowerCase() === q)
  if (tEmail) return { kind: 'teacher', id: tEmail.id }

  const groupExact = state.groups.find((g) => g.name.trim().toLowerCase() === q)
  if (groupExact) return { kind: 'group', id: groupExact.id }

  const stName = state.students.find((s) => s.name.toLowerCase().includes(q))
  if (stName) return { kind: 'student', id: stName.id }

  const groupName = state.groups.find((g) => g.name.toLowerCase().includes(q))
  if (groupName) return { kind: 'group', id: groupName.id }

  const teacherName = state.teachers.find((t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q))
  if (teacherName) return { kind: 'teacher', id: teacherName.id }

  return null
}
