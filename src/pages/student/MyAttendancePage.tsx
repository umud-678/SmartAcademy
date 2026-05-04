import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { Alert, Card, CardContent, Stack, Typography } from '@mui/material'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { AttendanceStatus } from '@/types/status'

type Row = {
  id: string
  date: string
  lesson: string
  status: AttendanceStatus
}

const rows: Row[] = [
  { id: '1', date: '2026-04-28', lesson: 'React Hooks', status: 'present' },
  { id: '2', date: '2026-04-30', lesson: 'TypeScript', status: 'late' },
  { id: '3', date: '2026-05-02', lesson: 'API dizaynı', status: 'absent' },
]

const tone: Record<AttendanceStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  present: 'success',
  late: 'warning',
  absent: 'error',
  excused: 'neutral',
}

const label: Record<AttendanceStatus, string> = {
  present: 'İştirak edib',
  late: 'Gecikib',
  absent: 'Qayıb',
  excused: 'Üzürlü',
}

const columns: DataTableColumn<Row>[] = [
  { id: 'date', label: 'Tarix' },
  { id: 'lesson', label: 'Dərs' },
  {
    id: 'status',
    label: 'Vəziyyət',
    render: (r) => <StatusBadge label={label[r.status]} tone={tone[r.status]} />,
  },
]

export function MyAttendancePage() {
  const pct = 72
  const showWarning = pct < 80

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Mənim davamiyyətim</Typography>
      <Typography variant="body2" color="text.secondary">
        Ümumi faiz və tarix üzrə cədvəl (serverə qoşulanda yenilənəcək).
      </Typography>
      {showWarning ? (
        <Alert severity="warning" icon={<WarningAmberOutlinedIcon fontSize="inherit" />}>
          Ümumi davamiyyət {pct}% — 80%-dən aşağıdır. Zəhmət olmasa, dərsə düzgün qatılın.
        </Alert>
      ) : null}
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
            <BoxStat title="Ümumi faiz" value={`${pct}%`} />
          </Stack>
        </CardContent>
      </Card>
      <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} />
    </Stack>
  )
}

function BoxStat({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h5" fontWeight={800}>
        {value}
      </Typography>
    </div>
  )
}
