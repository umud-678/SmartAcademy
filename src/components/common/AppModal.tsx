import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  type DialogProps,
} from '@mui/material'
import type { ReactNode } from 'react'

type AppModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  primaryLabel?: string
  onPrimary?: () => void
  secondaryLabel?: string
  maxWidth?: DialogProps['maxWidth']
}

export function AppModal({
  open,
  onClose,
  title,
  children,
  primaryLabel = 'Bağla',
  onPrimary,
  secondaryLabel,
  maxWidth = 'sm',
}: AppModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions>
        {secondaryLabel ? (
          <Button onClick={onClose} color="inherit">
            {secondaryLabel}
          </Button>
        ) : null}
        <Button
          variant="contained"
          onClick={() => {
            onPrimary?.()
            onClose()
          }}
        >
          {primaryLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
