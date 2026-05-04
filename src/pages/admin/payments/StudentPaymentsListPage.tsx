import { Button, Card, CardContent, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAdminData } from '@/contexts/AdminDataContext'
import { finalAmountStudent, groupLabel, studentDebt, studentNextDue } from '@/lib/adminSelectors'
import { installmentDisplayStatus } from '@/utils/installments'
import type { AdminStudent } from '@/types/admin'

type Row = AdminStudent & { net: number; debt: number; nextDue: string; hasOverdue: boolean }

export function StudentPaymentsListPage() {
  const { state } = useAdminData()

  const rows: Row[] = state.students.map((s) => {
    const hasOverdue = s.installments.some((i) => installmentDisplayStatus(i) === 'overdue')
    return {
      ...s,
      net: finalAmountStudent(s),
      debt: studentDebt(s),
      nextDue: studentNextDue(s),
      hasOverdue,
    }
  })

  const columns: DataTableColumn<Row>[] = [
    {
      id: 'name',
      label: 'Tələbə',
      render: (r) => (
        <Button component={RouterLink} to={`/admin/students/${r.id}`} sx={{ textTransform: 'none', fontWeight: 700 }}>
          {r.name}
        </Button>
      ),
    },
    { id: 'group', label: 'Qrup', render: (r) => groupLabel(state, r.groupId) },
    { id: 'net', label: 'Yekun plan', render: (r) => `${r.net} ₼` },
    { id: 'debt', label: 'Qalıq borc', render: (r) => `${r.debt} ₼` },
    { id: 'nextDue', label: 'Növbəti tarix', render: (r) => r.nextDue },
    {
      id: 'flag',
      label: 'Nəzarət',
      render: (r) =>
        r.hasOverdue ? (
          <StatusBadge label="Gecikmə var" tone="error" />
        ) : r.debt <= 0 ? (
          <StatusBadge label="Tam ödənilib" tone="success" />
        ) : (
          <StatusBadge label="Normal" tone="warning" />
        ),
    },
  ]

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
      <CardContent sx={{ pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Bütün tələbələrin yekun məbləği, qalıq borcu və növbəti ödəniş tarixi. Detallı güzəşt və taksit üçün tələbə kartına daxil olun.
        </Typography>
        <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} />
      </CardContent>
    </Card>
  )
}
