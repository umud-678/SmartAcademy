import { Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { PaymentRowStatus } from '@/types/status'

type Row = { id: string; due: string; amount: number; status: PaymentRowStatus }

const rows: Row[] = [
  { id: '1', due: '2026-05-01', amount: 200, status: 'paid' },
  { id: '2', due: '2026-06-01', amount: 200, status: 'pending' },
  { id: '3', due: '2026-04-10', amount: 200, status: 'overdue' },
]

const tone: Record<PaymentRowStatus, 'success' | 'warning' | 'error'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'error',
}

const label: Record<PaymentRowStatus, string> = {
  paid: 'Ödənilib',
  pending: 'Gözləyir',
  overdue: 'Gecikib',
}

const columns: DataTableColumn<Row>[] = [
  { id: 'due', label: 'Son tarix' },
  {
    id: 'amount',
    label: 'Məbləğ',
    render: (r) => (
      <Typography variant="body2" color={r.status === 'overdue' ? 'error' : 'text.primary'} fontWeight={600}>
        {r.amount} ₼
      </Typography>
    ),
  },
  {
    id: 'status',
    label: 'Vəziyyət',
    render: (r) => <StatusBadge label={label[r.status]} tone={tone[r.status]} />,
  },
]

export function MyPaymentsPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Ödənişlərim</Typography>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Ümumi kurs qiyməti
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              1000 ₼
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">
              Endirim: <b>10%</b> (tətbiq olunub)
            </Typography>
          </Stack>
        </CardContent>
      </Card>
      <Typography variant="subtitle1" fontWeight={700}>
        Aylıq ödənişlər
      </Typography>
      <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} />
    </Stack>
  )
}
