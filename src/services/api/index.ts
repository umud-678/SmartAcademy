export { apiClient } from '@/services/api/client'

/** Gələcəkdə modul-modul endpoint funksiyaları burada cəmlənir (məs: authApi, groupsApi). */
export const apiPaths = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
  },
  student: {
    dashboard: '/student/profile',
    attendance: '/student/attendance',
    payments: '/student/payments',
    materials: '/student/materials',
  },
  teacher: {
    dashboard: '/teacher/dashboard',
    groups: '/teacher/groups',
    group: (id: string) => `/teacher/groups/${id}`,
    schedule: '/teacher/schedule',
  },
  admin: {
    dashboard: '/admin/dashboard',
    students: '/admin/students',
    teachers: '/admin/teachers',
    groups: '/admin/groups',
    courses: '/admin/courses',
    payments: '/admin/payments',
    reports: '/admin/reports',
    settings: '/admin/settings',
  },
} as const
