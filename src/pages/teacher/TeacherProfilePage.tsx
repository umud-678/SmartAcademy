import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminData } from '@/contexts/AdminDataContext'
import { formatGroupScheduleSlots } from '@/lib/teacherPanelUtils'
import { courseNameForGroup, resolveTeacherIdByEmail, teacherActiveGroups, teacherAssignedStudentRows } from '@/lib/teacherScope'

const prefsKey = (email: string) => `sa_teacher_prefs_${email.toLowerCase()}`
const boardKey = (email: string) => `sa_teacher_student_board_${email.toLowerCase()}`

type Prefs = { emailLessons: boolean; emailAttendance: boolean }

type StudentBoard = Record<string, { text: string; updatedAt: string }>

function loadPrefs(email: string): Prefs {
  try {
    const raw = localStorage.getItem(prefsKey(email))
    if (!raw) return { emailLessons: true, emailAttendance: true }
    return { ...{ emailLessons: true, emailAttendance: true }, ...JSON.parse(raw) }
  } catch {
    return { emailLessons: true, emailAttendance: true }
  }
}

function loadBoard(email: string): StudentBoard {
  try {
    const raw = localStorage.getItem(boardKey(email))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as StudentBoard
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveBoard(email: string, board: StudentBoard) {
  localStorage.setItem(boardKey(email), JSON.stringify(board))
}

export function TeacherProfilePage() {
  const { user } = useAuth()
  const email = user?.email?.trim()

  if (!email) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={900}>
          Profil
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Giriş tələb olunur.
        </Typography>
      </Stack>
    )
  }

  return <TeacherProfileInner key={email} email={email} />
}

function TeacherProfileInner({ email }: { email: string }) {
  const { state } = useAdminData()
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs(email))
  const [board, setBoard] = useState<StudentBoard>(() => loadBoard(email))
  const [search, setSearch] = useState('')
  const [noteDialog, setNoteDialog] = useState<{ studentId: string; name: string } | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const teacherId = useMemo(() => resolveTeacherIdByEmail(state, email), [state, email])

  const teacher = useMemo(() => (teacherId ? state.teachers.find((t) => t.id === teacherId) : undefined), [state.teachers, teacherId])
  const groups = useMemo(() => (teacherId ? teacherActiveGroups(state, teacherId) : []), [state, teacherId])

  const assignedRows = useMemo(() => (teacherId ? teacherAssignedStudentRows(state, teacherId) : []), [state, teacherId])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return assignedRows
    return assignedRows.filter(
      ({ student, groupName }) =>
        student.name.toLowerCase().includes(q) ||
        (student.email ?? '').toLowerCase().includes(q) ||
        groupName.toLowerCase().includes(q),
    )
  }, [assignedRows, search])

  const savePrefs = () => {
    localStorage.setItem(prefsKey(email), JSON.stringify(prefs))
    enqueueSnackbar('Bildiriş ayarları saxlanıldı (bu cihazda)', { variant: 'success' })
  }

  const openNote = (studentId: string, name: string) => {
    setNoteDraft(board[studentId]?.text ?? '')
    setNoteDialog({ studentId, name })
  }

  const saveNote = () => {
    if (!noteDialog) return
    const text = noteDraft.trim()
    const next: StudentBoard = { ...board }
    if (!text) {
      delete next[noteDialog.studentId]
    } else {
      next[noteDialog.studentId] = { text, updatedAt: new Date().toISOString() }
    }
    setBoard(next)
    saveBoard(email, next)
    setNoteDialog(null)
    enqueueSnackbar(text ? 'Qeyd saxlanıldı' : 'Qeyd silindi', { variant: 'success' })
  }

  if (!teacherId || !teacher) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={900}>
          Profil
        </Typography>
        <Typography variant="body2" color="text.secondary">
          E-poçt admin siyahısındakı müəllimlə uyğun gəlmir. Nümunə: <b>ali.mammadov@smartacademy.edu</b>
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={900}>
        Profil
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={900} gutterBottom>
            Şəxsi məlumat
          </Typography>
          <Typography variant="body2">
            Ad Soyad: <b>{teacher.name}</b>
          </Typography>
          <Typography variant="body2">
            E-poçt: <b>{teacher.email}</b>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Giriş e-poçtu tətbiq tərəfindən idarə olunur; burada yalnız baxış.
          </Typography>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography fontWeight={900} gutterBottom>
                Təyin olunmuş tələbələrim
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Öz qruplarınızdakı tələbələr: qrupa keçin, şəxsi qeyd və ya mesaj yazın (yalnız bu brauzerdə saxlanılır; real mesajlaşma üçün server tərəfi lazımdır).
              </Typography>
              <TextField
                size="small"
                placeholder="Ad, e-poçt və ya qrup üzrə axtar…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                sx={{ maxWidth: 420 }}
              />
            </Box>

            {filteredRows.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {assignedRows.length === 0 ? 'Bu müəllimə təyin olunmuş tələbə yoxdur.' : 'Axtarışa uyğun tələbə tapılmadı.'}
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tələbə</TableCell>
                    <TableCell>Qrup</TableCell>
                    <TableCell>Kurs</TableCell>
                    <TableCell>Vəziyyət</TableCell>
                    <TableCell align="right">Davamiyyət</TableCell>
                    <TableCell>Şəxsi qeyd</TableCell>
                    <TableCell align="right">Əməliyyat</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map(({ student, groupId, groupName }) => {
                    const snippet = board[student.id]?.text?.trim()
                    const course = courseNameForGroup(state, groupId)
                    return (
                      <TableRow key={`${student.id}-${groupId}`} hover>
                        <TableCell>
                          <Typography fontWeight={700}>{student.name}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {student.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{groupName}</TableCell>
                        <TableCell sx={{ maxWidth: 160 }}>{course}</TableCell>
                        <TableCell>
                          <StatusBadge
                            label={student.status === 'active' ? 'Aktiv' : 'Dayandırılıb'}
                            tone={student.status === 'active' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="right">{student.attendanceRate}%</TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {snippet ? snippet : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap">
                            <Button
                              size="small"
                              component={RouterLink}
                              to={`/teacher/groups/${groupId}`}
                              endIcon={<OpenInNewOutlinedIcon sx={{ fontSize: 16 }} />}
                              sx={{ textTransform: 'none' }}
                            >
                              Qrup
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditNoteOutlinedIcon />}
                              onClick={() => openNote(student.id, student.name)}
                              sx={{ textTransform: 'none' }}
                            >
                              Qeyd
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={900} gutterBottom>
            Təyin olunmuş qruplar
          </Typography>
          <Stack spacing={1}>
            {groups.map((g) => (
              <Box key={g.id}>
                <Typography fontWeight={800}>{g.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatGroupScheduleSlots(g)}
                </Typography>
              </Box>
            ))}
            {groups.length === 0 ? <Typography variant="body2">Qrup yoxdur.</Typography> : null}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={900} gutterBottom>
            Təhlükəsizlik
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Parol dəyişmək üçün ayrıca Ayarlar səhifəsinə keçin.
          </Typography>
          <Button component={RouterLink} to="/teacher/settings" variant="outlined" sx={{ textTransform: 'none' }}>
            Ayarlara keç
          </Button>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={900} gutterBottom>
            Bildirişlər (lokal nümunə)
          </Typography>
          <FormControlLabel
            control={<Switch checked={prefs.emailLessons} onChange={(e) => setPrefs((p) => ({ ...p, emailLessons: e.target.checked }))} />}
            label="Bu günkü / sabahkı dərslər"
          />
          <FormControlLabel
            control={<Switch checked={prefs.emailAttendance} onChange={(e) => setPrefs((p) => ({ ...p, emailAttendance: e.target.checked }))} />}
            label="Davamiyyət xəbərdarlıqları"
          />
          <Button variant="contained" onClick={savePrefs} sx={{ mt: 2, textTransform: 'none', fontWeight: 800 }}>
            Ayarları saxla
          </Button>
        </CardContent>
      </Card>

      <Dialog open={Boolean(noteDialog)} onClose={() => setNoteDialog(null)} fullWidth maxWidth="sm">
        {noteDialog ? (
          <>
            <DialogTitle sx={{ fontWeight: 900 }}>Şəxsi qeyd — {noteDialog.name}</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Bu mətn yalnız sizin brauzerinizdə saxlanılır (məsələn, növbəti dərs üçün xatırlatma, valideynlə danışılacaq mövzu). Tələbə və ya admin avtomatik görmür.
              </Typography>
              <TextField
                label="Qeyd / mesaj"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                fullWidth
                multiline
                minRows={4}
                placeholder="Məsələn, növbəti həftə layihə təqdimi, əlavə tapşırıq…"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setNoteDialog(null)} sx={{ textTransform: 'none' }}>
                Ləğv
              </Button>
              <Button color="error" variant="text" onClick={() => setNoteDraft('')} sx={{ textTransform: 'none' }}>
                Mətni təmizlə
              </Button>
              <Button variant="contained" onClick={saveNote} sx={{ textTransform: 'none', fontWeight: 800 }}>
                Saxla
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Stack>
  )
}
