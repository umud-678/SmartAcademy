import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { enqueueSnackbar } from 'notistack'
import {
  ADMIN_STORAGE_KEY,
  ADMIN_STORAGE_VERSION,
  type AdminAction,
  adminReducer,
  initAdminStateFromStorage,
} from '@/contexts/adminReducer'
import { seedAdminState } from '@/data/adminSeed'
import { activeGroupsCount, finalAmountStudent, flattenInstallments, studentsWithDiscountCount } from '@/lib/adminSelectors'
import type {
  AdminAppUser,
  AdminCourse,
  AdminGroup,
  AdminStudent,
  AdminTeacher,
  InstallmentRow,
  LessonDayOverride,
  LessonLogRow,
  PaymentMethod,
} from '@/types/admin'
import { installmentsMatchNet, studentWithInstallmentPatch, sumInstallmentAmounts } from '@/utils/installments'

type AdminDataContextValue = {
  state: ReturnType<typeof initAdminStateFromStorage>
  dispatch: React.Dispatch<AdminAction>
  reset: () => void
  /** İdarə paneli və ödəniş modulu üçün */
  stats: {
    activeStudents: number
    activeGroups: number
    teachers: number
    paidMonthAzn: number
    overdueTotalAzn: number
    overdueCount: number
    expectedPendingAzn: number
    lowAttendanceStudents: number
    discountedStudents: number
  }
  courseAdd: (c: Omit<AdminCourse, 'id'>) => void
  courseUpdate: (id: string, patch: Partial<AdminCourse>) => void
  courseDelete: (id: string) => void
  groupAdd: (g: AdminGroup) => void
  groupUpdate: (id: string, patch: Partial<AdminGroup>) => void
  groupDelete: (id: string) => void
  studentAdd: (s: AdminStudent) => void
  studentUpdate: (id: string, patch: Partial<AdminStudent>) => void
  studentDelete: (id: string) => void
  setStudentInstallments: (studentId: string, rows: InstallmentRow[]) => void
  regenerateInstallments: (studentId: string, months: number, firstDue: string, auditSummary?: string) => void
  studentDiscountRecalc: (studentId: string, patch: Partial<AdminStudent>, auditSummary: string, notifyMessage?: string) => void
  applyFullPaymentPlan: (studentId: string, dueDate: string, auditSummary?: string) => void
  markInstallmentPaid: (
    studentId: string,
    installmentId: string,
    opts: { method: PaymentMethod; receiptRef: string; paidAt?: string },
  ) => void
  patchInstallment: (studentId: string, installmentId: string, patch: Partial<InstallmentRow>) => void
  studentAddLessonLog: (studentId: string, entry: LessonLogRow) => void
  studentSetGroupGrade: (studentId: string, groupId: string, score: number | null, note: string, teacherId: string) => void
  groupLessonDayOverride: (groupId: string, entry: LessonDayOverride) => void
  groupLessonDayOverrideRemove: (groupId: string, date: string, slotId: string) => void
  teacherAdd: (t: Omit<AdminTeacher, 'id'>) => void
  teacherUpdate: (id: string, patch: Partial<AdminTeacher>) => void
  teacherDelete: (id: string) => void
  appUserAdd: (u: AdminAppUser) => void
  appUserUpdate: (id: string, patch: Partial<AdminAppUser>) => void
  appUserDelete: (id: string) => void
  notificationRead: (id: string) => void
  notificationReadAll: () => void
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null)

function computeStats(s: ReturnType<typeof initAdminStateFromStorage>) {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const flat = flattenInstallments(s)
  const paidMonthAzn = flat
    .filter((r) => r.storedStatus === 'paid' && r.due.startsWith(ym))
    .reduce((a, r) => a + r.amount, 0)
  const overdue = flat.filter((r) => r.status === 'overdue')
  const overdueTotalAzn = overdue.reduce((a, r) => a + r.amount, 0)
  const pending = flat.filter((r) => r.status === 'pending')
  const expectedPendingAzn = pending.reduce((a, r) => a + r.amount, 0)
  const activeStudents = s.students.filter((x) => x.status === 'active').length
  const lowAttendanceStudents = s.students.filter((x) => x.attendanceRate < 80).length
  return {
    activeStudents,
    activeGroups: activeGroupsCount(s),
    teachers: s.teachers.filter((t) => t.status === 'active').length,
    paidMonthAzn,
    overdueTotalAzn,
    overdueCount: overdue.length,
    expectedPendingAzn,
    lowAttendanceStudents,
    discountedStudents: studentsWithDiscountCount(s),
  }
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, undefined, initAdminStateFromStorage)

  useEffect(() => {
    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      JSON.stringify({ version: ADMIN_STORAGE_VERSION, data: state }),
    )
  }, [state])

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  const courseAdd = useCallback((c: Omit<AdminCourse, 'id'>) => {
    dispatch({ type: 'COURSE_ADD', course: { ...c, id: crypto.randomUUID() } })
  }, [])
  const courseUpdate = useCallback((id: string, patch: Partial<AdminCourse>) => {
    dispatch({ type: 'COURSE_UPDATE', id, patch })
  }, [])
  const courseDelete = useCallback((id: string) => {
    dispatch({ type: 'COURSE_DELETE', id })
  }, [])

  const groupAdd = useCallback((g: AdminGroup) => {
    dispatch({ type: 'GROUP_ADD', group: g })
  }, [])
  const groupUpdate = useCallback((id: string, patch: Partial<AdminGroup>) => {
    dispatch({ type: 'GROUP_UPDATE', id, patch })
  }, [])
  const groupDelete = useCallback((id: string) => {
    dispatch({ type: 'GROUP_DELETE', id })
  }, [])

  const studentAdd = useCallback((s: AdminStudent) => {
    dispatch({ type: 'STUDENT_ADD', student: s })
  }, [])
  const studentUpdate = useCallback((id: string, patch: Partial<AdminStudent>) => {
    dispatch({ type: 'STUDENT_UPDATE', id, patch })
  }, [])
  const studentDelete = useCallback((id: string) => {
    dispatch({ type: 'STUDENT_DELETE', id })
  }, [])
  const setStudentInstallments = useCallback((studentId: string, rows: InstallmentRow[]) => {
    dispatch({ type: 'STUDENT_SET_INSTALLMENTS', studentId, installments: rows })
  }, [])
  const regenerateInstallments = useCallback((studentId: string, months: number, firstDue: string, auditSummary?: string) => {
    dispatch({ type: 'REGENERATE_INSTALLMENTS', studentId, months, firstDue, auditSummary })
  }, [])
  const studentDiscountRecalc = useCallback(
    (studentId: string, patch: Partial<AdminStudent>, auditSummary: string, notifyMessage?: string) => {
      dispatch({ type: 'STUDENT_DISCOUNT_RECALC', studentId, patch, auditSummary, notifyMessage })
    },
    [],
  )
  const applyFullPaymentPlan = useCallback((studentId: string, dueDate: string, auditSummary?: string) => {
    dispatch({ type: 'STUDENT_PAYMENT_PLAN_FULL', studentId, dueDate, auditSummary })
  }, [])
  const markInstallmentPaid = useCallback(
    (
      studentId: string,
      installmentId: string,
      opts: { method: PaymentMethod; receiptRef: string; paidAt?: string },
    ) => {
      const st = state.students.find((x) => x.id === studentId)
      const row = st?.installments.find((i) => i.id === installmentId)
      const methodAz =
        opts.method === 'cash' ? 'Nağd' : opts.method === 'transfer' ? 'Köçürmə' : 'Onlayn'
      const auditSummary = `Ödəniş qeydə alındı — ${row?.monthLabel ?? 'taksit'} (${methodAz}${opts.receiptRef ? `, qəbz: ${opts.receiptRef}` : ''})`
      dispatch({
        type: 'INSTALLMENT_MARK_PAID',
        studentId,
        installmentId,
        method: opts.method,
        receiptRef: opts.receiptRef,
        paidAt: opts.paidAt,
        auditSummary,
      })
    },
    [state.students, dispatch],
  )
  const patchInstallment = useCallback(
    (studentId: string, installmentId: string, patch: Partial<InstallmentRow>) => {
      const st = state.students.find((x) => x.id === studentId)
      if (!st) return
      const row = st.installments.find((i) => i.id === installmentId)
      const hypothetical = studentWithInstallmentPatch(st, installmentId, patch)
      if (patch.amount !== undefined && !installmentsMatchNet(hypothetical)) {
        const net = finalAmountStudent(st)
        const sum = sumInstallmentAmounts(hypothetical.installments)
        enqueueSnackbar(`Taksitlərin cəmi (${sum} ₼) yekun məbləğə (${net} ₼) bərabər olmalıdır.`, { variant: 'warning' })
        return
      }
      dispatch({ type: 'INSTALLMENT_PATCH', studentId, installmentId, patch })
      if (row && (patch.amount !== undefined || patch.dueDate !== undefined)) {
        const parts: string[] = []
        if (patch.amount !== undefined) parts.push(`məbləğ ${patch.amount} ₼`)
        if (patch.dueDate !== undefined) parts.push(`son tarix ${patch.dueDate}`)
        dispatch({
          type: 'AUDIT_LOG_PUSH',
          entry: {
            at: new Date().toISOString(),
            studentId,
            studentName: st.name,
            action: 'installment_adjust',
            summary: `${row.monthLabel}: ${parts.join(', ')}`,
          },
        })
      }
    },
    [state.students, dispatch],
  )

  const studentAddLessonLog = useCallback((studentId: string, entry: LessonLogRow) => {
    dispatch({ type: 'STUDENT_LESSON_LOG_ADD', studentId, entry })
  }, [])
  const studentSetGroupGrade = useCallback(
    (studentId: string, groupId: string, score: number | null, note: string, teacherId: string) => {
      dispatch({ type: 'STUDENT_GROUP_GRADE_SET', studentId, groupId, score, note, teacherId })
    },
    [],
  )
  const groupLessonDayOverride = useCallback((groupId: string, entry: LessonDayOverride) => {
    dispatch({ type: 'GROUP_LESSON_DAY_OVERRIDE', groupId, entry })
  }, [])
  const groupLessonDayOverrideRemove = useCallback((groupId: string, date: string, slotId: string) => {
    dispatch({ type: 'GROUP_LESSON_DAY_OVERRIDE_REMOVE', groupId, date, slotId })
  }, [])

  const teacherAdd = useCallback((t: Omit<AdminTeacher, 'id'>) => {
    dispatch({ type: 'TEACHER_ADD', teacher: { ...t, id: crypto.randomUUID() } })
  }, [])
  const teacherUpdate = useCallback((id: string, patch: Partial<AdminTeacher>) => {
    dispatch({ type: 'TEACHER_UPDATE', id, patch })
  }, [])
  const teacherDelete = useCallback((id: string) => {
    dispatch({ type: 'TEACHER_DELETE', id })
  }, [])

  const appUserAdd = useCallback((u: AdminAppUser) => {
    dispatch({ type: 'APP_USER_ADD', user: u })
  }, [])
  const appUserUpdate = useCallback((id: string, patch: Partial<AdminAppUser>) => {
    dispatch({ type: 'APP_USER_UPDATE', id, patch })
  }, [])
  const appUserDelete = useCallback((id: string) => {
    dispatch({ type: 'APP_USER_DELETE', id })
  }, [])

  const notificationRead = useCallback((id: string) => {
    dispatch({ type: 'NOTIFICATION_READ', id })
  }, [])
  const notificationReadAll = useCallback(() => {
    dispatch({ type: 'NOTIFICATION_READ_ALL' })
  }, [])

  const stats = useMemo(() => computeStats(state), [state])

  const value = useMemo<AdminDataContextValue>(
    () => ({
      state,
      dispatch,
      reset,
      stats,
      courseAdd,
      courseUpdate,
      courseDelete,
      groupAdd,
      groupUpdate,
      groupDelete,
      studentAdd,
      studentUpdate,
      studentDelete,
      setStudentInstallments,
      regenerateInstallments,
      studentDiscountRecalc,
      applyFullPaymentPlan,
      markInstallmentPaid,
      patchInstallment,
      studentAddLessonLog,
      studentSetGroupGrade,
      groupLessonDayOverride,
      groupLessonDayOverrideRemove,
      teacherAdd,
      teacherUpdate,
      teacherDelete,
      appUserAdd,
      appUserUpdate,
      appUserDelete,
      notificationRead,
      notificationReadAll,
    }),
    [
      state,
      dispatch,
      reset,
      stats,
      courseAdd,
      courseUpdate,
      courseDelete,
      groupAdd,
      groupUpdate,
      groupDelete,
      studentAdd,
      studentUpdate,
      studentDelete,
      setStudentInstallments,
      regenerateInstallments,
      studentDiscountRecalc,
      applyFullPaymentPlan,
      markInstallmentPaid,
      patchInstallment,
      studentAddLessonLog,
      studentSetGroupGrade,
      groupLessonDayOverride,
      groupLessonDayOverrideRemove,
      teacherAdd,
      teacherUpdate,
      teacherDelete,
      appUserAdd,
      appUserUpdate,
      appUserDelete,
      notificationRead,
      notificationReadAll,
    ],
  )

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook provider ilə eyni modulda saxlanılır
export function useAdminData() {
  const ctx = useContext(AdminDataContext)
  if (!ctx) throw new Error('useAdminData must be used within AdminDataProvider')
  return ctx
}

export { seedAdminState }
