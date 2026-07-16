function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.redirect("/login");
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.role === "admin") {
    return next();
  }
  return res.status(403).render("errors/403", { title: "Akses Ditolak" });
}

function redirectIfAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect(req.session.role === "admin" ? "/admin" : "/dashboard");
  }
  return next();
}

module.exports = { requireAuth, requireAdmin, redirectIfAuth };
