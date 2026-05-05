export type StudentStatus = 'active' | 'suspended'

export type PaymentStatus = 'paid' | 'pending' | 'overdue'

export type PaymentMethod = 'cash' | 'transfer' | 'online'

export type DiscountReasonCode = 'early' | 'scholarship' | 'campaign' | 'manual'

export type StudentPaymentPlanMode = 'full' | 'installments'

export type LessonPresence = 'present' | 'absent' | 'late' | 'excused'

export type InstallmentRow = {
  id: string
  monthLabel: string
  amount: number
  dueDate: string
  status: PaymentStatus
  /** Ödənilib olduqda */
  paidAt?: string
  paymentMethod?: PaymentMethod
  receiptRef?: string
}

export type LessonLogRow = {
  id: string
  date: string
  lesson: string
  status: LessonPresence
  /** Müəllimin qeydi (məsələn, gecikdi) */
  note?: string
  groupId?: string
  recordedAt?: string
  recordedByTeacherId?: string
}

/** Qrup cədvəlində konkret gün üçün vəziyyət (müəllim təyin edir) */
export type LessonDayOverride = {
  id: string
  date: string
  slotId: string
  status: 'cancelled' | 'postponed'
}

export type GradeHistoryEntry = {
  id: string
  score: number | null
  note: string
  recordedAt: string
  teacherId: string
}

export type GradeByGroupValue = {
  score: number | null
  note: string
  updatedAt?: string
  updatedByTeacherId?: string
}

export type AdminStudent = {
  id: string
  name: string
  email: string
  phone: string
  /** Valideyn / əlaqə nömrəsi */
  parentPhone: string
  registeredAt: string
  groupId: string | null
  status: StudentStatus
  attendanceRate: number
  coursePriceAzn: number
  discountAzn: number
  /** Səbəb kodu (UI seçimi) */
  discountReasonCode: DiscountReasonCode
  /** Kampaniya / təqaüd / əl ilə daxil edilmiş mətn */
  discountReason: string
  /** Güzəşt tarixi (opsional) */
  discountAppliedAt?: string | null
  paymentPlanMode: StudentPaymentPlanMode
  installments: InstallmentRow[]
  lessonLogs: LessonLogRow[]
  /** Müəllim qiyməti: qrupId → cari bal və qeyd */
  gradeByGroupId?: Record<string, GradeByGroupValue>
  /** Qrup üzrə qiymət tarixçəsi (kim, nə vaxt) */
  gradeHistoryByGroupId?: Record<string, GradeHistoryEntry[]>
}

export type TeacherStatus = 'active' | 'inactive'

export type AdminTeacher = {
  id: string
  name: string
  email: string
  status: TeacherStatus
  lessonsTaught: number
  teacherAttendancePct: number
}

export type AdminCourse = {
  id: string
  name: string
  duration: string
  priceAzn: number
  active: boolean
  disabled: boolean
}

export type GroupStatus = 'active' | 'archived'

export type ScheduleSlot = {
  id: string
  /** 0=B.e … 6=B. (JS getDay() ilə uyğunlaşdırılmış) */
  days: number[]
  start: string
  end: string
  room: string
}

export type AdminGroup = {
  id: string
  name: string
  courseId: string
  teacherId: string
  /** Tutum: UI və reducer tərəfindən 6–32 aralığında saxlanılır */
  maxStudents: number
  studentIds: string[]
  status: GroupStatus
  schedule: ScheduleSlot[]
  /** Müəllim: dərs günü üzrə ləğv / təxirə */
  lessonDayOverrides?: LessonDayOverride[]
}

export type AppUserRole = 'admin' | 'teacher' | 'student'

export type AdminAppUser = {
  id: string
  role: AppUserRole
  email: string
  active: boolean
  /** SHA-256 (hex) — AUTH_PASSWORD_PEPPER ilə; boşdursa giriş mümkün deyil */
  passwordHash: string
}

export type AdminNotification = {
  id: string
  message: string
  read: boolean
}

export type PaymentAuditAction =
  | 'discount_change'
  | 'installment_regenerate'
  | 'mark_paid'
  | 'installment_adjust'

export type PaymentAuditEntry = {
  id: string
  at: string
  studentId: string
  studentName: string
  action: PaymentAuditAction
  summary: string
}

export type AdminState = {
  courses: AdminCourse[]
  groups: AdminGroup[]
  students: AdminStudent[]
  teachers: AdminTeacher[]
  appUsers: AdminAppUser[]
  notifications: AdminNotification[]
  paymentAuditLog: PaymentAuditEntry[]
}
