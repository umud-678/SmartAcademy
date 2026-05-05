import { Box, CircularProgress } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedLayout } from '@/layouts/ProtectedLayout'
import { RequireRole } from '@/components/routing/RequireRole'
import { LoginPage } from '@/pages/auth/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AdminCoursesPage } from '@/pages/admin/AdminCoursesPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminPaymentsLayout } from '@/pages/admin/payments/AdminPaymentsLayout'
import { PaymentDashboardPage } from '@/pages/admin/payments/PaymentDashboardPage'
import { StudentPaymentsListPage } from '@/pages/admin/payments/StudentPaymentsListPage'
import { GroupDetailPage } from '@/pages/admin/GroupDetailPage'
import { GroupsListPage } from '@/pages/admin/GroupsListPage'
import { NewGroupWizardPage } from '@/pages/admin/NewGroupWizardPage'
import { NewStudentPage } from '@/pages/admin/NewStudentPage'
import { NewTeacherPage } from '@/pages/admin/NewTeacherPage'
import { ReportsPage } from '@/pages/admin/ReportsPage'
import { SettingsUsersPage } from '@/pages/admin/SettingsUsersPage'
import { StudentDetailPage } from '@/pages/admin/StudentDetailPage'
import { StudentsListPage } from '@/pages/admin/StudentsListPage'
import { TeacherDetailPage } from '@/pages/admin/TeacherDetailPage'
import { TeachersListPage } from '@/pages/admin/TeachersListPage'
import { MaterialsPage } from '@/pages/student/MaterialsPage'
import { MyAttendancePage } from '@/pages/student/MyAttendancePage'
import { MyPaymentsPage } from '@/pages/student/MyPaymentsPage'
import { StudentDashboardPage } from '@/pages/student/StudentDashboardPage'
import { StudentProfilePage } from '@/pages/student/StudentProfilePage'
import { StudentSettingsPage } from '@/pages/student/StudentSettingsPage'
import { GroupDetailPage as TeacherGroupDetailPage } from '@/pages/teacher/GroupDetailPage'
import { MyGroupsPage } from '@/pages/teacher/MyGroupsPage'
import { TeacherDashboardPage } from '@/pages/teacher/TeacherDashboardPage'
import { TeacherAttendancePage } from '@/pages/teacher/TeacherAttendancePage'
import { TeacherGradesOverviewPage } from '@/pages/teacher/TeacherGradesOverviewPage'
import { TeacherProfilePage } from '@/pages/teacher/TeacherProfilePage'
import { TeacherSchedulePage } from '@/pages/teacher/TeacherSchedulePage'
import { TeacherSettingsPage } from '@/pages/teacher/TeacherSettingsPage'
import { ROLE_HOME } from '@/types/user'

function HomeRedirect() {
  const { isAuthenticated, user, authReady } = useAuth()
  if (!authReady) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_HOME[user.role]} replace />
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="student" element={<RequireRole role="student" />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<StudentDashboardPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="attendance" element={<MyAttendancePage />} />
          <Route path="payments" element={<MyPaymentsPage />} />
          <Route path="materials" element={<MaterialsPage />} />
          <Route path="settings" element={<StudentSettingsPage />} />
        </Route>

        <Route path="teacher" element={<RequireRole role="teacher" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboardPage />} />
          <Route path="students" element={<Navigate to="/teacher/groups" replace />} />
          <Route path="groups" element={<MyGroupsPage />} />
          <Route path="groups/:groupId" element={<TeacherGroupDetailPage />} />
          <Route path="schedule" element={<TeacherSchedulePage />} />
          <Route path="attendance" element={<TeacherAttendancePage />} />
          <Route path="grades" element={<TeacherGradesOverviewPage />} />
          <Route path="profile" element={<TeacherProfilePage />} />
          <Route path="settings" element={<TeacherSettingsPage />} />
        </Route>

        <Route path="admin" element={<RequireRole role="admin" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="students" element={<StudentsListPage />} />
          <Route path="students/new" element={<NewStudentPage />} />
          <Route path="students/:studentId" element={<StudentDetailPage />} />
          <Route path="teachers" element={<TeachersListPage />} />
          <Route path="teachers/new" element={<NewTeacherPage />} />
          <Route path="teachers/:teacherId" element={<TeacherDetailPage />} />
          <Route path="groups" element={<GroupsListPage />} />
          <Route path="groups/new" element={<NewGroupWizardPage />} />
          <Route path="groups/:groupId" element={<GroupDetailPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="payments" element={<AdminPaymentsLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PaymentDashboardPage />} />
            <Route path="students" element={<StudentPaymentsListPage />} />
          </Route>
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsUsersPage />} />
          <Route path="services" element={<Navigate to="/admin/courses" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
