import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import type { ReactElement } from 'react'
import type { UserRole } from '@/types/user'

export type NavItem = {
  label: string
  path: string
  icon: ReactElement
}

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  student: [
    { label: 'Ana ekran', path: '/student/home', icon: <DashboardOutlinedIcon /> },
    { label: 'Profil', path: '/student/profile', icon: <PersonOutlineOutlinedIcon /> },
    { label: 'Davamiyyətim', path: '/student/attendance', icon: <FactCheckOutlinedIcon /> },
    { label: 'Ödənişlərim', path: '/student/payments', icon: <PaymentOutlinedIcon /> },
    { label: 'Materiallar', path: '/student/materials', icon: <MenuBookOutlinedIcon /> },
    { label: 'Ayarlar', path: '/student/settings', icon: <SettingsOutlinedIcon /> },
  ],
  teacher: [
    { label: 'İdarə paneli', path: '/teacher/dashboard', icon: <DashboardOutlinedIcon /> },
    { label: 'Qruplarım', path: '/teacher/groups', icon: <GroupsOutlinedIcon /> },
    { label: 'Cədvəl', path: '/teacher/schedule', icon: <CalendarMonthOutlinedIcon /> },
    { label: 'Davamiyyət', path: '/teacher/attendance', icon: <FactCheckOutlinedIcon /> },
    { label: 'Qiymət və qeyd', path: '/teacher/grades', icon: <EditNoteOutlinedIcon /> },
    { label: 'Profil', path: '/teacher/profile', icon: <PersonOutlineOutlinedIcon /> },
    { label: 'Ayarlar', path: '/teacher/settings', icon: <SettingsOutlinedIcon /> },
  ],
  admin: [
    { label: 'İdarə paneli', path: '/admin/dashboard', icon: <DashboardOutlinedIcon /> },
    { label: 'Tələbələr', path: '/admin/students', icon: <PeopleAltOutlinedIcon /> },
    { label: 'Müəllimlər', path: '/admin/teachers', icon: <SchoolOutlinedIcon /> },
    { label: 'Qruplar', path: '/admin/groups', icon: <GroupsOutlinedIcon /> },
    { label: 'Kurslar', path: '/admin/courses', icon: <MenuBookOutlinedIcon /> },
    { label: 'Ödənişlər', path: '/admin/payments', icon: <AttachMoneyOutlinedIcon /> },
    { label: 'Hesabatlar', path: '/admin/reports', icon: <AssessmentOutlinedIcon /> },
    { label: 'Tənzimləmələr', path: '/admin/settings', icon: <SettingsOutlinedIcon /> },
  ],
}

export const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Tələbə',
  teacher: 'Müəllim',
  admin: 'İdarəçi',
}

export const ROLE_ICON: Record<UserRole, ReactElement> = {
  student: <SchoolOutlinedIcon fontSize="small" />,
  teacher: <SchoolOutlinedIcon fontSize="small" />,
  admin: <AdminPanelSettingsOutlinedIcon fontSize="small" />,
}
