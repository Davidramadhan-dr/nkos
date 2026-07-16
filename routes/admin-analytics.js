const express = require("express");
const db = require("../database");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAdmin);

/* ---------- ADMIN: ANALYTICS ---------- */
router.get("/admin/analytics", (req, res) => {
  const totalRevenue =
    db.prepare("SELECT SUM(total_price) AS t FROM orders WHERE status = 'Success'").get().t || 0;
  const totalOrders = db.prepare("SELECT COUNT(*) AS c FROM orders").get().c;
  const totalUsers = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'user'").get().c;
  const totalTopupRequests = db.prepare("SELECT COUNT(*) AS c FROM topup_requests").get().c;
  const approvedTopup = db.prepare("SELECT SUM(amount) AS t FROM topup_requests WHERE status = 'Approved'").get().t || 0;

  const dailySalesData = db
    .prepare(
      `SELECT DATE(created_at) AS date, SUM(total_price) AS total, COUNT(*) AS count
       FROM orders WHERE status = 'Success'
       GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`
    )
    .all();

  const categoryStats = db
    .prepare(
      `SELECT nokos.category, COUNT(orders.id) AS total_sold, SUM(orders.total_price) AS revenue
       FROM orders JOIN nokos ON orders.nokos_id = nokos.id
       WHERE orders.status = 'Success'
       GROUP BY nokos.category ORDER BY revenue DESC`
    )
    .all();

  res.render("admin/analytics", {
    title: "Analytics - NokosKu",
    active: "admin-analytics",
    stats: {
      totalRevenue,
      totalOrders,
      totalUsers,
      totalTopupRequests,
      approvedTopup,
    },
    dailySalesData,
    categoryStats,
  });
});

module.exports = router;