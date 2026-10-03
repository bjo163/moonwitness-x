# Rencana batas package Moonwitness

Status: usulan arsitektur dan checklist implementasi; belum ada migrasi kode.

## Keputusan yang disarankan

Tambahkan satu package terlebih dahulu: `@moonwitness/ui` di `packages/ui`. Pertahankan `types`, `sdk`, dan `database` yang sudah ada. Gunakan MUI yang sudah dipakai sebagai fondasi; pusatkan tema dan komponen dengan perilaku atau tampilan khusus Moonwitness. Pemakaian MUI langsung tetap dapat konsisten selama berada dalam tema bersama.

Package baru layak dibuat bila punya tanggung jawab jelas, dependensi yang bisa berdiri sendiri, dan konsumen atau siklus perubahan yang membenarkan biaya pemeliharaannya. Banyaknya folder maupun halaman bukan alasan yang cukup. Reusable pada tahap ini berarti bisa dipakai oleh aplikasi React web lain; dukungan React Native tidak otomatis tercapai.

## Dasar dari kode saat ini

- `pnpm-workspace.yaml` sudah mencakup `packages/*`; package UI belum ada.
- `apps/web/src/@core/theme/index.ts` menyediakan overrides, typography, spacing, shadows, dan color schemes, tetapi mengimpor `next/font/google` dan tipe settings aplikasi.
- `apps/web/src/components/theme/index.tsx` mencampur pembuatan tema, settings, deteksi mode, cache MUI untuk Next.js, dan RTL.
- `apps/web/src/components/Providers.tsx` menyusun auth, navigasi, settings dari cookie, tema, Redux, dan toast. Komposisi ini merupakan tanggung jawab aplikasi.
- `apps/web/src/@core/components/mui/TextField.tsx` adalah contoh kandidat ekstraksi yang konkret: komponen presentasi dengan styling khusus dan ketergantungan pada tema.
- `apps/web/src/@menu/components/RouterLink.tsx` memakai `next/link`; `@layouts/LayoutWrapper.tsx` membaca settings dan inisialisasi layout. Kedua folder belum bisa dianggap mandiri.
- `packages/types` berisi kontrak data astronomi; `packages/sdk` mengonsumsinya untuk HTTP client. `packages/database` mengekspor Prisma dan query domain, sehingga konsumsinya harus dibatasi ke server.

## Susunan yang dituju

```text
packages/
  ui/
    src/
      tokens/       # nilai desain dasar, tanpa React atau Next.js
      theme/        # factory tema MUI, overrides, dan augmentasi tipe
      components/   # komponen presentasi bersama yang sudah dibutuhkan
      styles/       # CSS bersama dengan entry eksplisit
  types/            # kontrak domain/API lintas konsumen
  sdk/              # HTTP client, bergantung pada types
  database/         # Prisma dan akses data server
apps/
  web/
    src/
      components/   # komposisi dan adapter aplikasi
      views/        # halaman/fitur dan integrasi data
      ...
```

Subpath publik yang diusulkan: `@moonwitness/ui/tokens`, `@moonwitness/ui/theme`, dan entry komponen terpilih seperti `@moonwitness/ui/text-field`. Tetapkan nama akhir setelah inventaris; jangan mengekspos `src/*` sebagai kontrak publik.

| Kandidat package                     | Keputusan saat ini                                     | Kapan dipisahkan                                                                                            |
| ------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `ui`                                 | Buat dahulu                                            | Tema dan komponen bersama sudah tersedia untuk diekstrak                                                    |
| `design-tokens`                      | Modul internal UI                                      | Ada konsumen non-React/non-MUI atau kebutuhan distribusi token terpisah                                     |
| `app-shell`                          | Tetap di web                                           | Aplikasi kedua membutuhkan navigasi/layout yang sama, setelah router dan settings bisa diinjeksi            |
| `charts`, `forms`, `data-table`      | Tetap dekat pemakai; pola generik kecil boleh masuk UI | Ada penggunaan berulang dengan kontrak stabil serta dependensi berat yang perlu dipisahkan                  |
| `typescript-config`, `eslint-config` | Evaluasi setelah UI terbentuk                          | Konfigurasi beberapa package sudah berulang dan dapat disatukan tanpa memaksakan aturan aplikasi ke library |
| `auth`, `i18n`                       | Tetap di web                                           | Ada konsumen kedua dan batas konfigurasi/server yang jelas                                                  |
| `utils`, `hooks`                     | Simpan di modul pemilik                                | Hanya ekstrak kapabilitas bernama jelas dengan beberapa konsumen; hindari penampung campuran                |

## Aturan dependensi dan konsistensi

Alur utama: `web → ui`, `web → sdk → types`, dan kode server `→ database`. UI tidak mengimpor aplikasi, SDK, database, atau kontrak astronomi. Tipe props UI tinggal bersama komponennya; `packages/types` tetap berfokus pada kontrak domain/API.

Font dimuat oleh aplikasi dan diteruskan ke factory tema melalui `fontFamily`. Factory menerima opsi tampilan eksplisit seperti mode, direction, skin, dan primary color; tidak membaca cookie atau settings aplikasi. Cache Next.js, auth, Redux, routing, penyimpanan preferensi, dan penentuan mode awal tetap dirangkai di web. Adapter menerjemahkan settings aplikasi ke opsi tema.

Komponen generik menerima data, callback, children, atau slot. Link yang membutuhkan router diberikan lewat adapter aplikasi. Kartu astronomi yang mengambil data sendiri tetap menjadi komponen fitur. Status loading dan error dapat memakai presentasi dari UI.

Konsistensi dimulai dari tokens, theme overrides, dan pola pemakaian yang terdokumentasi. Wrapper dibuat jika memberikan default, perilaku, aksesibilitas, atau komposisi bersama yang nyata. Jangan membuat ulang semua komponen MUI atau mengganti seluruh import MUI hanya demi keseragaman nama import.

## Checklist implementasi berurutan

### 1. Tentukan cakupan ekstraksi pertama

- [x] Catat kandidat beserta konsumen nyata, import aplikasi, CSS, aset/icon, dan kebutuhan provider.
- [x] Pilih tema serta 2–3 komponen yang sudah dipakai: CustomTextField, CustomAvatar, dan CustomChip.
- [ ] Pilih halaman konsumen representatif dan catat tampilan/perilaku awal sebagai pembanding.
- [x] Tetapkan API awal, entry publik, serta batas file client/server; token memiliki entry terpisah.

### 2. Siapkan package dan lepaskan ketergantungan aplikasi

- [x] Buat manifest private `@moonwitness/ui`, exports eksplisit, dan konfigurasi TypeScript mandiri.
- [x] Mulai dengan source TypeScript untuk konsumsi workspace; dokumentasikan bahwa distribusi eksternal memerlukan keputusan build terpisah.
- [x] Selaraskan peer dependencies React, React DOM, MUI, dan Emotion dengan versi aplikasi; sediakan dependency pengembangan yang diperlukan package.
- [x] Tambahkan dependency `workspace:*` di web dan konfigurasi transpilation package Next.js untuk source exports.
- [x] Ekstrak tokens, factory tema, overrides, dan augmentasi tipe MUI; pastikan deklarasi tipe ikut terjangkau konsumen.
- [x] Ubah font dan opsi tampilan menjadi input eksplisit; hilangkan alias aplikasi, pembacaan cookie, dan import Next.js dari UI.
- [x] Hubungkan factory tema ke web sambil mempertahankan cache SSR, RTL, mode awal, dan pengaturan pengguna.
- [x] Tetapkan entry styles; package belum membawa stylesheet, font, icon, atau kelas Tailwind sendiri.

### 3. Migrasikan irisan kecil sampai lengkap

- [x] Ekstrak komponen terpilih dengan props dan perilaku yang kompatibel; kebutuhan tema/provider terdokumentasi.
- [x] Ganti import pemakai menjadi subpath package UI.
- [x] Gunakan re-export dari lokasi lama menuju package untuk menjaga kompatibilitas; arah dependensi tetap satu arah.
- [x] Migrasikan pemakai yang ditemukan; import lama kini menjadi adapter re-export.
- [ ] Tambahkan pola bersama seperti empty state atau dialog hanya ketika kebutuhan berulang sudah ditemukan.

### 4. Validasi dan dokumentasi

- [x] Jalankan typecheck package dan aplikasi; keduanya lulus setelah dependency `@tanstack/table-core` disamakan dengan `@tanstack/react-table` (8.21.3).
- [ ] Selesaikan build produksi web. Next.js mengompilasi source, lalu worker TypeScript berhenti karena kehabisan memori pada mesin ini.
- [ ] Periksa halaman representatif pada light/dark, LTR/RTL, ukuran mobile/desktop, serta reload untuk memastikan SSR/hydration dan mode awal tetap benar.
- [ ] Periksa label, keyboard, focus, disabled/error state, dan interaksi komponen yang benar-benar dimigrasikan.
- [ ] Buktikan pemakaian UI dari contoh React tanpa alias web, router, auth, Redux, atau cookie aplikasi; contoh boleh berada di katalog komponen.
- [x] Dokumentasikan setup tema, entry CSS, props/varian, komposisi MUI langsung, serta pola adapter Next.js.
- [ ] Tambahkan pembatasan import agar UI tidak bergantung pada apps, sdk, database, atau domain types; jangan melarang semua import MUI.
- [ ] Catat komponen yang masih tertunda dan syarat pemisahan package berikutnya berdasarkan kebutuhan konsumen.

## Kriteria selesai tahap pertama

Package UI menyediakan tema dan komponen terpilih melalui API publik; web menggunakannya; tidak ada import balik ke aplikasi; hasil validasi tercatat; dan dokumentasi memungkinkan konsumen React lain memasangnya. Seluruh template tidak harus dipindahkan untuk menyelesaikan tahap ini. Perluasan package dilakukan setelah batas pertama terbukti bekerja.

## Status implementasi

- Package dan dokumentasi tersedia di `packages/ui`; tema MUI menerima opsi melalui factory dan font berasal dari aplikasi.
- Web memakai package itu untuk tema, TextField, Avatar, dan Chip. Import lama untuk tiga komponen tersebut menjadi re-export kompatibilitas.
- `pnpm --filter @moonwitness/ui typecheck` dan typecheck web berhasil. Build Next.js berhasil pada langkah compile, tetapi worker pemeriksa tipe kehabisan memori. Pemeriksaan visual browser dan aksesibilitas belum dilakukan.
- File tema lama di `apps/web/src/@core/theme` selain entry adapter belum dibersihkan; tidak ada import aplikasi yang memakainya dalam hasil pencarian source. Penghapusan file-file itu tertunda.
