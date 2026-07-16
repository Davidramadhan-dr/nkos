const express = require("express");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAdmin);

/* ---------- ADMIN: SETTINGS ---------- */
router.get("/admin/settings", (req, res) => {
  res.render("admin/settings", {
    title: "Pengaturan - NokosKu",
    active: "admin-settings",
  });
});

router.post("/admin/settings/save", (req, res) => {
  res.json({ success: true, message: "Pengaturan disimpan" });
});

module.exports = router;