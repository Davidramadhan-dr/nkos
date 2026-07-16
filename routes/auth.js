const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../database");
const { sendVerificationEmail } = require("../mailer");
const { redirectIfAuth } = require("../middleware/auth");

const router = express.Router();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
}

/* ---------- REGISTER ---------- */
router.get("/register", redirectIfAuth, (req, res) => {
  res.render("auth/register", { error: null, old: {} });
});

router.post("/register", redirectIfAuth, async (req, res) => {
  const { name, email, password, confirm_password } = req.body;

  if (!name || !email || !password || !confirm_password) {
    return res.render("auth/register", { error: "Semua kolom wajib diisi.", old: req.body });
  }
  if (password !== confirm_password) {
    return res.render("auth/register", { error: "Password dan konfirmasi tidak sama.", old: req.body });
  }
  if (password.length < 6) {
    return res.render("auth/register", { error: "Password minimal 6 karakter.", old: req.body });
  }

  const existing = db.prepare("SELECT id, is_verified FROM users WHERE email = ?").get(email);
  if (existing && existing.is_verified) {
    return res.render("auth/register", { error: "Email sudah terdaftar. Silakan login.", old: req.body });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const code = generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  let userId;
  if (existing) {
    // Sudah pernah daftar tapi belum verifikasi -> update data & kirim ulang kode
    db.prepare(
      "UPDATE users SET name = ?, password = ?, verification_code = ?, verification_expires = ? WHERE id = ?"
    ).run(name, hashed, code, expires, existing.id);
    userId = existing.id;
  } else {
    const info = db
      .prepare(
        "INSERT INTO users (name, email, password, verification_code, verification_expires) VALUES (?, ?, ?, ?, ?)"
      )
      .run(name, email, hashed, code, expires);
    userId = info.lastInsertRowid;
  }

  const result = await sendVerificationEmail(email, name, code);

  req.session.pendingEmail = email;
  req.session.previewUrl = result.previewUrl || null;

  res.redirect("/verify");
});

/* ---------- VERIFY EMAIL ---------- */
router.get("/verify", (req, res) => {
  if (!req.session.pendingEmail) return res.redirect("/register");
  res.render("auth/verify", {
    error: null,
    email: req.session.pendingEmail,
    previewUrl: req.session.previewUrl || null,
    info: null,
  });
});

router.post("/verify", (req, res) => {
  const email = req.session.pendingEmail;
  if (!email) return res.redirect("/register");

  const { code } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user) return res.redirect("/register");

  if (!user.verification_code || user.verification_code !== code) {
    return res.render("auth/verify", {
      error: "Kode verifikasi salah. Coba lagi.",
      email,
      previewUrl: req.session.previewUrl || null,
      info: null,
    });
  }

  if (new Date(user.verification_expires) < new Date()) {
    return res.render("auth/verify", {
      error: "Kode sudah kedaluwarsa. Klik 'Kirim ulang kode' di bawah.",
      email,
      previewUrl: req.session.previewUrl || null,
      info: null,
    });
  }

  db.prepare(
    "UPDATE users SET is_verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?"
  ).run(user.id);

  delete req.session.pendingEmail;
  delete req.session.previewUrl;

  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.name = user.name;

  res.redirect(user.role === "admin" ? "/admin" : "/dashboard");
});

router.post("/verify/resend", async (req, res) => {
  const email = req.session.pendingEmail;
  if (!email) return res.redirect("/register");

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.redirect("/register");

  const code = generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  db.prepare("UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?").run(
    code,
    expires,
    user.id
  );

  const result = await sendVerificationEmail(email, user.name, code);
  req.session.previewUrl = result.previewUrl || null;

  res.render("auth/verify", {
    error: null,
    email,
    previewUrl: req.session.previewUrl,
    info: "Kode baru sudah dikirim ke email kamu.",
  });
});

/* ---------- LOGIN ---------- */
router.get("/login", redirectIfAuth, (req, res) => {
  res.render("auth/login", { error: null, old: {} });
});

router.post("/login", redirectIfAuth, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render("auth/login", { error: "Email dan password wajib diisi.", old: req.body });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render("auth/login", { error: "Email atau password salah.", old: req.body });
  }

  if (!user.is_verified) {
    req.session.pendingEmail = user.email;
    return res.render("auth/verify", {
      error: "Akun kamu belum diverifikasi. Masukkan kode yang dikirim ke email, atau kirim ulang kode.",
      email: user.email,
      previewUrl: null,
      info: null,
    });
  }

  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.name = user.name;

  res.redirect(user.role === "admin" ? "/admin" : "/dashboard");
});

/* ---------- LOGOUT ---------- */
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

module.exports = router;
