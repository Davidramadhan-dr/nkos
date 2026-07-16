const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new DatabaseSync(path.join(dataDir, "app.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    is_verified INTEGER NOT NULL DEFAULT 0,
    verification_code TEXT,
    verification_expires TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS nokos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    provider TEXT NOT NULL,
    category TEXT NOT NULL,
    number_format TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    rating REAL DEFAULT 4.5,
    image_seed TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    nokos_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (nokos_id) REFERENCES nokos(id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    nokos_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, nokos_id)
  );
`);

/* ---------- SEED: akun admin ---------- */
const adminExists = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@nokosku.id");
if (!adminExists) {
  const hashed = bcrypt.hashSync("admin123", 10);
  db.prepare(
    `INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, 'admin', 1)`
  ).run("Admin NokosKu", "admin@nokosku.id", hashed);
}

/* ---------- SEED: 1 akun user contoh (sudah terverifikasi) ---------- */
const demoUserExists = db.prepare("SELECT id FROM users WHERE email = ?").get("budi@example.com");
if (!demoUserExists) {
  const hashed = bcrypt.hashSync("user123", 10);
  db.prepare(
    `INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, 'user', 1)`
  ).run("Budi Santoso", "budi@example.com", hashed);
}

/* ---------- SEED: data nokos (nomor virtual) - dibuat banyak ---------- */
const nokosCount = db.prepare("SELECT COUNT(*) AS c FROM nokos").get().c;
if (nokosCount === 0) {
  const insert = db.prepare(`
    INSERT INTO nokos (name, country, provider, category, number_format, price, stock, description, rating, image_seed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const categories = ["WhatsApp", "Telegram", "Google/Gmail", "Instagram", "Facebook", "TikTok", "Umum"];
  const countries = [
    { name: "Indonesia", providers: ["Telkomsel", "Indosat Ooredoo", "XL Axiata", "Tri", "Smartfren"], fmt: "+62 8xx-xxxx-xxxx" },
    { name: "Malaysia", providers: ["Maxis", "Celcom", "Digi"], fmt: "+60 1x-xxx-xxxx" },
    { name: "Singapura", providers: ["Singtel", "StarHub"], fmt: "+65 8xxx-xxxx" },
    { name: "Amerika Serikat", providers: ["T-Mobile", "AT&T", "Verizon"], fmt: "+1 xxx-xxx-xxxx" },
    { name: "Inggris", providers: ["Vodafone UK", "EE"], fmt: "+44 7xxx-xxxxxx" },
    { name: "Rusia", providers: ["MTS", "Beeline"], fmt: "+7 9xx-xxx-xx-xx" },
    { name: "India", providers: ["Jio", "Airtel"], fmt: "+91 9xxxx-xxxxx" },
    { name: "Vietnam", providers: ["Viettel", "Mobifone"], fmt: "+84 9x-xxx-xxxx" },
  ];

  const seed = [];
  let idCounter = 1;
  countries.forEach((c) => {
    c.providers.forEach((provider) => {
      // ambil 2-3 kategori acak per provider supaya variatif tapi tetap banyak
      const shuffled = [...categories].sort(() => 0.5 - Math.random());
      const picked = shuffled.slice(0, 3);
      picked.forEach((cat) => {
        const basePrice =
          c.name === "Indonesia"
            ? 5000 + Math.floor(Math.random() * 15000)
            : 15000 + Math.floor(Math.random() * 45000);
        const price = Math.round(basePrice / 500) * 500;
        const stock = 5 + Math.floor(Math.random() * 95);
        const rating = (4 + Math.random()).toFixed(1);
        seed.push([
          `Nokos ${c.name} - ${cat}`,
          c.name,
          provider,
          cat,
          c.fmt,
          price,
          stock,
          `Nomor virtual aktif dari ${provider} (${c.name}), cocok untuk daftar/verifikasi akun ${cat}. Nomor bisa menerima SMS OTP satu kali pakai.`,
          parseFloat(rating),
          `nokos${idCounter}`,
        ]);
        idCounter++;
      });
    });
  });

  db.exec("BEGIN");
  for (const row of seed) insert.run(...row);
  db.exec("COMMIT");
}

/* ---------- SEED: beberapa transaksi contoh untuk demo dashboard ---------- */
const orderCount = db.prepare("SELECT COUNT(*) AS c FROM orders").get().c;
if (orderCount === 0) {
  const demoUser = db.prepare("SELECT id FROM users WHERE email = ?").get("budi@example.com");
  const someNokos = db.prepare("SELECT id, price FROM nokos LIMIT 6").all();

  if (demoUser && someNokos.length > 0) {
    const insert = db.prepare(`
      INSERT INTO orders (user_id, nokos_id, quantity, total_price, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const statuses = ["Success", "Success", "Pending", "Cancel", "Success", "Pending"];
    db.exec("BEGIN");
    someNokos.forEach((n, idx) => {
      const qty = 1 + Math.floor(Math.random() * 3);
      const daysAgo = idx * 4;
      const date = new Date(Date.now() - daysAgo * 86400000).toISOString();
      insert.run(demoUser.id, n.id, qty, n.price * qty, statuses[idx % statuses.length], date);
    });
    db.exec("COMMIT");
  }
}

module.exports = db;
