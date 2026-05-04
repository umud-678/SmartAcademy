import {
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { ReactNode } from 'react'
import { EmptyState } from '@/components/common/EmptyState'

export type DataTableColumn<Row extends object> = {
  id: keyof Row | string
  label: string
  align?: 'left' | 'right' | 'center'
  minWidth?: number
  render?: (row: Row) => ReactNode
}

type DataTableProps<Row extends object> = {
  columns: DataTableColumn<Row>[]
  rows: Row[]
  getRowId: (row: Row) => string
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

export function DataTable<Row extends object>({
  columns,
  rows,
  getRowId,
  loading,
  emptyTitle = 'Məlumat yoxdur',
  emptyDescription = 'Bu bölmədə hələlik sətir tapılmadı.',
}: DataTableProps<Row>) {
  if (loading) {
    return <Skeleton variant="rounded" height={220} sx={{ borderRadius: 2 }} />
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        boxShadow: (t) => (t.palette.mode === 'light' ? '0 1px 2px rgba(15,23,42,0.04)' : 'none'),
      }}
    >
      <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: 'divider' } }}>
        <TableHead>
          <TableRow
            sx={{
              bgcolor: (t) => (t.palette.mode === 'light' ? '#f1f5f9' : 'action.hover'),
              '& th': { fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' },
            }}
          >
            {columns.map((col) => (
              <TableCell key={String(col.id)} align={col.align} sx={{ minWidth: col.minWidth, py: 1.25 }}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow
              hover
              key={getRowId(row)}
              sx={{
                bgcolor: idx % 2 === 0 ? 'transparent' : (t) => (t.palette.mode === 'light' ? 'rgba(248,250,252,0.8)' : 'action.hover'),
              }}
            >
              {columns.map((col) => (
                <TableCell key={String(col.id)} align={col.align} sx={{ py: 1.35 }}>
                  {col.render ? (
                    col.render(row)
                  ) : (
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {String((row as Record<string, unknown>)[col.id as string] ?? '')}
                    </Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
