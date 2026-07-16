require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const db = require("./database");

const authRoutes = require("./routes/auth");
const publicRoutes = require("./routes/public");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const topupRoutes = require("./routes/topup");
const adminTopupRoutes = require("./routes/admin-topup");
const userProfileRoutes = require("./routes/user-profile");
const adminAnalyticsRoutes = require("./routes/admin-analytics");
const adminSettingsRoutes = require("./routes/admin-settings");
const reviewsRoutes = require("./routes/reviews");
const supportRoutes = require("./routes/support");
const aboutRoutes = require("./routes/about");
const promoRoutes = require("./routes/promo");

const app = express();
const PORT = process.env.PORT || 4000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "nokosku-secret-key-ganti-ini",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 hari
  })
);

// Sediakan data user yang sedang login ke semua view
app.use((req, res, next) => {
  if (req.session.userId) {
    const user = db
      .prepare("SELECT id, name, email, role, balance FROM users WHERE id = ?")
      .get(req.session.userId);
    res.locals.currentUser = user || null;
  } else {
    res.locals.currentUser = null;
  }
  next();
});

app.use(authRoutes);
app.use(publicRoutes);
app.use(userRoutes);
app.use(adminRoutes);
app.use(topupRoutes);
app.use(adminTopupRoutes);
app.use(userProfileRoutes);
app.use(adminAnalyticsRoutes);
app.use(adminSettingsRoutes);
app.use(reviewsRoutes);
app.use(supportRoutes);
app.use(aboutRoutes);
app.use(promoRoutes);

app.use((req, res) => {
  res.status(404).render("errors/404", { title: "Halaman Tidak Ditemukan" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 NokosKu jalan di http://localhost:${PORT}`);
  console.log(`   Login admin -> email: admin@nokosku.id | password: admin123`);
  console.log(`   Login user contoh -> email: budi@example.com | password: user123\n`);
});
