const express = require("express");
const db = require("../database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/* ---------- HOME ---------- */
router.get("/", (req, res) => {
  const featured = db
    .prepare("SELECT * FROM nokos ORDER BY rating DESC LIMIT 8")
    .all();
  const categories = db
    .prepare("SELECT category, COUNT(*) AS total FROM nokos GROUP BY category ORDER BY total DESC")
    .all();
  const totalNokos = db.prepare("SELECT COUNT(*) AS c FROM nokos").get().c;
  const totalCountries = db.prepare("SELECT COUNT(DISTINCT country) AS c FROM nokos").get().c;

  res.render("public/home", {
    title: "NokosKu - Jual Nomor Virtual Terpercaya",
    featured,
    categories,
    totalNokos,
    totalCountries,
  });
});

/* ---------- KATALOG / CARI ---------- */
router.get("/cari", (req, res) => {
  const { q, category, country, sort } = req.query;

  let sql = "SELECT * FROM nokos WHERE 1=1";
  const params = [];

  if (q) {
    sql += " AND (name LIKE ? OR provider LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (country) {
    sql += " AND country = ?";
    params.push(country);
  }

  if (sort === "harga_asc") sql += " ORDER BY price ASC";
  else if (sort === "harga_desc") sql += " ORDER BY price DESC";
  else if (sort === "rating") sql += " ORDER BY rating DESC";
  else sql += " ORDER BY id DESC";

  const results = db.prepare(sql).all(...params);
  const categories = db.prepare("SELECT DISTINCT category FROM nokos ORDER BY category").all();
  const countries = db.prepare("SELECT DISTINCT country FROM nokos ORDER BY country").all();

  res.render("public/search", {
    title: "Cari Nokos - NokosKu",
    results,
    categories,
    countries,
    filters: { q: q || "", category: category || "", country: country || "", sort: sort || "" },
  });
});

/* ---------- DETAIL ---------- */
router.get("/nokos/:id", (req, res) => {
  const item = db.prepare("SELECT * FROM nokos WHERE id = ?").get(req.params.id);
  if (!item) return res.status(404).render("errors/404", { title: "Tidak Ditemukan" });

  const related = db
    .prepare("SELECT * FROM nokos WHERE category = ? AND id != ? LIMIT 4")
    .all(item.category, item.id);

  let isFavorited = false;
  if (req.session.userId) {
    const fav = db
      .prepare("SELECT id FROM favorites WHERE user_id = ? AND nokos_id = ?")
      .get(req.session.userId, item.id);
    isFavorited = !!fav;
  }

  res.render("public/detail", {
    title: `${item.name} - NokosKu`,
    item,
    related,
    isFavorited,
  });
});

/* ---------- CHECKOUT (butuh login) ---------- */
router.get("/nokos/:id/beli", requireAuth, (req, res) => {
  const item = db.prepare("SELECT * FROM nokos WHERE id = ?").get(req.params.id);
  if (!item) return res.status(404).render("errors/404", { title: "Tidak Ditemukan" });

  res.render("public/checkout", { title: "Checkout - NokosKu", item, error: null });
});

router.post("/nokos/:id/beli", requireAuth, (req, res) => {
  const item = db.prepare("SELECT * FROM nokos WHERE id = ?").get(req.params.id);
  if (!item) return res.status(404).render("errors/404", { title: "Tidak Ditemukan" });

  const qty = Math.max(1, parseInt(req.body.quantity, 10) || 1);

  if (qty > item.stock) {
    return res.render("public/checkout", {
      title: "Checkout - NokosKu",
      item,
      error: `Stok tidak cukup. Sisa stok: ${item.stock}.`,
    });
  }

  const total = item.price * qty;
  const info = db
    .prepare(
      "INSERT INTO orders (user_id, nokos_id, quantity, total_price, status) VALUES (?, ?, ?, ?, 'Pending')"
    )
    .run(req.session.userId, item.id, qty, total);

  db.prepare("UPDATE nokos SET stock = stock - ? WHERE id = ?").run(qty, item.id);

  res.redirect(`/pembelian/${info.lastInsertRowid}/sukses`);
});

/* ---------- SUKSES / INVOICE ---------- */
router.get("/pembelian/:id/sukses", requireAuth, (req, res) => {
  const order = db
    .prepare(
      `SELECT orders.*, nokos.name AS nokos_name, nokos.number_format, nokos.provider, nokos.country
       FROM orders JOIN nokos ON orders.nokos_id = nokos.id
       WHERE orders.id = ? AND orders.user_id = ?`
    )
    .get(req.params.id, req.session.userId);

  if (!order) return res.status(404).render("errors/404", { title: "Tidak Ditemukan" });

  res.render("public/success", { title: "Pembelian Berhasil - NokosKu", order });
});

module.exports = router;
