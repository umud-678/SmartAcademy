export type UserRole = 'student' | 'teacher' | 'admin'

export type AuthUser = {
  id: string
  email: string
  fullName: string
  role: UserRole
}

/** Uğurlu girişdən sonra birbaşa açılan əsas səhifə (rol + UX). */
export const ROLE_HOME: Record<UserRole, string> = {
  student: '/student/profile',
  teacher: '/teacher/dashboard',
  admin: '/admin/dashboard',
}
