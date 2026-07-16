# NokosKu — Marketplace Jual Nomor Virtual (Nokos)

Website jualan nomor virtual (nokos) lengkap dengan sistem **Login & Register + verifikasi email pakai kode OTP (via Nodemailer)**, halaman belanja publik, dashboard user dengan topup saldo QRIS, dan **dashboard admin khusus untuk melihat data penjualan & kelola topup**. Dibuat pakai **Node.js + Express + SQLite bawaan Node** (`node:sqlite`) — tidak ada native module yang perlu di-compile, jadi aman dijalankan di Termux/Android.

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
Kalau `.env` dibiarkan kosong, sistem otomatis pakai **akun email uji coba (Ethereal)** — kode verifikasi tetap bisa dilihat lewat link "preview" yang muncul di terminal & di halaman verifikasi, tanpa perlu akun Gmail asli. Kalau mau kirim ke email asli, isi `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` dst di `.env` (lihat contoh komentar di dalam file).

### 4. Jalankan server
```bash
npm start
```
Buka **http://localhost:4000**

## Akun Demo

| Role  | Email               | Password  | Saldo   |
|-------|---------------------|-----------|---------|
| Admin | admin@nokosku.id    | admin123  | -       |
| User  | budi@example.com    | user123   | Rp 50rb |

## Alur Registrasi + Verifikasi Email

1. User isi form di `/register`
2. Sistem generate kode 6 digit, simpan ke database, kirim lewat **Nodemailer** (`mailer.js`)
3. User diarahkan ke `/verify` untuk memasukkan kode
4. Kalau di `.env` belum di-setting SMTP asli, halaman `/verify` akan menampilkan link **"Preview email"** — klik untuk lihat isi emailnya
5. Setelah kode benar, akun otomatis login dan `is_verified` di-set `1`
6. Bisa klik **"Kirim Ulang Kode"** kalau kode kedaluwarsa (10 menit)

## Alur Topup Saldo (Fitur Baru)

1. User login → klik **"Topup"** di menu sidebar
2. Pilih nominal topup atau masukkan jumlah custom (Rp 10rb - Rp 5jt)
3. Sistem membuat request topup & arahkan ke halaman pembayaran QRIS
4. User scan QRIS dengan aplikasi perbankan/e-wallet
5. User konfirmasi pembayaran & submit form ke admin
6. Admin verifikasi di halaman `/admin/topup` → klik **Approve** → saldo otomatis masuk ke akun user + notifikasi dikirim
7. User bisa lihat riwayat topup di `/topup-history`

## Daftar 31+ Halaman

### Autentikasi (3)
1. `/login` — Login
2. `/register` — Daftar akun
3. `/verify` — Verifikasi kode email

### Halaman Publik / Belanja (8)
4. `/` — Beranda (hero, kategori, nokos rating tertinggi)
5. `/cari` — Katalog & filter nokos (kategori, negara, harga, rating)
6. `/nokos/:id` — Detail produk nokos (dengan reviews)
7. `/nokos/:id/beli` — Checkout / form pembelian
8. `/pembelian/:id/sukses` — Invoice / bukti pembelian
9. `/tentang` — Tentang NokosKu
10. `/bantuan` — Bantuan & Support + FAQ
11. `/promo` — Promo & Penawaran Spesial

### Informasi (3)
12. `/syarat-ketentuan` — Syarat & Ketentuan
13. `/kebijakan-privasi` — Kebijakan Privasi
14. (Dinamis berdasarkan data)

### Dashboard User (7)
15. `/dashboard` — Ringkasan akun (total transaksi, total belanja, favorit, saldo)
16. `/riwayat` — Riwayat semua transaksi
17. `/favorit` — Nokos yang disimpan/favorit
18. `/topup` — Topup saldo (pilih nominal atau custom)
19. `/topup/:id/pembayaran` — Halaman pembayaran QRIS
20. `/topup-history` — Riwayat topup
21. `/profil` — Edit profil & ganti password
22. `/notifikasi` — Notifikasi sistem
23. `/transaksi` — Riwayat transaksi & balance history

### Dashboard Admin (9+)
24. `/admin` — Dashboard (data penjualan, grafik, produk terlaris, transaksi terbaru)
25. `/admin/nokos` — Kelola produk nokos (tambah/hapus, banyak data)
26. `/admin/transaksi` — Kelola semua transaksi (ubah status) + data pelanggan
27. `/admin/topup` — Kelola request topup (filter status, approve/reject dengan notifikasi)
28. `/admin/analytics` — Analytics & laporan (daily sales, category stats)
29. `/admin/settings` — Pengaturan sistem
30. (Error pages: 404, 403)

### API/Routes Tambahan
- `/nokos/:id/reviews` — GET reviews (JSON)
- `/nokos/:id/review` — POST review
- Sistem notifikasi otomatis untuk topup approved/rejected

## Struktur Folder

```
nokos-app/
├── server.js              # Setup Express, session, mount semua routes
├── database.js            # Skema SQLite + 9 tables (users, nokos, orders, favorites, topup_requests, topup_history, user_transactions, reviews, user_notifications)
├── mailer.js              # Setup Nodemailer (kirim kode verifikasi)
├── middleware/auth.js     # requireAuth, requireAdmin, redirectIfAuth
├── routes/
│   ├── auth.js            # login, register, verify, logout
│   ├── public.js          # home, cari, detail, checkout, sukses
│   ├── user.js            # dashboard, riwayat, favorit
│   ├── admin.js           # dashboard admin, kelola nokos, kelola transaksi
│   ├── topup.js           # topup request, payment, history
│   ├── admin-topup.js     # admin kelola topup (approve/reject)
│   ├── user-profile.js    # profil, notifikasi, transaksi history
│   ├── admin-analytics.js # analytics & laporan
│   ├── admin-settings.js  # pengaturan sistem
│   ├── reviews.js         # reviews API
│   ├── support.js         # halaman bantuan & support form
│   ├── about.js           # tentang, syarat, privacy
│   └── promo.js           # halaman promo
├── views/                 # Semua halaman EJS (auth/, public/, user/, admin/, errors/)
├── public/
│   ├── css/
│   │   ├── style.css      # Dashboard styling
│   │   └── public.css     # Halaman publik styling
│   ├── js/
│   │   └── app.js         # Frontend logic
│   └── qris.jpg           # QRIS payment image
└── data/app.db            # Database SQLite (otomatis dibuat & diisi data)
```

## Database Tables

- **users** — id, name, email, password, role, is_verified, balance, phone, avatar_seed, created_at
- **nokos** — id, name, country, provider, category, number_format, price, stock, description, rating, image_seed, created_at
- **orders** — id, user_id, nokos_id, quantity, total_price, status, payment_method, invoice_number, created_at
- **favorites** — id, user_id, nokos_id, created_at
- **topup_requests** — id, user_id, amount, status, payment_proof, notes, admin_notes, created_at, updated_at
- **topup_history** — id, user_id, amount, status, request_id, created_at
- **user_transactions** — id, user_id, type, amount, description, balance_before, balance_after, created_at
- **reviews** — id, user_id, nokos_id, rating, comment, created_at
- **user_notifications** — id, user_id, title, message, type, is_read, created_at

## Fitur Utama

### User
- ✅ Login & Register dengan verifikasi email OTP
- ✅ Topup saldo dengan QRIS (Rp 10rb - Rp 5jt)
- ✅ Beli nomor virtual dengan saldo
- ✅ Favorit nomor
- ✅ Review & rating
- ✅ Lihat riwayat transaksi & topup
- ✅ Edit profil & ganti password
- ✅ Notifikasi sistem real-time
- ✅ Support/bantuan

### Admin
- ✅ Dashboard dengan analytics
- ✅ Kelola produk nokos (tambah/hapus)
- ✅ Kelola order status
- ✅ Approve/reject topup request
- ✅ Lihat laporan penjualan harian & per kategori
- ✅ Pengaturan sistem

## Kustomisasi

- **Ganti nama brand:** cari teks "NokosKu" di partials (`public-navbar.ejs`, `user-sidebar.ejs`, `admin-sidebar.ejs`) dan halaman auth
- **Ganti QRIS image:** ganti file `/public/qris.jpg` dengan gambar QRIS Anda
- **Tambah data nokos manual:** login sebagai admin → menu **Kelola Nokos**
- **Reset database:** hapus file `data/app.db`, nanti dibuat ulang otomatis saat server dijalankan lagi
- **Ganti port:** `PORT=4000 npm start` atau set di `.env`

## Catatan Penting

Aplikasi ini dibuat untuk keperluan belajar/demo. Sebelum dipakai untuk transaksi sungguhan:
- Ganti `SESSION_SECRET` di `.env` dengan string acak yang panjang
- Gunakan SMTP asli (bukan mode Ethereal) supaya email verifikasi benar-benar terkirim ke user
- Tambahkan sistem pembayaran (payment gateway) yang sesungguhnya untuk topup (saat ini manual approve admin)
- Implement webhook untuk verifikasi pembayaran otomatis
- Pertimbangkan pindah ke PostgreSQL/MySQL kalau data sudah besar
- Pastikan QRIS image di `/public/qris.jpg` adalah milik Anda sendiri

## Teknologi

- **Backend:** Node.js, Express.js
- **Database:** SQLite (node:sqlite)
- **Frontend:** EJS, CSS3, Vanilla JavaScript
- **Authentication:** bcryptjs, express-session
- **Email:** Nodemailer
- **No dependencies:** Tidak menggunakan native modules, aman di Termux
