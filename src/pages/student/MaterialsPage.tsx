import LinkIcon from '@mui/icons-material/Link'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import SlideshowOutlinedIcon from '@mui/icons-material/SlideshowOutlined'
import { Button, Card, CardContent, Stack, Typography } from '@mui/material'

const items = [
  { id: '1', title: 'Modul 1 — təqdimat', type: 'slide' as const },
  { id: '2', title: 'Tapşırıq PDF', type: 'pdf' as const },
  { id: '3', title: 'Faydalı link', type: 'link' as const, href: 'https://example.com' },
]

export function MaterialsPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Təqdimatlar / materiallar</Typography>
      <Typography variant="body2" color="text.secondary">
        Qrup üzrə paylaşılan materiallar (yalnız UI; yükləmə serverə qoşulanda əlavə olunacaq).
      </Typography>
      <Stack spacing={1.5}>
        {items.map((m) => (
          <Card key={m.id} variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                {m.type === 'pdf' ? <PictureAsPdfOutlinedIcon color="error" /> : null}
                {m.type === 'slide' ? <SlideshowOutlinedIcon color="primary" /> : null}
                {m.type === 'link' ? <LinkIcon color="info" /> : null}
                <Typography fontWeight={700}>{m.title}</Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small">
                  Bax
                </Button>
                <Button variant="contained" size="small" disabled={m.type === 'link'}>
                  Yüklə
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  )
}
