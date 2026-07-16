const express = require("express");
const db = require("../database");
const { requireAuth } = require("../middleware/auth");
const bcrypt = require("bcryptjs");

const router = express.Router();

/* ---------- USER PROFILE ---------- */
router.get("/profil", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

  res.render("user/profil", {
    title: "Profil Saya - NokosKu",
    active: "profil",
    user,
    error: null,
    success: null,
  });
});

router.post("/profil/update", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { name, phone } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

  if (!name || name.trim().length === 0) {
    return res.render("user/profil", {
      title: "Profil Saya - NokosKu",
      active: "profil",
      user,
      error: "Nama tidak boleh kosong",
      success: null,
    });
  }

  db.prepare(`UPDATE users SET name = ?, phone = ? WHERE id = ?`).run(name, phone || "", userId);

  req.session.name = name;

  const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

  res.render("user/profil", {
    title: "Profil Saya - NokosKu",
    active: "profil",
    user: updatedUser,
    error: null,
    success: "Profil berhasil diperbarui",
  });
});

router.post("/profil/change-password", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { current_password, new_password, confirm_password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

  if (!bcrypt.compareSync(current_password, user.password)) {
    return res.render("user/profil", {
      title: "Profil Saya - NokosKu",
      active: "profil",
      user,
      error: "Password saat ini salah",
      success: null,
    });
  }

  if (new_password !== confirm_password) {
    return res.render("user/profil", {
      title: "Profil Saya - NokosKu",
      active: "profil",
      user,
      error: "Password baru dan konfirmasi tidak sama",
      success: null,
    });
  }

  if (new_password.length < 6) {
    return res.render("user/profil", {
      title: "Profil Saya - NokosKu",
      active: "profil",
      user,
      error: "Password minimal 6 karakter",
      success: null,
    });
  }

  const hashed = bcrypt.hashSync(new_password, 10);
  db.prepare(`UPDATE users SET password = ? WHERE id = ?`).run(hashed, userId);

  res.render("user/profil", {
    title: "Profil Saya - NokosKu",
    active: "profil",
    user,
    error: null,
    success: "Password berhasil diubah",
  });
});

/* ---------- USER NOTIFICATIONS ---------- */
router.get("/notifikasi", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const notifications = db
    .prepare(`SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC`)
    .all(userId);

  res.render("user/notifikasi", {
    title: "Notifikasi - NokosKu",
    active: "notifikasi",
    notifications,
  });
});

router.post("/notifikasi/:id/baca", requireAuth, (req, res) => {
  const notifId = req.params.id;
  db.prepare(`UPDATE user_notifications SET is_read = 1 WHERE id = ?`).run(notifId);
  res.json({ success: true });
});

/* ---------- USER TRANSACTION HISTORY ---------- */
router.get("/transaksi", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

  const transactions = db
    .prepare(`SELECT * FROM user_transactions WHERE user_id = ? ORDER BY created_at DESC`)
    .all(userId);

  res.render("user/transaksi", {
    title: "Riwayat Transaksi - NokosKu",
    active: "transaksi",
    user,
    transactions,
  });
});

module.exports = router;