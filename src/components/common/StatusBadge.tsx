import { Chip, type ChipProps } from '@mui/material'
import type { StatusTone } from '@/types/status'

const toneColor: Record<
  StatusTone,
  { color: ChipProps['color']; variant: ChipProps['variant'] }
> = {
  success: { color: 'success', variant: 'filled' },
  warning: { color: 'warning', variant: 'filled' },
  error: { color: 'error', variant: 'filled' },
  neutral: { color: 'default', variant: 'outlined' },
}

type StatusBadgeProps = {
  label: string
  tone: StatusTone
  size?: ChipProps['size']
}

export function StatusBadge({ label, tone, size = 'small' }: StatusBadgeProps) {
  const cfg = toneColor[tone]
  return <Chip label={label} size={size} color={cfg.color} variant={cfg.variant} />
}
