const express = require("express");
const db = require("../database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/* ---------- GET REVIEWS FOR PRODUCT ---------- */
router.get("/nokos/:id/reviews", (req, res) => {
  const nokosId = req.params.id;
  const reviews = db
    .prepare(
      `SELECT reviews.*, users.name FROM reviews JOIN users ON reviews.user_id = users.id
       WHERE reviews.nokos_id = ? ORDER BY reviews.created_at DESC`
    )
    .all(nokosId);

  res.json(reviews);
});

/* ---------- POST REVIEW ---------- */
router.post("/nokos/:id/review", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const nokosId = req.params.id;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating harus antara 1-5" });
  }

  const existingReview = db
    .prepare("SELECT id FROM reviews WHERE user_id = ? AND nokos_id = ?")
    .get(userId, nokosId);

  if (existingReview) {
    db.prepare(
      `UPDATE reviews SET rating = ?, comment = ? WHERE user_id = ? AND nokos_id = ?`
    ).run(parseInt(rating), comment || "", userId, nokosId);
  } else {
    db.prepare(
      `INSERT INTO reviews (user_id, nokos_id, rating, comment) VALUES (?, ?, ?, ?)`
    ).run(userId, nokosId, parseInt(rating), comment || "");
  }

  res.json({ success: true, message: "Review berhasil disimpan" });
});

module.exports = router;