# NokosKu — Marketplace Jual Nomor Virtual (Nokos)

Website jualan nomor virtual (nokos) lengkap dengan sistem **Login & Register
+ verifikasi email pakai kode OTP (via Nodemailer)**, halaman belanja publik,
dashboard user, dan **dashboard admin khusus untuk melihat data penjualan**.
Dibuat pakai **Node.js + Express + SQLite bawaan Node** (`node:sqlite`) —
tidak ada native module yang perlu di-compile, jadi aman dijalankan di
Termux/Android.

## Cara Menjalankan di Localhost

### 1. Pastikan Node.js versi 22.13 ke atas
```bash
node -v
```

### 2. Install dependency
```bash
npm install
```

### 3. (Opsional) Setting email
Salin `.env.example` jadi `.env`:
```bash
cp .env.example .env
```
Kalau `.env` dibiarkan kosong, sistem otomatis pakai **akun email uji coba
(Ethereal)** — kode verifikasi tetap bisa dilihat lewat link "preview" yang
muncul di terminal & di halaman verifikasi, tanpa perlu akun Gmail asli.
Kalau mau kirim ke email asli, isi `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` dst
di `.env` (lihat contoh komentar di dalam file).

### 4. Jalankan server
```bash
npm start
```
Buka **http://localhost:3000**

## Akun Demo

| Role  | Email               | Password  |
|-------|---------------------|-----------|
| Admin | admin@nokosku.id    | admin123  |
| User  | budi@example.com    | user123   |

## Alur Registrasi + Verifikasi Email

1. User isi form di `/register`
2. Sistem generate kode 6 digit, simpan ke database, kirim lewat **Nodemailer** (`mailer.js`)
3. User diarahkan ke `/verify` untuk memasukkan kode
4. Kalau di `.env` belum di-setting SMTP asli, halaman `/verify` akan menampilkan
   link **"Preview email"** — klik untuk lihat isi emailnya
5. Setelah kode benar, akun otomatis login dan `is_verified` di-set `1`
6. Bisa klik **"Kirim Ulang Kode"** kalau kode kedaluwarsa (10 menit)

## Daftar 14 Halaman

**Autentikasi (3)**
1. `/login` — Login
2. `/register` — Daftar akun
3. `/verify` — Verifikasi kode email

**Halaman Publik / Belanja (5)**
4. `/` — Beranda (hero, kategori, nokos rating tertinggi)
5. `/cari` — Katalog & filter nokos (kategori, negara, harga, rating)
6. `/nokos/:id` — Detail produk nokos
7. `/nokos/:id/beli` — Checkout / form pembelian
8. `/pembelian/:id/sukses` — Invoice / bukti pembelian

**Dashboard User (3)** — login sebagai role `user`
9. `/dashboard` — Ringkasan akun (total transaksi, total belanja, favorit)
10. `/riwayat` — Riwayat semua transaksi
11. `/favorit` — Nokos yang disimpan/favorit

**Dashboard Admin (3)** — login sebagai role `admin`, halaman lain otomatis diblokir (403)
12. `/admin` — **Data penjualan**: total revenue, grafik penjualan bulanan, produk terlaris, transaksi terbaru
13. `/admin/nokos` — Kelola produk nokos (tambah/hapus, banyak data)
14. `/admin/transaksi` — Kelola semua transaksi (ubah status) + data semua user pelanggan

## Struktur Folder

```
nokos-app/
├── server.js              # Setup Express, session, mount semua routes
├── database.js            # Skema SQLite + seed data (admin, user demo, banyak nokos)
├── mailer.js               # Setup Nodemailer (kirim kode verifikasi)
├── middleware/auth.js       # requireAuth, requireAdmin, redirectIfAuth
├── routes/
│   ├── auth.js              # login, register, verify, logout
│   ├── public.js            # home, cari, detail, checkout, sukses
│   ├── user.js               # dashboard, riwayat, favorit
│   └── admin.js               # dashboard admin, kelola nokos, kelola transaksi
├── views/                    # Semua halaman EJS (auth/, public/, user/, admin/, errors/)
├── public/css/                # style.css (dashboard) + public.css (halaman belanja)
└── data/app.db                # Database SQLite (otomatis dibuat & diisi data contoh)
```

## Kustomisasi

- **Ganti nama brand:** cari teks "NokosKu" di partials (`public-navbar.ejs`,
  `user-sidebar.ejs`, `admin-sidebar.ejs`) dan halaman auth.
- **Tambah data nokos manual:** login sebagai admin → menu **Kelola Nokos**.
- **Reset database:** hapus file `data/app.db`, nanti dibuat ulang otomatis
  (lengkap dengan akun demo & data nokos) saat server dijalankan lagi.
- **Ganti port:** `PORT=4000 npm start` atau set di `.env`.

## Catatan Penting

Aplikasi ini dibuat untuk keperluan belajar/demo. Sebelum dipakai untuk
transaksi sungguhan:
- Ganti `SESSION_SECRET` di `.env` dengan string acak yang panjang
- Gunakan SMTP asli (bukan mode Ethereal) supaya email verifikasi benar-benar terkirim ke user
- Tambahkan sistem pembayaran (payment gateway) yang sesungguhnya — saat ini status transaksi diubah manual oleh admin
- Pertimbangkan pindah ke PostgreSQL/MySQL kalau data sudah besar
