export type UserRole = 'student' | 'teacher' | 'admin'

export type AuthUser = {
  id: string
  email: string
  fullName: string
  role: UserRole
}

export const ROLE_HOME: Record<UserRole, string> = {
  student: '/student',
  teacher: '/teacher',
  admin: '/admin',
}
