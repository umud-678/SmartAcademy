import { useTheme } from '@mui/material/styles'

/** Referans dizayna uyğun sadə flat illüstrasiya (CRM / təhsil mövzusu). */
export function LoginIllustration() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const primary = theme.palette.primary.main

  const skyStart = isDark ? '#0b1220' : '#F4F7FF'
  const skyEnd = isDark ? '#111827' : '#E4EBFF'
  const hillStart = isDark ? '#1e293b' : '#E8EEFC'
  const hillEnd = isDark ? '#312e81' : '#D4DDF8'
  const hill2 = isDark ? '#334155' : '#C8D4F6'
  const cardFill = isDark ? '#121c32' : '#fff'
  const cardStroke = isDark ? '#334155' : '#E2E8F6'
  const lineMuted = isDark ? '#475569' : '#E2E8F6'
  const screenFill = isDark ? '#1e293b' : '#EEF2FF'
  const lineSoft = isDark ? '#475569' : '#D4DDF8'

  return (
    <svg
      viewBox="0 0 520 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ width: '100%', maxWidth: 480, height: 'auto' }}
    >
      <defs>
        <linearGradient id="login-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hillStart} />
          <stop offset="100%" stopColor={hillEnd} />
        </linearGradient>
        <linearGradient id="login-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={skyStart} />
          <stop offset="100%" stopColor={skyEnd} />
        </linearGradient>
      </defs>
      <rect width="520" height="380" rx="24" fill="url(#login-sky)" />
      <path d="M0 260 Q130 200 260 240 T520 220 V380 H0Z" fill="url(#login-hill)" />
      <path d="M0 280 Q180 240 360 270 T520 250 V380 H0Z" fill={hill2} opacity={isDark ? 0.4 : 0.65} />

      <g transform="translate(320 48)">
        <rect x={0} y={0} width={168} height={200} rx={12} fill={cardFill} stroke={cardStroke} strokeWidth={2} />
        <rect x={14} y={16} width={100} height={10} rx={5} fill={primary} opacity={isDark ? 0.35 : 0.25} />
        <rect x={14} y={38} width={140} height={8} rx={4} fill={lineMuted} />
        <rect x={14} y={54} width={120} height={8} rx={4} fill={lineMuted} />
        <circle cx={28} cy={88} r={14} fill={primary} opacity={isDark ? 0.45 : 0.35} />
        <rect x={50} y={78} width={90} height={8} rx={4} fill={lineMuted} />
        <rect x={50} y={92} width={70} height={8} rx={4} fill={lineMuted} />
        <circle cx={28} cy={124} r={14} fill={primary} opacity={isDark ? 0.55 : 0.45} />
        <rect x={50} y={114} width={90} height={8} rx={4} fill={lineMuted} />
        <rect x={50} y={128} width={60} height={8} rx={4} fill={lineMuted} />
        <circle cx={28} cy={160} r={14} fill={primary} opacity={isDark ? 0.75 : 1} />
        <rect x={50} y={150} width={90} height={8} rx={4} fill={lineMuted} />
        <rect x={50} y={164} width={72} height={8} rx={4} fill={lineMuted} />
      </g>

      <g transform="translate(72 120)">
        <ellipse cx={96} cy={210} rx={88} ry={14} fill={primary} opacity={isDark ? 0.2 : 0.12} />
        <path d="M48 200c-4-60 24-108 72-108s76 48 72 108H48z" fill={primary} opacity={isDark ? 0.85 : 0.9} />
        <circle cx={120} cy={72} r={36} fill="#F5C6A5" />
        <path d="M88 76c8-20 56-20 64 0v8H88v-8z" fill="#2E2E2E" opacity={isDark ? 0.15 : 0.08} />
        <rect x={72} y={108} width={96} height={72} rx={12} fill={cardFill} stroke={cardStroke} strokeWidth={2} />
        <rect x={84} y={120} width={72} height={44} rx={6} fill={screenFill} />
        <rect x={88} y={128} width={36} height={6} rx={3} fill={primary} opacity={isDark ? 0.5 : 0.35} />
        <rect x={88} y={142} width={56} height={5} rx={2.5} fill={lineSoft} />
        <rect x={88} y={152} width={48} height={5} rx={2.5} fill={lineSoft} />
        <path d="M60 180l24-12 12 8 36-20 24 16v48H60v-40z" fill={primary} opacity={isDark ? 0.75 : 1} />
      </g>
    </svg>
  )
}
