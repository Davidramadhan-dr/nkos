const express = require("express");

const router = express.Router();

/* ---------- PROMO & OFFERS PAGE ---------- */
router.get("/promo", (req, res) => {
  const promos = [
    {
      id: 1,
      title: "Diskon 15% untuk Topup Pertama",
      description: "Dapatkan potongan 15% untuk topup pertama kali Anda",
      discount: "15%",
      validUntil: "2024-12-31",
    },
    {
      id: 2,
      title: "Gratis Diskon Pembelian Nokos",
      description: "Gratis diskon untuk semua kategori nomor virtual",
      discount: "Gratis",
      validUntil: "2024-12-25",
    },
    {
      id: 3,
      title: "Cashback 5% Setiap Pembelian",
      description: "Setiap pembelian akan mendapat cashback 5% ke saldo",
      discount: "5%",
      validUntil: "2024-12-31",
    },
  ];

  res.render("public/promo", {
    title: "Promo & Penawaran - NokosKu",
    promos,
  });
});

module.exports = router;