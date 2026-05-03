# POgrid — Next.js Export

Folder ini hasil konversi otomatis dari versi TanStack Start.

## Cara pakai

1. Buat project Next.js baru:
   ```bash
   npx create-next-app@latest pogrid-next --typescript --tailwind --app --src-dir=false --import-alias "@/*"
   ```

2. Salin isi folder ini ke root project Next.js (replace yang ada):
   - `app/`           → `app/`
   - `components/`    → `components/`
   - `lib/`           → `lib/`
   - `hooks/`         → `hooks/`
   - `app/globals.css` (replace)

3. Install dependency tambahan (lihat `package.json.reference`):
   ```bash
   npm i zustand immer date-fns clsx tailwind-merge class-variance-authority lucide-react tw-animate-css
   npm i @radix-ui/react-slot @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip
   ```

4. Jalankan: `npm run dev`

## Yang sudah diotomatisasi

- ✅ Route file flat-dot → folder `app/` Next convention (`pos.new.tsx` → `app/pos/new/page.tsx`, `po.$poId.tsx` → `app/po/[poId]/page.tsx`)
- ✅ `__root.tsx` → `app/layout.tsx` (metadata API Next)
- ✅ `<Link to="...">` → `<Link href="...">` (next/link)
- ✅ `useNavigate()` → `useRouter()` (next/navigation)
- ✅ `useRouterState` → `usePathname()`
- ✅ `Route.useParams()` → `useParams()`
- ✅ Tambah `"use client"` di file yang pakai hooks/event/zustand/localStorage
- ✅ Hapus `export const Route = createFileRoute(...)` dan `routeTree.gen.ts`
- ✅ `styles.css` → `app/globals.css`

## Yang mungkin perlu cek manual

- Beberapa link dinamis dengan params kompleks — pastikan template literal benar
- `useNavigate({ to, params })` dengan params dynamic — review hasil konversi
- `<Outlet />` (TanStack) → di Next pakai prop `children` di layout.tsx
- File `components/pg/layout-wrapper.tsx` masih pakai `useRouter` dari TanStack — sudah dikonversi tapi cek logika redirect
- `routeTree.gen.ts` & `router.tsx` tidak ikut diexport (Next auto-resolve route)
- Asset CSS dari shadcn (border styling, dll) tetap berfungsi karena Tailwind v4 sama persis
