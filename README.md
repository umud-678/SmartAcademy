# SmartAcademy

React (TypeScript) + Vite + MUI ilə qurulmuş tədris mərkəzi idarə paneli (admin, müəllim, tələbə rolları).

## Sistem rolları

| Rol | Əsas vəzifə |
|-----|-------------|
| **İdarəçi (admin)** | Tələbə, müəllim, qrup, kurs, ödəniş planı, istifadəçi hesabları — tam CRUD (lokal state). |
| **Müəllim** | Yalnız özünə təyin olunmuş qruplar, dərs cədvəli, davamiyyət, qiymət/qeyd (ödəniş və yeni tələbə yoxdur). |
| **Tələbə** | Profil məlumatları, davamiyyət və ödənişlər üçün əsasən **oxuma** interfeysi (məlumat admin/müəllim tərəfindən yazılır). |

## Admin → Müəllim → Tələbə data axını

1. **Admin** mərkəzi məlumatı yaradır: qruplar, tələbələr, müəllim təyinləri, dərs cədvəli, ödəniş taksitləri, güzəşt.  
2. **Müəllim** eyni məlumat bazasından yalnız **öz qruplarını** görür və davamiyyət / qiymət qeydləri əlavə edir.  
3. **Tələbə** (demo rejimdə) eyni bazadan özünə uyğun səhifələrə baxır; redaktə hüququ məhduddur.

Prod mühitdə bu axın **server API + JWT** ilə eyni prinsipdə təkrarlanmalıdır (hər rol yalnız icazə verilən endpoint-ləri çağırır).

## Autentifikasiya necə işləyir

- İstifadəçilər **admin “İstifadəçilər”** modulundakı `appUsers` siyahısındadırsa və **şifrə xəşi** düzgündürsə giriş mümkündür.  
- Sessiya **imzalı JWT** (HMAC) ilə saxlanılır; **müddət bitəndə** avtomatik çıxış (token yoxlaması dövrü ilə).  
- **Məni xatırla**: işarələnibsə token `localStorage`-da, deyilsə `sessionStorage`-da (brauzer sessiyası bitəndə çıxış).  
- **Çıxış** auth açarlarını təmizləyir; **CRM məlumatı** (`sa_admin_store_v2`) qəsdən saxlanılır — əks halda bütün məktəb datası silinərdi. Prod-da çıxış server sessiyasını da ləğv etməlidir.

**Mühit dəyişənləri:** `VITE_AUTH_JWT_SECRET` — istehsalda mütləq təyin edin.

Layihədə autentifikasiya backend davranışını simulyasiya edən lokal model üzərindən qurulub. İstifadəçilər yalnız sistemdə mövcud olduqda və şifrələri hash müqayisəsindən keçdikdə daxil ola bilirlər. JWT imzalanır və expiry yoxlanılır. Prod mühitdə bu məntiq server-side tətbiq olunmalıdır.

## Demo giriş (nümunə seed)

| E-poçt | Şifrə | Rol |
|--------|-------|-----|
| `admin@smartacademy.edu` | `demo` | İdarəçi |
| `ali.mammadov@smartacademy.edu` | `demo` | Müəllim |
| `leyla.ibrahimova@smartacademy.edu` | `demo` | Müəllim |
| `telebe@demo.edu` | `demo` | Tələbə |

Girişdən sonra əsas səhifələr: `/admin/dashboard`, `/teacher/dashboard`, `/student/profile`.

## Admin ümumi axtarış

Üst paneldə axtarış sahəsinə mətn yazıb **Enter**: uyğun tələbə / qrup / müəllim səhifəsinə keçid; «ödəniş», «taksit», «borc» kimi açar sözlərdə ödəniş panelinə yönləndirmə.

## Skriptlər

- `npm run dev` — inkişaf serveri  
- `npm run build` — prod yığımı  
- `npm run lint` — ESLint  

## Yol xəritəsi (qısa checklist)

Aşağıdakılar mentor siyahısının bir hissəsidir; layihədə hissə-hissə tamamlanır:

- [ ] Tam audit log UI (ödəniş audit-i var; ümumi “kim nə etdi” genişləndirilə bilər)  
- [ ] Tələbə statusu: Graduated + qrup transferi + timeline  
- [ ] Qrup: forming / completed + cədvəl toqquşması xəbərdarlığı  
- [ ] Hesabatlar: CSV/Excel export  
- [ ] Tələbə paneli: real məlumatla tam read-only sinxron  

Əsas şablon: [Vite + React + TS](https://vite.dev/).
