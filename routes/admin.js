const express = require("express");
const db = require("../database");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAdmin);

/* ---------- ADMIN DASHBOARD (data penjualan) ---------- */
router.get("/admin", (req, res) => {
  const totalRevenue =
    db.prepare("SELECT SUM(total_price) AS t FROM orders WHERE status = 'Success'").get().t || 0;
  const totalOrders = db.prepare("SELECT COUNT(*) AS c FROM orders").get().c;
  const totalUsers = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'user'").get().c;
  const totalNokos = db.prepare("SELECT COUNT(*) AS c FROM nokos").get().c;

  // Penjualan per bulan (6 bulan terakhir, sederhana berdasarkan created_at)
  const monthlySales = db
    .prepare(
      `SELECT strftime('%Y-%m', created_at) AS month, SUM(total_price) AS total
       FROM orders WHERE status = 'Success'
       GROUP BY month ORDER BY month DESC LIMIT 6`
    )
    .all()
    .reverse();

  const topNokos = db
    .prepare(
      `SELECT nokos.name, COUNT(orders.id) AS total_terjual, SUM(orders.total_price) AS revenue
       FROM orders JOIN nokos ON orders.nokos_id = nokos.id
       WHERE orders.status = 'Success'
       GROUP BY orders.nokos_id ORDER BY total_terjual DESC LIMIT 5`
    )
    .all();

  const recentOrders = db
    .prepare(
      `SELECT orders.*, nokos.name AS nokos_name, users.name AS user_name, users.email AS user_email
       FROM orders
       JOIN nokos ON orders.nokos_id = nokos.id
       JOIN users ON orders.user_id = users.id
       ORDER BY orders.id DESC LIMIT 8`
    )
    .all();

  res.render("admin/dashboard", {
    title: "Admin Dashboard - NokosKu",
    active: "admin-dashboard",
    stats: { totalRevenue, totalOrders, totalUsers, totalNokos },
    monthlySales,
    topNokos,
    recentOrders,
  });
});

/* ---------- KELOLA NOKOS ---------- */
router.get("/admin/nokos", (req, res) => {
  const items = db.prepare("SELECT * FROM nokos ORDER BY id DESC").all();
  res.render("admin/nokos", { title: "Kelola Nokos - NokosKu", active: "admin-nokos", items, error: null });
});

router.post("/admin/nokos", (req, res) => {
  const { name, country, provider, category, number_format, price, stock, description } = req.body;

  if (!name || !country || !provider || !category || !price || !stock) {
    const items = db.prepare("SELECT * FROM nokos ORDER BY id DESC").all();
    return res.render("admin/nokos", {
      title: "Kelola Nokos - NokosKu",
      active: "admin-nokos",
      items,
      error: "Semua kolom wajib diisi (kecuali deskripsi).",
    });
  }

  db.prepare(
    `INSERT INTO nokos (name, country, provider, category, number_format, price, stock, description, rating, image_seed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 4.5, ?)`
  ).run(
    name,
    country,
    provider,
    category,
    number_format || "+xx xxx-xxxx-xxxx",
    parseFloat(price),
    parseInt(stock, 10),
    description || "",
    `nokos${Date.now()}`
  );

  res.redirect("/admin/nokos");
});

router.post("/admin/nokos/:id/delete", (req, res) => {
  db.prepare("DELETE FROM nokos WHERE id = ?").run(req.params.id);
  res.redirect("/admin/nokos");
});

/* ---------- KELOLA TRANSAKSI & USER ---------- */
router.get("/admin/transaksi", (req, res) => {
  const statusFilter = req.query.status || "";

  let sql = `
    SELECT orders.*, nokos.name AS nokos_name, users.name AS user_name, users.email AS user_email
    FROM orders
    JOIN nokos ON orders.nokos_id = nokos.id
    JOIN users ON orders.user_id = users.id
  `;
  const params = [];
  if (statusFilter) {
    sql += " WHERE orders.status = ?";
    params.push(statusFilter);
  }
  sql += " ORDER BY orders.id DESC";

  const orders = db.prepare(sql).all(...params);
  const users = db
    .prepare(
      `SELECT users.*, COUNT(orders.id) AS total_orders, SUM(CASE WHEN orders.status='Success' THEN orders.total_price ELSE 0 END) AS total_spent
       FROM users LEFT JOIN orders ON orders.user_id = users.id
       WHERE users.role = 'user'
       GROUP BY users.id ORDER BY users.id DESC`
    )
    .all();

  res.render("admin/transaksi", {
    title: "Kelola Transaksi & User - NokosKu",
    active: "admin-transaksi",
    orders,
    users,
    statusFilter,
  });
});

router.post("/admin/transaksi/:id/status", (req, res) => {
  const { status } = req.body;
  const allowed = ["Pending", "Success", "Cancel"];
  if (allowed.includes(status)) {
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
  }
  res.redirect("/admin/transaksi");
});

module.exports = router;
