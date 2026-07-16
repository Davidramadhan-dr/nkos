const express = require("express");
const { requireAuth } = require("../middleware/auth");
const db = require("../database");

const router = express.Router();

/* ---------- SUPPORT/HELP PAGE ---------- */
router.get("/bantuan", (req, res) => {
  res.render("public/bantuan", {
    title: "Bantuan & Support - NokosKu",
  });
});

/* ---------- SEND SUPPORT MESSAGE ---------- */
router.post("/bantuan/kirim", requireAuth, (req, res) => {
  const { subject, message } = req.body;
  const userId = req.session.userId;

  if (!subject || !message) {
    return res.render("public/bantuan", {
      title: "Bantuan & Support - NokosKu",
      error: "Subject dan pesan tidak boleh kosong",
    });
  }

  db.prepare(
    `INSERT INTO user_notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`
  ).run(userId, subject, message, "support");

  res.render("public/bantuan", {
    title: "Bantuan & Support - NokosKu",
    success: "Pesan support Anda telah dikirim. Tim support akan membalas dalam 24 jam.",
  });
});

module.exports = router;