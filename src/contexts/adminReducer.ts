import { clampGroupMaxStudents, resolveGroupMaxStudents } from '@/constants/groupCapacity'
import { seedAdminState } from '@/data/adminSeed'
import { AUTH_DEMO_PASSWORD_HASH_HEX } from '@/lib/authCredentials'
import type {
  AdminAppUser,
  AdminCourse,
  AdminGroup,
  AdminState,
  AdminStudent,
  AdminTeacher,
  GradeHistoryEntry,
  InstallmentRow,
  LessonDayOverride,
  LessonLogRow,
  PaymentAuditEntry,
  PaymentMethod,
} from '@/types/admin'
import { attendanceRateFromLessonLogs } from '@/lib/teacherScope'
import {
  clampDiscountAzn,
  finalCourseAmount,
  markInstallmentPaidFields,
  redistributePendingAmounts,
  regenerateInstallmentsKeepPaid,
  round2,
} from '@/utils/installments'

export const ADMIN_STORAGE_KEY = 'sa_admin_store_v2'
export const ADMIN_STORAGE_VERSION = 5

const MAX_AUDIT = 250
const MAX_NOTIF = 120

function normalizeAppUsersLoaded(users: AdminAppUser[]): AdminAppUser[] {
  return users.map((u) => ({
    id: u.id,
    role: u.role,
    email: typeof u.email === 'string' ? u.email : '',
    active: u.active ?? true,
    passwordHash:
      typeof u.passwordHash === 'string' && u.passwordHash.length > 0 ? u.passwordHash : AUTH_DEMO_PASSWORD_HASH_HEX,
    passwordTemporary: u.passwordTemporary ?? u.role !== 'admin',
  }))
}

export type AdminAction =
  | { type: 'RESET' }
  | { type: 'COURSE_ADD'; course: AdminCourse }
  | { type: 'COURSE_UPDATE'; id: string; patch: Partial<AdminCourse> }
  | { type: 'COURSE_DELETE'; id: string }
  | { type: 'GROUP_ADD'; group: AdminGroup }
  | { type: 'GROUP_UPDATE'; id: string; patch: Partial<AdminGroup> }
  | { type: 'GROUP_DELETE'; id: string }
  | { type: 'GROUP_LESSON_DAY_OVERRIDE'; groupId: string; entry: LessonDayOverride }
  | { type: 'GROUP_LESSON_DAY_OVERRIDE_REMOVE'; groupId: string; date: string; slotId: string }
  | { type: 'STUDENT_ADD'; student: AdminStudent }
  | { type: 'STUDENT_UPDATE'; id: string; patch: Partial<AdminStudent> }
  | { type: 'STUDENT_DELETE'; id: string }
  | { type: 'STUDENT_LESSON_LOG_ADD'; studentId: string; entry: LessonLogRow }
  | { type: 'STUDENT_GROUP_GRADE_SET'; studentId: string; groupId: string; score: number | null; note: string; teacherId: string }
  | { type: 'STUDENT_SET_INSTALLMENTS'; studentId: string; installments: InstallmentRow[] }
  | { type: 'INSTALLMENT_PATCH'; studentId: string; installmentId: string; patch: Partial<InstallmentRow> }
  | {
      type: 'REGENERATE_INSTALLMENTS'
      studentId: string
      months: number
      firstDue: string
      auditSummary?: string
    }
  | {
      type: 'STUDENT_DISCOUNT_RECALC'
      studentId: string
      patch: Partial<AdminStudent>
      auditSummary: string
      notifyMessage?: string
    }
  | {
      type: 'INSTALLMENT_MARK_PAID'
      studentId: string
      installmentId: string
      method: PaymentMethod
      receiptRef: string
      paidAt?: string
      auditSummary: string
    }
  | { type: 'AUDIT_LOG_PUSH'; entry: Omit<PaymentAuditEntry, 'id'> & { id?: string } }
  | { type: 'NOTIFICATION_PUSH'; message: string }
  | { type: 'STUDENT_PAYMENT_PLAN_FULL'; studentId: string; dueDate: string; auditSummary?: string }
  | { type: 'TEACHER_ADD'; teacher: AdminTeacher }
  | { type: 'TEACHER_UPDATE'; id: string; patch: Partial<AdminTeacher> }
  | { type: 'TEACHER_DELETE'; id: string }
  | { type: 'APP_USER_ADD'; user: AdminAppUser }
  | { type: 'APP_USER_UPDATE'; id: string; patch: Partial<AdminAppUser> }
  | { type: 'APP_USER_DELETE'; id: string }
  | { type: 'NOTIFICATION_READ'; id: string }
  | { type: 'NOTIFICATION_READ_ALL' }

function stripStudentFromGroups(groups: AdminGroup[], studentId: string): AdminGroup[] {
  return groups.map((g) => ({ ...g, studentIds: g.studentIds.filter((id) => id !== studentId) }))
}

function addStudentToGroup(groups: AdminGroup[], groupId: string | null, studentId: string): AdminGroup[] {
  if (!groupId) return groups
  return groups.map((g) =>
    g.id === groupId ? { ...g, studentIds: g.studentIds.includes(studentId) ? g.studentIds : [...g.studentIds, studentId] } : g,
  )
}

function moveStudentBetweenGroups(groups: AdminGroup[], _prev: string | null, next: string | null, studentId: string): AdminGroup[] {
  const stripped = stripStudentFromGroups(groups, studentId)
  return addStudentToGroup(stripped, next, studentId)
}

function guessDiscountCode(reason: string): import('@/types/admin').DiscountReasonCode {
  const t = reason.toLowerCase()
  if (t.includes('erk') || t.includes('early')) return 'early'
  if (t.includes('təqaüd') || t.includes('teqaud') || t.includes('scholar')) return 'scholarship'
  if (t.includes('kampan')) return 'campaign'
  return 'manual'
}

export function normalizeStudentLoaded(s: AdminStudent): AdminStudent {
  const discountReason = s.discountReason ?? ''
  return {
    ...s,
    parentPhone: s.parentPhone ?? '',
    discountAzn: clampDiscountAzn(s.discountAzn),
    discountReasonCode: s.discountReasonCode ?? guessDiscountCode(discountReason),
    discountAppliedAt: s.discountAppliedAt ?? null,
    paymentPlanMode: s.paymentPlanMode ?? (s.installments?.length === 1 ? 'full' : 'installments'),
    installments: (s.installments ?? []).map((i) => ({ ...i })),
    gradeByGroupId: { ...(s.gradeByGroupId ?? {}) },
    gradeHistoryByGroupId: s.gradeHistoryByGroupId
      ? Object.fromEntries(Object.entries(s.gradeHistoryByGroupId).map(([k, v]) => [k, [...v]]))
      : {},
  }
}

function prependAudit(state: AdminState, entry: Omit<PaymentAuditEntry, 'id'> & { id?: string }): AdminState {
  const e: PaymentAuditEntry = {
    id: entry.id ?? crypto.randomUUID(),
    at: entry.at,
    studentId: entry.studentId,
    studentName: entry.studentName,
    action: entry.action,
    summary: entry.summary,
  }
  return { ...state, paymentAuditLog: [e, ...(state.paymentAuditLog ?? [])].slice(0, MAX_AUDIT) }
}

function prependNotification(state: AdminState, message: string): AdminState {
  return {
    ...state,
    notifications: [{ id: crypto.randomUUID(), message, read: false }, ...state.notifications].slice(0, MAX_NOTIF),
  }
}

export function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'RESET':
      return seedAdminState()
    case 'COURSE_ADD':
      return { ...state, courses: [...state.courses, action.course] }
    case 'COURSE_UPDATE':
      return { ...state, courses: state.courses.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)) }
    case 'COURSE_DELETE':
      return { ...state, courses: state.courses.filter((c) => c.id !== action.id) }
    case 'GROUP_ADD': {
      const group: AdminGroup = {
        ...action.group,
        maxStudents: clampGroupMaxStudents(action.group.maxStudents),
      }
      return { ...state, groups: [...state.groups, group] }
    }
    case 'GROUP_UPDATE':
      return {
        ...state,
        groups: state.groups.map((g) => {
          if (g.id !== action.id) return g
          const patch = { ...action.patch }
          if (patch.maxStudents !== undefined) {
            patch.maxStudents = resolveGroupMaxStudents(g.studentIds.length, patch.maxStudents as number)
          }
          return { ...g, ...patch }
        }),
      }
    case 'GROUP_DELETE':
      return {
        ...state,
        groups: state.groups.filter((g) => g.id !== action.id),
        students: state.students.map((s) => (s.groupId === action.id ? { ...s, groupId: null } : s)),
      }
    case 'GROUP_LESSON_DAY_OVERRIDE': {
      return {
        ...state,
        groups: state.groups.map((g) => {
          if (g.id !== action.groupId) return g
          const list = [...(g.lessonDayOverrides ?? [])]
          const idx = list.findIndex((x) => x.date === action.entry.date && x.slotId === action.entry.slotId)
          const entry: LessonDayOverride = {
            ...action.entry,
            id: action.entry.id || crypto.randomUUID(),
          }
          if (idx >= 0) list[idx] = entry
          else list.push(entry)
          return { ...g, lessonDayOverrides: list }
        }),
      }
    }
    case 'GROUP_LESSON_DAY_OVERRIDE_REMOVE': {
      return {
        ...state,
        groups: state.groups.map((g) => {
          if (g.id !== action.groupId) return g
          const list = (g.lessonDayOverrides ?? []).filter((x) => !(x.date === action.date && x.slotId === action.slotId))
          return { ...g, lessonDayOverrides: list }
        }),
      }
    }
    case 'STUDENT_ADD': {
      const prevG = action.student.groupId
      const groups = addStudentToGroup(state.groups, prevG, action.student.id)
      return { ...state, students: [...state.students, normalizeStudentLoaded(action.student)], groups }
    }
    case 'STUDENT_UPDATE': {
      const prev = state.students.find((s) => s.id === action.id)
      if (!prev) return state
      const next = normalizeStudentLoaded({ ...prev, ...action.patch } as AdminStudent)
      let groups = state.groups
      if (action.patch.groupId !== undefined && action.patch.groupId !== prev.groupId) {
        groups = moveStudentBetweenGroups(state.groups, prev.groupId, next.groupId, next.id)
      }
      return { ...state, students: state.students.map((s) => (s.id === action.id ? next : s)), groups }
    }
    case 'STUDENT_DELETE': {
      const groups = stripStudentFromGroups(state.groups, action.id)
      return {
        ...state,
        students: state.students.filter((s) => s.id !== action.id),
        groups,
      }
    }
    case 'STUDENT_LESSON_LOG_ADD': {
      const st = state.students.find((s) => s.id === action.studentId)
      if (!st) return state
      const lessonLogs = [...st.lessonLogs, action.entry]
      const attendanceRate = attendanceRateFromLessonLogs(lessonLogs)
      return {
        ...state,
        students: state.students.map((s) =>
          s.id === action.studentId ? { ...s, lessonLogs, attendanceRate } : s,
        ),
      }
    }
    case 'STUDENT_GROUP_GRADE_SET': {
      const st = state.students.find((s) => s.id === action.studentId)
      if (!st) return state
      const recordedAt = new Date().toISOString()
      const hist: GradeHistoryEntry = {
        id: crypto.randomUUID(),
        score: action.score,
        note: action.note,
        recordedAt,
        teacherId: action.teacherId,
      }
      const prevHist = st.gradeHistoryByGroupId?.[action.groupId] ?? []
      const gradeHistoryByGroupId = {
        ...(st.gradeHistoryByGroupId ?? {}),
        [action.groupId]: [...prevHist, hist].slice(-60),
      }
      const gradeByGroupId = {
        ...(st.gradeByGroupId ?? {}),
        [action.groupId]: {
          score: action.score,
          note: action.note,
          updatedAt: recordedAt,
          updatedByTeacherId: action.teacherId,
        },
      }
      return {
        ...state,
        students: state.students.map((s) =>
          s.id === action.studentId ? { ...s, gradeByGroupId, gradeHistoryByGroupId } : s,
        ),
      }
    }
    case 'STUDENT_SET_INSTALLMENTS':
      return {
        ...state,
        students: state.students.map((s) =>
          s.id === action.studentId ? { ...s, installments: action.installments } : s,
        ),
      }
    case 'INSTALLMENT_PATCH':
      return {
        ...state,
        students: state.students.map((s) =>
          s.id === action.studentId
            ? {
                ...s,
                installments: s.installments.map((i) =>
                  i.id === action.installmentId ? { ...i, ...action.patch } : i,
                ),
              }
            : s,
        ),
      }
    case 'REGENERATE_INSTALLMENTS': {
      const st = state.students.find((s) => s.id === action.studentId)
      if (!st) return state
      const rows = regenerateInstallmentsKeepPaid(st, action.months, action.firstDue)
      let next: AdminState = {
        ...state,
        students: state.students.map((s) =>
          s.id === action.studentId ? { ...s, paymentPlanMode: 'installments', installments: rows } : s,
        ),
      }
      if (action.auditSummary && st) {
        next = prependAudit(next, {
          at: new Date().toISOString(),
          studentId: st.id,
          studentName: st.name,
          action: 'installment_regenerate',
          summary: action.auditSummary,
        })
      }
      return next
    }
    case 'STUDENT_DISCOUNT_RECALC': {
      const prev = state.students.find((s) => s.id === action.studentId)
      if (!prev) return state
      const merged = normalizeStudentLoaded({ ...prev, ...action.patch } as AdminStudent)
      const inst = redistributePendingAmounts(merged)
      let next: AdminState = {
        ...state,
        students: state.students.map((s) => (s.id === action.studentId ? { ...merged, installments: inst } : s)),
      }
      next = prependAudit(next, {
        at: new Date().toISOString(),
        studentId: prev.id,
        studentName: prev.name,
        action: 'discount_change',
        summary: action.auditSummary,
      })
      if (action.notifyMessage) next = prependNotification(next, action.notifyMessage)
      return next
    }
    case 'INSTALLMENT_MARK_PAID': {
      const st = state.students.find((s) => s.id === action.studentId)
      if (!st) return state
      const nextStudents = state.students.map((s) => {
        if (s.id !== action.studentId) return s
        return {
          ...s,
          installments: s.installments.map((i) =>
            i.id === action.installmentId
              ? markInstallmentPaidFields(i, action.method, action.receiptRef, action.paidAt)
              : i,
          ),
        }
      })
      let next: AdminState = { ...state, students: nextStudents }
      next = prependAudit(next, {
        at: new Date().toISOString(),
        studentId: action.studentId,
        studentName: st.name,
        action: 'mark_paid',
        summary: action.auditSummary,
      })
      return next
    }
    case 'AUDIT_LOG_PUSH':
      return prependAudit(state, {
        ...action.entry,
        at: action.entry.at || new Date().toISOString(),
        action: action.entry.action,
        summary: action.entry.summary,
        studentId: action.entry.studentId,
        studentName: action.entry.studentName,
      })
    case 'NOTIFICATION_PUSH':
      return prependNotification(state, action.message)
    case 'STUDENT_PAYMENT_PLAN_FULL': {
      const st = state.students.find((s) => s.id === action.studentId)
      if (!st) return state
      const net = finalCourseAmount(st.coursePriceAzn, st.discountAzn)
      const paid = st.installments.filter((i) => i.status === 'paid').sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      const paidSum = paid.reduce((a, r) => a + r.amount, 0)
      const remaining = Math.max(0, round2(net - paidSum))
      let installments: InstallmentRow[]
      if (paid.length === 0) {
        installments =
          net <= 0
            ? []
            : [
                {
                  id: crypto.randomUUID(),
                  monthLabel: 'Tam ödəniş',
                  amount: net,
                  dueDate: action.dueDate,
                  status: 'pending',
                },
              ]
      } else if (remaining > 0) {
        installments = [
          ...paid,
          {
            id: crypto.randomUUID(),
            monthLabel: 'Qalıq (tam plan)',
            amount: remaining,
            dueDate: action.dueDate,
            status: 'pending',
          },
        ]
      } else {
        installments = paid
      }
      let next: AdminState = {
        ...state,
        students: state.students.map((s) =>
          s.id === action.studentId ? { ...s, paymentPlanMode: 'full', installments } : s,
        ),
      }
      if (action.auditSummary && st) {
        next = prependAudit(next, {
          at: new Date().toISOString(),
          studentId: st.id,
          studentName: st.name,
          action: 'installment_regenerate',
          summary: action.auditSummary,
        })
      }
      return next
    }
    case 'TEACHER_ADD':
      return { ...state, teachers: [...state.teachers, action.teacher] }
    case 'TEACHER_UPDATE':
      return { ...state, teachers: state.teachers.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)) }
    case 'TEACHER_DELETE':
      return { ...state, teachers: state.teachers.filter((t) => t.id !== action.id) }
    case 'APP_USER_ADD':
      return { ...state, appUsers: [...state.appUsers, action.user] }
    case 'APP_USER_UPDATE':
      return { ...state, appUsers: state.appUsers.map((u) => (u.id === action.id ? { ...u, ...action.patch } : u)) }
    case 'APP_USER_DELETE':
      return { ...state, appUsers: state.appUsers.filter((u) => u.id !== action.id) }
    case 'NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      }
    case 'NOTIFICATION_READ_ALL':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) }
    default:
      return state
  }
}

/** Saxlanmış kurs siyahısına seed-də olan, lakin bazada olmayan kursları əlavə edir (köhnə localStorage üçün). */
function mergeCoursesCatalog(loaded: AdminState): AdminState {
  const seed = seedAdminState()
  const byId = new Map(
    loaded.courses.map((c) => [
      c.id,
      { ...c, active: c.active ?? true, disabled: c.disabled ?? false },
    ]),
  )
  const courses: AdminCourse[] = seed.courses.map((sc) => {
    const ex = byId.get(sc.id)
    return ex ?? { ...sc, active: sc.active ?? true, disabled: sc.disabled ?? false }
  })
  for (const c of loaded.courses) {
    if (!seed.courses.some((sc) => sc.id === c.id)) {
      courses.push({ ...c, active: c.active ?? true, disabled: c.disabled ?? false })
    }
  }
  return { ...loaded, courses }
}

/** Saxlanmış müəllim siyahısına seed-də olan, lakin bazada olmayan müəllimləri əlavə edir. */
function mergeTeachersCatalog(loaded: AdminState): AdminState {
  const seed = seedAdminState()
  const byId = new Map(loaded.teachers.map((t) => [t.id, t]))
  const teachers: AdminTeacher[] = seed.teachers.map((st) => {
    const ex = byId.get(st.id)
    return ex ?? { ...st }
  })
  for (const t of loaded.teachers) {
    if (!seed.teachers.some((st) => st.id === t.id)) teachers.push({ ...t })
  }
  return { ...loaded, teachers }
}

/**
 * Demo miqrasiyası:
 * Həmidə Bədəlli müəlliminin WS/Web Dizayner qrupunda tələbə yoxdursa,
 * seed-dəki 32 Web Dizayner tələbəsini həmin qrupa əlavə edir.
 */
function ensureHemideWsGroupHasStudents(loaded: AdminState): AdminState {
  const hemide = loaded.teachers.find((t) => t.email.trim().toLowerCase() === 'hemide.bedelli@smartacademy.edu')
  if (!hemide) return loaded

  const wsGroup = loaded.groups.find(
    (g) =>
      g.teacherId === hemide.id &&
      (g.name.trim().toLowerCase() === 'ws' || g.name.trim().toLowerCase().includes('web dizayner')),
  )
  if (!wsGroup) return loaded

  const seed = seedAdminState()
  const demoWebStudents = seed.students.filter((s) => s.email.trim().toLowerCase().startsWith('webdesigner'))
  if (demoWebStudents.length === 0) return loaded

  const loadedStudentIds = new Set(loaded.students.map((s) => s.id))
  const missing = demoWebStudents.filter((s) => !loadedStudentIds.has(s.id))
  const mergedStudents = [...loaded.students, ...missing]

  const fillIds = demoWebStudents.map((s) => s.id)
  const nextIds = Array.from(new Set([...wsGroup.studentIds, ...fillIds])).slice(0, 32)
  const nextIdSet = new Set(nextIds)

  const students = mergedStudents.map((s) => (nextIdSet.has(s.id) ? { ...s, groupId: wsGroup.id } : s))
  const groups = loaded.groups.map((g) =>
    g.id === wsGroup.id ? { ...g, maxStudents: Math.max(g.maxStudents ?? 0, 32), studentIds: nextIds } : g,
  )

  return { ...loaded, students, groups }
}

/**
 * Köhnə localStorage-da səhv şifrə xəşi və ya silinmiş nümunə hesabları olanda girişi bərpa edir.
 * Yalnız seed `id` (u1, u2, …) üçün e-poçt/rol/aktivlik/xəş seed ilə sinxronlanır; digər istifadəçilər toxunulmaz qalır.
 */
function mergeSeedAppUsers(loaded: AdminState): AdminState {
  const seedUsers = seedAdminState().appUsers
  const seedIds = new Set(seedUsers.map((u) => u.id))
  const loadedById = new Map(loaded.appUsers.map((u) => [u.id, u]))
  const merged: AdminAppUser[] = []
  for (const su of seedUsers) {
    const ex = loadedById.get(su.id)
    merged.push(
      ex
        ? {
            ...ex,
            email: su.email,
            role: su.role,
            active: su.active,
            passwordHash: su.passwordHash,
            passwordTemporary: su.passwordTemporary,
          }
        : { ...su },
    )
  }
  for (const u of loaded.appUsers) {
    if (!seedIds.has(u.id)) merged.push(u)
  }
  return { ...loaded, appUsers: merged }
}

export function initAdminStateFromStorage(): AdminState {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY)
    if (!raw) return seedAdminState()
    const parsed = JSON.parse(raw) as { version?: number; data?: Partial<AdminState> }
    if (!parsed.data) return seedAdminState()
    const ver = parsed.version
    if (ver == null || ver < 2 || ver > ADMIN_STORAGE_VERSION) return seedAdminState()
    const d = parsed.data
    if (
      !Array.isArray(d.courses) ||
      !Array.isArray(d.groups) ||
      !Array.isArray(d.students) ||
      !Array.isArray(d.teachers) ||
      !Array.isArray(d.appUsers) ||
      !Array.isArray(d.notifications)
    ) {
      return seedAdminState()
    }
    const paymentAuditLog = Array.isArray(d.paymentAuditLog) ? (d.paymentAuditLog as PaymentAuditEntry[]) : []
    const partial = d as AdminState
    const loaded: AdminState = {
      ...partial,
      students: d.students!.map((s) => normalizeStudentLoaded(s as AdminStudent)),
      appUsers: normalizeAppUsersLoaded((d.appUsers ?? []) as AdminAppUser[]),
      paymentAuditLog,
    }
    const withCourses = mergeCoursesCatalog(loaded)
    const withTeachers = mergeTeachersCatalog(withCourses)
    const withAppUsers = mergeSeedAppUsers(withTeachers)
    const withHemideWsStudents = ensureHemideWsGroupHasStudents(withAppUsers)
    return {
      ...withHemideWsStudents,
      groups: withHemideWsStudents.groups.map((g) => ({
        ...g,
        maxStudents: resolveGroupMaxStudents(g.studentIds.length, g.maxStudents),
      })),
    }
  } catch {
    return seedAdminState()
  }
}
