const express = require("express");
const db = require("../database");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAdmin);

/* ---------- ADMIN: KELOLA TOPUP ---------- */
router.get("/admin/topup", (req, res) => {
  const statusFilter = req.query.status || "";

  let sql = `
    SELECT topup_requests.*, users.name AS user_name, users.email AS user_email
    FROM topup_requests
    JOIN users ON topup_requests.user_id = users.id
  `;
  const params = [];
  if (statusFilter) {
    sql += " WHERE topup_requests.status = ?";
    params.push(statusFilter);
  }
  sql += " ORDER BY topup_requests.created_at DESC";

  const topupRequests = db.prepare(sql).all(...params);

  res.render("admin/topup-management", {
    title: "Kelola Topup - NokosKu",
    active: "admin-topup",
    topupRequests,
    statusFilter,
  });
});

router.post("/admin/topup/:id/approve", (req, res) => {
  const topupId = req.params.id;
  const { admin_notes } = req.body;

  const topup = db.prepare("SELECT * FROM topup_requests WHERE id = ?").get(topupId);

  if (!topup) {
    return res.status(404).json({ error: "Topup request tidak ditemukan" });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(topup.user_id);
  const newBalance = user.balance + topup.amount;

  db.exec("BEGIN");
  try {
    db.prepare(
      `UPDATE topup_requests SET status = 'Approved', admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(admin_notes || "", topupId);

    db.prepare(`UPDATE users SET balance = ? WHERE id = ?`).run(newBalance, topup.user_id);

    db.prepare(
      `INSERT INTO user_transactions (user_id, type, amount, description, balance_before, balance_after) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(topup.user_id, "topup", topup.amount, "Topup saldo disetujui admin", user.balance, newBalance);

    db.prepare(
      `INSERT INTO user_notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`
    ).run(
      topup.user_id,
      "Topup Berhasil",
      `Topup sebesar Rp ${topup.amount.toLocaleString("id-ID")} telah disetujui. Saldo Anda sekarang Rp ${newBalance.toLocaleString("id-ID")}`,
      "topup_success"
    );

    db.exec("COMMIT");
    res.json({ success: true, message: "Topup disetujui" });
  } catch (err) {
    db.exec("ROLLBACK");
    res.status(500).json({ error: "Gagal memproses topup" });
  }
});

router.post("/admin/topup/:id/reject", (req, res) => {
  const topupId = req.params.id;
  const { admin_notes } = req.body;

  const topup = db.prepare("SELECT * FROM topup_requests WHERE id = ?").get(topupId);

  if (!topup) {
    return res.status(404).json({ error: "Topup request tidak ditemukan" });
  }

  db.prepare(
    `UPDATE topup_requests SET status = 'Rejected', admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(admin_notes || "Ditolak oleh admin", topupId);

  db.prepare(
    `INSERT INTO user_notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`
  ).run(
    topup.user_id,
    "Topup Ditolak",
    `Topup sebesar Rp ${topup.amount.toLocaleString("id-ID")} telah ditolak. Alasan: ${admin_notes || "Tidak ada keterangan"}`,
    "topup_rejected"
  );

  res.json({ success: true, message: "Topup ditolak" });
});

module.exports = router;