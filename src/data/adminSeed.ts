import { AUTH_DEMO_PASSWORD_HASH_HEX } from '@/lib/authCredentials'
import type { AdminCourse, AdminGroup, AdminState, AdminStudent, AdminTeacher } from '@/types/admin'
import { buildEqualInstallments, finalCourseAmount } from '@/utils/installments'

function mkStudent(
  partial: Pick<
    AdminStudent,
    'id' | 'name' | 'email' | 'phone' | 'groupId' | 'status' | 'attendanceRate' | 'coursePriceAzn' | 'discountAzn' | 'discountReason'
  > &
    Partial<Pick<AdminStudent, 'discountReasonCode' | 'paymentPlanMode' | 'discountAppliedAt' | 'parentPhone'>> & {
      installmentMonths: number
      firstDue: string
      paidFirst?: boolean
    },
): AdminStudent {
  const fin = finalCourseAmount(partial.coursePriceAzn, partial.discountAzn)
  const installments = buildEqualInstallments(fin, partial.installmentMonths, partial.firstDue, 'pending')
  if (partial.paidFirst && installments[0]) {
    installments[0] = { ...installments[0], status: 'paid' }
  }
  return {
    id: partial.id,
    name: partial.name,
    email: partial.email,
    phone: partial.phone,
    parentPhone: partial.parentPhone?.trim() || '—',
    registeredAt: '2026-02-01',
    groupId: partial.groupId,
    status: partial.status,
    attendanceRate: partial.attendanceRate,
    coursePriceAzn: partial.coursePriceAzn,
    discountAzn: partial.discountAzn,
    discountReasonCode: partial.discountReasonCode ?? 'manual',
    discountReason: partial.discountReason,
    discountAppliedAt: partial.discountAppliedAt ?? null,
    paymentPlanMode: partial.paymentPlanMode ?? 'installments',
    installments,
    lessonLogs: [
      { id: `${partial.id}-l1`, date: '2026-04-28', lesson: 'React Hooks', status: 'present' },
      { id: `${partial.id}-l2`, date: '2026-05-01', lesson: 'TypeScript', status: partial.id === 's2' ? 'absent' : 'present' },
    ],
    gradeByGroupId: {},
    gradeHistoryByGroupId: {},
  }
}

function mkTeacher(
  id: string,
  name: string,
  email: string,
  lessonsTaught: number,
  pct: number,
  status: AdminTeacher['status'] = 'active',
): AdminTeacher {
  return { id, name, email, status, lessonsTaught, teacherAttendancePct: pct }
}

/** Nümunə: əlavə 35 tələbə (ümumi ~38), qruplara paylanır */
function seedExtraStudents(): AdminStudent[] {
  type Row = {
    id: string
    name: string
    groupId: string
    price: number
    n: number
    attendance: number
    status?: AdminStudent['status']
  }
  const rows: Row[] = [
    { id: 's4', name: 'Ayşən Quliyeva', groupId: 'g1', price: 5000, n: 4, attendance: 91 },
    { id: 's5', name: 'Cavid Nərimanov', groupId: 'g1', price: 5000, n: 5, attendance: 78 },
    { id: 's6', name: 'Dəniz İsmayılov', groupId: 'g1', price: 5000, n: 6, attendance: 85 },
    { id: 's7', name: 'Emin Rəhimov', groupId: 'g1', price: 5000, n: 7, attendance: 94 },
    { id: 's8', name: 'Fəridə Soltanova', groupId: 'g1', price: 5000, n: 8, attendance: 88 },
    { id: 's9', name: 'Günay Məlikzadə', groupId: 'g1', price: 5000, n: 9, attendance: 72 },
    { id: 's10', name: 'Həsən Zeynalov', groupId: 'g1', price: 5000, n: 10, attendance: 90 },
    { id: 's11', name: 'İlahə Vəlizadə', groupId: 'g1', price: 5000, n: 11, attendance: 96 },
    { id: 's12', name: 'Kamran Əhmədov', groupId: 'g1', price: 5000, n: 12, attendance: 81 },
    { id: 's13', name: 'Ləman Əmirova', groupId: 'g1', price: 5000, n: 13, attendance: 87 },
    { id: 's14', name: 'Murad Bağırov', groupId: 'g1', price: 5000, n: 14, attendance: 69 },
    { id: 's15', name: 'Nihad Cəfərov', groupId: 'g1', price: 5000, n: 15, attendance: 93 },
    { id: 's16', name: 'Ömər Dadaşov', groupId: 'g1', price: 5000, n: 16, attendance: 76 },
    { id: 's17', name: 'Pünhan Ələkbərov', groupId: 'g1', price: 5000, n: 17, attendance: 89 },
    { id: 's18', name: 'Qənirə Hüseynova', groupId: 'g1', price: 5000, n: 18, attendance: 95 },
    { id: 's19', name: 'Rüstəm İbrahimov', groupId: 'g1', price: 5000, n: 19, attendance: 82 },
    { id: 's20', name: 'Sevil Əsgərova', groupId: 'g1', price: 5000, n: 20, attendance: 74, status: 'suspended' },
    { id: 's21', name: 'Tural Məmmədov', groupId: 'g2', price: 1200, n: 21, attendance: 86 },
    { id: 's22', name: 'Ülviyyə Kərimova', groupId: 'g2', price: 1200, n: 22, attendance: 91 },
    { id: 's23', name: 'Vəfa Nəbiyeva', groupId: 'g2', price: 1200, n: 23, attendance: 79 },
    { id: 's24', name: 'Xəyal Əhmədov', groupId: 'g2', price: 1200, n: 24, attendance: 88 },
    { id: 's25', name: 'Yasin Orucov', groupId: 'g2', price: 1200, n: 25, attendance: 67 },
    { id: 's26', name: 'Zəhra Quliyeva', groupId: 'g2', price: 1200, n: 26, attendance: 92 },
    { id: 's27', name: 'Asif Tağıyev', groupId: 'g3', price: 1800, n: 27, attendance: 84 },
    { id: 's28', name: 'Bəxtiyar Mənsurov', groupId: 'g3', price: 1800, n: 28, attendance: 90 },
    { id: 's29', name: 'Cəmilə Rəhimova', groupId: 'g3', price: 1800, n: 29, attendance: 77 },
    { id: 's30', name: 'Davud Sadıqov', groupId: 'g3', price: 1800, n: 30, attendance: 83 },
    { id: 's31', name: 'Əsmər Fərmanova', groupId: 'g3', price: 1800, n: 31, attendance: 96 },
    { id: 's32', name: 'Fərhad Qasımov', groupId: 'g3', price: 1800, n: 32, attendance: 71 },
    { id: 's33', name: 'Günel Xanməmmədova', groupId: 'g4', price: 1500, n: 33, attendance: 89 },
    { id: 's34', name: 'Hikmət Yusifov', groupId: 'g4', price: 1500, n: 34, attendance: 80 },
    { id: 's35', name: 'İradə Məmmədova', groupId: 'g4', price: 1500, n: 35, attendance: 94 },
    { id: 's36', name: 'Ceyhun Əliyev', groupId: 'g4', price: 1500, n: 36, attendance: 86 },
    { id: 's37', name: 'Kənan Şıxəliyev', groupId: 'g5', price: 3200, n: 37, attendance: 88 },
    { id: 's38', name: 'Lamiyə Nəcəfova', groupId: 'g5', price: 3200, n: 38, attendance: 73 },
  ]
  return rows.map((r) =>
    mkStudent({
      id: r.id,
      name: r.name,
      email: `student${String(r.n).padStart(2, '0')}@mail.test`,
      phone: `+994501${String(10000 + r.n).padStart(6, '0')}`,
      parentPhone: `+994552${String(10000 + r.n).padStart(6, '0')}`,
      groupId: r.groupId,
      status: r.status ?? 'active',
      attendanceRate: r.attendance,
      coursePriceAzn: r.price,
      discountAzn: r.n % 7 === 0 ? 100 : 0,
      discountReason: r.n % 7 === 0 ? 'Kampaniya' : '',
      discountReasonCode: r.n % 7 === 0 ? 'campaign' : 'manual',
      installmentMonths: 5,
      firstDue: '2026-05-10',
      paidFirst: r.n % 11 === 0,
    }),
  )
}

/** Nümunə: Web Dizayner qrupu üçün 32 tələbə */
function seedWebDesignerStudents(): AdminStudent[] {
  const names = [
    'Umud Huseynov',
    'Aylin Mammadli',
    'Murad Aliyev',
    'Sevinc Quliyeva',
    'Ramil Hasanov',
    'Nigar Karimova',
    'Aydin Safarov',
    'Leman Ismayilova',
    'Orxan Mammadov',
    'Gunel Rahimova',
    'Kanan Abbasov',
    'Samira Huseynli',
    'Rashad Agayev',
    'Ayan Sultanova',
    'Tural Ahmadov',
    'Madina Aliyeva',
    'Elvin Rzayev',
    'Sona Jabbarli',
    'Elnur Ibrahimov',
    'Nurlana Asgarova',
    'Ferid Mammadli',
    'Afaq Talibova',
    'Nicat Hajiyev',
    'Rena Gurbanli',
    'Ilkin Karimli',
    'Aysel Mammadova',
    'Togrul Jalilov',
    'Arzu Bayramova',
    'Rauf Suleymanov',
    'Vusala Nabiyeva',
    'Emil Rustamov',
    'Lala Kazimova',
  ]
  return names.map((name, idx) => {
    const n = 100 + idx
    const id = `s${n}`
    const attendance = 74 + ((idx * 3) % 23)
    return mkStudent({
      id,
      name,
      email: `webdesigner${n}@mail.test`,
      phone: `+994507${String(10000 + n).padStart(6, '0')}`,
      parentPhone: `+994552${String(10000 + n).padStart(6, '0')}`,
      groupId: 'g6',
      status: 'active',
      attendanceRate: attendance,
      coursePriceAzn: 1700,
      discountAzn: idx % 8 === 0 ? 120 : 0,
      discountReason: idx % 8 === 0 ? 'Kampaniya' : '',
      discountReasonCode: idx % 8 === 0 ? 'campaign' : 'manual',
      installmentMonths: 4,
      firstDue: '2026-06-10',
      paidFirst: idx % 6 === 0,
    })
  })
}

export function seedAdminState(): AdminState {
  const courses: AdminCourse[] = [
    { id: 'c1', name: 'Full-Stack Web Development', duration: '6 ay', priceAzn: 5000, active: true, disabled: false },
    { id: 'c2', name: 'Əl ilə QA və test', duration: '3 ay', priceAzn: 1200, active: true, disabled: false },
    { id: 'c3', name: 'Python proqramlaşdırma', duration: '4 ay', priceAzn: 1800, active: true, disabled: false },
    { id: 'c4', name: 'Java & Spring Boot', duration: '5 ay', priceAzn: 3200, active: true, disabled: false },
    { id: 'c5', name: 'UI/UX dizayn', duration: '3 ay', priceAzn: 1500, active: true, disabled: false },
    { id: 'c6', name: 'Digital marketinq', duration: '2 ay', priceAzn: 900, active: true, disabled: false },
    { id: 'c7', name: 'Excel və ofis (biznes)', duration: '1 ay', priceAzn: 350, active: true, disabled: false },
    { id: 'c8', name: 'İngilis dili (Intermediate)', duration: '4 ay', priceAzn: 800, active: true, disabled: false },
    { id: 'c9', name: 'Data Science əsasları', duration: '4 ay', priceAzn: 2400, active: true, disabled: false },
    { id: 'c10', name: 'Mobil tətbiq (React Native)', duration: '4 ay', priceAzn: 2800, active: true, disabled: false },
    { id: 'c11', name: 'Node.js & REST API', duration: '3 ay', priceAzn: 2100, active: true, disabled: false },
    { id: 'c12', name: 'SQL və verilənlər bazası', duration: '2 ay', priceAzn: 950, active: true, disabled: false },
    { id: 'c13', name: 'Kibertəhlükəsizlik əsasları', duration: '3 ay', priceAzn: 1600, active: true, disabled: false },
    { id: 'c14', name: 'Layihə idarəetməsi (PM)', duration: '2 ay', priceAzn: 1100, active: true, disabled: false },
    { id: 'c15', name: 'Biznes analitika', duration: '3 ay', priceAzn: 1400, active: true, disabled: false },
    { id: 'c16', name: 'C# / .NET', duration: '5 ay', priceAzn: 3000, active: true, disabled: false },
    { id: 'c17', name: 'Vue.js & Nuxt', duration: '3 ay', priceAzn: 1900, active: true, disabled: false },
    { id: 'c18', name: 'Graphic Design (Adobe)', duration: '3 ay', priceAzn: 1300, active: true, disabled: false },
    { id: 'c19', name: 'DevOps (Docker, CI/CD)', duration: '3 ay', priceAzn: 2200, active: true, disabled: false },
    { id: 'c20', name: 'Soft skills və kommunikasiya', duration: '1 ay', priceAzn: 400, active: true, disabled: false },
    { id: 'c21', name: 'Figma ilə veb prototipləmə', duration: '2 ay', priceAzn: 750, active: true, disabled: false },
    { id: 'c22', name: 'Power BI və hesabatlar', duration: '2 ay', priceAzn: 850, active: true, disabled: false },
    { id: 'c23', name: 'React & TypeScript (irəli)', duration: '4 ay', priceAzn: 2600, active: true, disabled: false },
    { id: 'c24', name: 'Go proqramlaşdırma', duration: '3 ay', priceAzn: 2000, active: true, disabled: false },
    { id: 'c25', name: 'AWS və bulud əsasları', duration: '3 ay', priceAzn: 2300, active: true, disabled: false },
    { id: 'c26', name: 'Linux sistem administratorluğu', duration: '3 ay', priceAzn: 1700, active: true, disabled: false },
    { id: 'c27', name: 'Blender 3D və modelinq', duration: '4 ay', priceAzn: 1450, active: true, disabled: false },
    { id: 'c28', name: 'Motion dizayn (After Effects)', duration: '3 ay', priceAzn: 1250, active: true, disabled: false },
    { id: 'c29', name: 'Sosial media vizual dizayn', duration: '2 ay', priceAzn: 680, active: true, disabled: false },
    { id: 'c30', name: 'Blockchain və Web3 əsasları', duration: '2 ay', priceAzn: 1900, active: true, disabled: false },
    { id: 'c31', name: 'Rust proqramlaşdırma', duration: '3 ay', priceAzn: 2400, active: true, disabled: false },
    { id: 'c32', name: 'PHP & Laravel', duration: '3 ay', priceAzn: 1750, active: true, disabled: false },
    { id: 'c33', name: 'SEO və kontent strategiyası', duration: '2 ay', priceAzn: 720, active: true, disabled: false },
    { id: 'c34', name: 'Kotlin — Android tətbiq', duration: '4 ay', priceAzn: 2650, active: true, disabled: false },
    { id: 'c35', name: 'Swift — iOS tətbiq', duration: '4 ay', priceAzn: 2700, active: true, disabled: false },
    { id: 'c36', name: 'MongoDB və NoSQL', duration: '2 ay', priceAzn: 980, active: true, disabled: false },
    { id: 'c37', name: 'AI: prompt və məhsuldarlıq', duration: '1 ay', priceAzn: 550, active: true, disabled: false },
    { id: 'c38', name: 'Şəbəkə əsasları (CCNA səviyyə)', duration: '4 ay', priceAzn: 1850, active: true, disabled: false },
    { id: 'c39', name: '1C: Mühasibatlıq', duration: '2 ay', priceAzn: 620, active: true, disabled: false },
    { id: 'c40', name: 'IT Helpdesk və texniki dəstək', duration: '2 ay', priceAzn: 580, active: true, disabled: false },
    { id: 'c41', name: 'Əl ilə eskiz və rəsm əsasları', duration: '3 ay', priceAzn: 890, active: true, disabled: false },
    { id: 'c42', name: 'Brendinq və korporativ üslub', duration: '2 ay', priceAzn: 1100, active: true, disabled: false },
    { id: 'c43', name: '3ds Max — interyer vizualizasiyası', duration: '3 ay', priceAzn: 1380, active: true, disabled: false },
    { id: 'c44', name: 'Ruby on Rails', duration: '3 ay', priceAzn: 1980, active: true, disabled: false },
    { id: 'c45', name: 'Kubernetes və konteynerlər', duration: '2 ay', priceAzn: 2150, active: true, disabled: false },
    { id: 'c46', name: 'Web Dizayner', duration: '4 ay', priceAzn: 1700, active: true, disabled: false },
  ]

  const teachers: AdminTeacher[] = [
    mkTeacher('t1', 'A. Məmmədov', 'ali.mammadov@smartacademy.edu', 42, 96),
    mkTeacher('t2', 'L. İbrahimova', 'leyla.ibrahimova@smartacademy.edu', 28, 88),
    mkTeacher('t3', 'N. Qasımov', 'nurlan.qasimov@smartacademy.edu', 35, 92),
    mkTeacher('t4', 'G. Əlizadə', 'gunay.elizade@smartacademy.edu', 22, 90),
    mkTeacher('t5', 'E. Hüseynov', 'elshan.huseynov@smartacademy.edu', 31, 94),
    mkTeacher('t6', 'S. Rəhimli', 'sebine.rahimli@smartacademy.edu', 19, 87),
    mkTeacher('t7', 'V. Tağızadə', 'vuqar.tagizade@smartacademy.edu', 26, 91),
    mkTeacher('t8', 'M. Cəfərova', 'maryam.jafarova@smartacademy.edu', 24, 89),
    mkTeacher('t9', 'Həmidə Bədəlli', 'hemide.bedelli@smartacademy.edu', 18, 93),
  ]

  const webDesignerStudents = seedWebDesignerStudents()

  const groups: AdminGroup[] = [
    {
      id: 'g1',
      name: 'FS-2026-A',
      courseId: 'c1',
      teacherId: 't1',
      maxStudents: 32,
      studentIds: ['s1', 's2', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12', 's13', 's14', 's15', 's16', 's17', 's18', 's19', 's20'],
      status: 'active',
      schedule: [
        { id: 'sl1', days: [1], start: '10:00', end: '12:00', room: '204' },
        { id: 'sl1b', days: [3], start: '18:00', end: '20:00', room: 'Online' },
      ],
    },
    {
      id: 'g2',
      name: 'QA-2026-B',
      courseId: 'c2',
      teacherId: 't2',
      maxStudents: 12,
      studentIds: ['s3', 's21', 's22', 's23', 's24', 's25', 's26'],
      status: 'active',
      schedule: [{ id: 'sl2', days: [5], start: '10:00', end: '12:00', room: '301' }],
    },
    {
      id: 'g3',
      name: 'PY-2026-A',
      courseId: 'c3',
      teacherId: 't3',
      maxStudents: 14,
      studentIds: ['s27', 's28', 's29', 's30', 's31', 's32'],
      status: 'active',
      schedule: [{ id: 'sl3', days: [2], start: '19:00', end: '21:00', room: 'Online' }],
    },
    {
      id: 'g4',
      name: 'UX-2026-A',
      courseId: 'c5',
      teacherId: 't4',
      maxStudents: 12,
      studentIds: ['s33', 's34', 's35', 's36'],
      status: 'active',
      schedule: [{ id: 'sl4', days: [4], start: '17:00', end: '19:00', room: '205' }],
    },
    {
      id: 'g5',
      name: 'JAVA-2026-A',
      courseId: 'c4',
      teacherId: 't5',
      maxStudents: 15,
      studentIds: ['s37', 's38'],
      status: 'active',
      schedule: [{ id: 'sl5', days: [1, 3], start: '18:30', end: '20:30', room: 'Online' }],
    },
    {
      id: 'g6',
      name: 'WD-2026-A',
      courseId: 'c46',
      teacherId: 't9',
      maxStudents: 32,
      studentIds: webDesignerStudents.map((s) => s.id),
      status: 'active',
      schedule: [
        { id: 'sl6a', days: [2], start: '19:00', end: '21:00', room: '203' },
        { id: 'sl6b', days: [6], start: '11:00', end: '13:00', room: 'Design Lab' },
      ],
    },
  ]

  const students: AdminStudent[] = [
    mkStudent({
      id: 's1',
      name: 'Nərgiz Əliyeva',
      email: 'nargiz@mail.test',
      phone: '+994501112233',
      parentPhone: '+994551112233',
      groupId: 'g1',
      status: 'active',
      attendanceRate: 92,
      coursePriceAzn: 5000,
      discountAzn: 500,
      discountReason: 'Erkən qeydiyyat endirimi',
      discountReasonCode: 'early',
      discountAppliedAt: '2026-02-01',
      installmentMonths: 5,
      firstDue: '2026-05-01',
      paidFirst: true,
    }),
    mkStudent({
      id: 's2',
      name: 'Rəşad Həsənov',
      email: 'rashad@mail.test',
      phone: '+994502223344',
      parentPhone: '+994552223344',
      groupId: 'g1',
      status: 'suspended',
      attendanceRate: 54,
      coursePriceAzn: 5000,
      discountAzn: 0,
      discountReason: '',
      discountReasonCode: 'manual',
      installmentMonths: 5,
      firstDue: '2026-04-01',
    }),
    mkStudent({
      id: 's3',
      name: 'Leyla Kərimova',
      email: 'leylak@mail.test',
      phone: '+994553334455',
      parentPhone: '+994553334466',
      groupId: 'g2',
      status: 'active',
      attendanceRate: 88,
      coursePriceAzn: 1200,
      discountAzn: 100,
      discountReason: 'Korporativ',
      discountReasonCode: 'campaign',
      installmentMonths: 3,
      firstDue: '2026-06-01',
      paidFirst: true,
    }),
    ...seedExtraStudents(),
    ...webDesignerStudents,
  ]

  const appUsers: AdminState['appUsers'] = [
    { id: 'u1', role: 'admin', email: 'admin@smartacademy.edu', active: true, passwordHash: AUTH_DEMO_PASSWORD_HASH_HEX, passwordTemporary: false },
    {
      id: 'u2',
      role: 'teacher',
      email: 'ali.mammadov@smartacademy.edu',
      active: true,
      passwordHash: AUTH_DEMO_PASSWORD_HASH_HEX,
      passwordTemporary: true,
    },
    {
      id: 'u3',
      role: 'teacher',
      email: 'leyla.ibrahimova@smartacademy.edu',
      active: true,
      passwordHash: AUTH_DEMO_PASSWORD_HASH_HEX,
      passwordTemporary: true,
    },
    {
      id: 'u6',
      role: 'teacher',
      email: 'hemide.bedelli@smartacademy.edu',
      active: true,
      passwordHash: AUTH_DEMO_PASSWORD_HASH_HEX,
      passwordTemporary: true,
    },
    { id: 'u4', role: 'student', email: 'telebe@demo.edu', active: true, passwordHash: AUTH_DEMO_PASSWORD_HASH_HEX, passwordTemporary: true },
    /** Tələbə kartı ilə eyni e-poçt — telefonla giriş nümunəsi (+994501112233, şifrə demo). */
    { id: 'u5', role: 'student', email: 'nargiz@mail.test', active: true, passwordHash: AUTH_DEMO_PASSWORD_HASH_HEX, passwordTemporary: true },
  ]

  const notifications: AdminState['notifications'] = [
    { id: 'n1', message: '2 ödəniş gecikmədədir', read: false },
    { id: 'n2', message: 'Yeni qrup sorğusu: FS-2026-C', read: true },
  ]

  return { courses, groups, students, teachers, appUsers, notifications, paymentAuditLog: [] }
}
