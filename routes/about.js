const express = require("express");

const router = express.Router();

/* ---------- ABOUT PAGE ---------- */
router.get("/tentang", (req, res) => {
  res.render("public/tentang", {
    title: "Tentang NokosKu - Platform Jual Nomor Virtual Terpercaya",
  });
});

/* ---------- TERMS & CONDITIONS ---------- */
router.get("/syarat-ketentuan", (req, res) => {
  res.render("public/syarat-ketentuan", {
    title: "Syarat & Ketentuan - NokosKu",
  });
});

/* ---------- PRIVACY POLICY ---------- */
router.get("/kebijakan-privasi", (req, res) => {
  res.render("public/kebijakan-privasi", {
    title: "Kebijakan Privasi - NokosKu",
  });
});

module.exports = router;