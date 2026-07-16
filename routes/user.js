const express = require("express");
const db = require("../database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", requireAuth, (req, res) => {
  const userId = req.session.userId;

  const totalOrders = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE user_id = ?").get(userId).c;
  const totalSpent =
    db
      .prepare("SELECT SUM(total_price) AS t FROM orders WHERE user_id = ? AND status = 'Success'")
      .get(userId).t || 0;
  const totalFavorites = db.prepare("SELECT COUNT(*) AS c FROM favorites WHERE user_id = ?").get(userId).c;

  const recentOrders = db
    .prepare(
      `SELECT orders.*, nokos.name AS nokos_name FROM orders
       JOIN nokos ON orders.nokos_id = nokos.id
       WHERE orders.user_id = ? ORDER BY orders.id DESC LIMIT 5`
    )
    .all(userId);

  res.render("user/dashboard", {
    title: "Dashboard Saya - NokosKu",
    active: "dashboard",
    stats: { totalOrders, totalSpent, totalFavorites },
    recentOrders,
  });
});

router.get("/riwayat", requireAuth, (req, res) => {
  const orders = db
    .prepare(
      `SELECT orders.*, nokos.name AS nokos_name, nokos.country, nokos.category FROM orders
       JOIN nokos ON orders.nokos_id = nokos.id
       WHERE orders.user_id = ? ORDER BY orders.id DESC`
    )
    .all(req.session.userId);

  res.render("user/riwayat", { title: "Riwayat Transaksi - NokosKu", active: "riwayat", orders });
});

router.get("/favorit", requireAuth, (req, res) => {
  const favorites = db
    .prepare(
      `SELECT nokos.*, favorites.id AS favorite_id FROM favorites
       JOIN nokos ON favorites.nokos_id = nokos.id
       WHERE favorites.user_id = ? ORDER BY favorites.id DESC`
    )
    .all(req.session.userId);

  res.render("user/favorit", { title: "Nokos Favorit - NokosKu", active: "favorit", favorites });
});

router.post("/favorit/:nokosId/toggle", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const nokosId = req.params.nokosId;

  const existing = db
    .prepare("SELECT id FROM favorites WHERE user_id = ? AND nokos_id = ?")
    .get(userId, nokosId);

  if (existing) {
    db.prepare("DELETE FROM favorites WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO favorites (user_id, nokos_id) VALUES (?, ?)").run(userId, nokosId);
  }

  res.redirect(req.get("referer") || "/dashboard");
});

module.exports = router;
