const express = require("express");
const db = require("../database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/* ---------- TOPUP BALANCE PAGE ---------- */
router.get("/topup", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  const topupOptions = [10000, 25000, 50000, 100000, 250000, 500000];

  res.render("user/topup", {
    title: "Topup Saldo - NokosKu",
    active: "topup",
    user,
    topupOptions,
    error: null,
  });
});

router.post("/topup/request", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { amount, custom_amount } = req.body;

  const finalAmount = custom_amount ? parseFloat(custom_amount) : parseFloat(amount);

  if (!finalAmount || finalAmount < 10000 || finalAmount > 5000000) {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    const topupOptions = [10000, 25000, 50000, 100000, 250000, 500000];
    return res.render("user/topup", {
      title: "Topup Saldo - NokosKu",
      active: "topup",
      user,
      topupOptions,
      error: "Jumlah topup harus antara Rp 10.000 - Rp 5.000.000",
    });
  }

  const info = db
    .prepare(
      `INSERT INTO topup_requests (user_id, amount, status) VALUES (?, ?, 'Pending')`
    )
    .run(userId, finalAmount);

  res.redirect(`/topup/${info.lastInsertRowid}/pembayaran`);
});

/* ---------- TOPUP PAYMENT PAGE (QRIS) ---------- */
router.get("/topup/:id/pembayaran", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const topupId = req.params.id;

  const topup = db
    .prepare("SELECT * FROM topup_requests WHERE id = ? AND user_id = ?")
    .get(topupId, userId);

  if (!topup) {
    return res.status(404).render("errors/404", { title: "Tidak Ditemukan" });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

  res.render("user/topup-payment", {
    title: "Pembayaran Topup - NokosKu",
    active: "topup",
    topup,
    user,
    qrisImagePath: "/qris.jpg",
  });
});

router.post("/topup/:id/upload-bukti", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const topupId = req.params.id;
  const { notes } = req.body;

  const topup = db
    .prepare("SELECT * FROM topup_requests WHERE id = ? AND user_id = ?")
    .get(topupId, userId);

  if (!topup) {
    return res.status(404).json({ error: "Topup request tidak ditemukan" });
  }

  if (topup.status !== "Pending") {
    return res.status(400).json({ error: "Topup request sudah diproses" });
  }

  db.prepare(
    `UPDATE topup_requests SET status = 'Submitted', notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(notes || "", topupId);

  const user = db.prepare("SELECT name FROM users WHERE id = ?").get(userId);

  db.prepare(
    `INSERT INTO user_notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`
  ).run(
    userId,
    "Topup Pending",
    `Permintaan topup sebesar Rp ${topup.amount.toLocaleString("id-ID")} sedang menunggu verifikasi admin`,
    "topup"
  );

  res.json({ success: true, message: "Bukti pembayaran sudah dikirim, tunggu verifikasi admin" });
});

/* ---------- TOPUP HISTORY ---------- */
router.get("/topup-history", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

  const topupRequests = db
    .prepare(
      `SELECT * FROM topup_requests WHERE user_id = ? ORDER BY created_at DESC`
    )
    .all(userId);

  res.render("user/topup-history", {
    title: "Riwayat Topup - NokosKu",
    active: "topup-history",
    user,
    topupRequests,
  });
});

module.exports = router;