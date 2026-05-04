/** Qrup yaradılarkən və redaktə edərkən icazə verilən tələbə sayı aralığı */
export const GROUP_MAX_STUDENTS_MIN = 6
export const GROUP_MAX_STUDENTS_MAX = 32

export function clampGroupMaxStudents(value: number): number {
  const n = Math.round(Number.isFinite(value) ? value : GROUP_MAX_STUDENTS_MIN)
  return Math.min(GROUP_MAX_STUDENTS_MAX, Math.max(GROUP_MAX_STUDENTS_MIN, n))
}

/** Hazırda qrupdakı tələbə sayı max-dan böyükdərsə, maxı ən azı bu həddə qaldırır (≤32). */
export function resolveGroupMaxStudents(currentMemberCount: number, requestedMax: number): number {
  const capped = clampGroupMaxStudents(requestedMax)
  const floorFromEnrollment = Math.min(currentMemberCount, GROUP_MAX_STUDENTS_MAX)
  return Math.max(capped, floorFromEnrollment)
}
