const nodemailer = require("nodemailer");

let transporterPromise = null;

/**
 * Ambil transporter nodemailer.
 * - Kalau ada konfigurasi SMTP asli di .env (SMTP_HOST dst), pakai itu.
 * - Kalau tidak ada, otomatis bikin akun uji coba Ethereal (butuh internet),
 *   supaya masih bisa lihat isi email tanpa perlu akun Gmail/dsb.
 * - Kalau internet tidak tersedia, fallback ke mode offline (kode tampil di terminal).
 */
function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }

    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log("\n📧 Belum ada konfigurasi SMTP di .env — pakai akun email uji coba (Ethereal).");
      console.log(`   Semua email verifikasi bisa dilihat lewat link preview di terminal.\n`);
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    } catch (err) {
      console.warn("\n⚠️  Gagal membuat akun email uji coba (butuh koneksi internet).");
      console.warn("    Mode OFFLINE aktif: kode verifikasi akan ditampilkan di terminal.\n");
      return null;
    }
  })();

  return transporterPromise;
}

async function sendVerificationEmail(to, name, code) {
  const transporter = await getTransporter();

  if (!transporter) {
    console.log(`\n🔑 [MODE OFFLINE] Kode verifikasi untuk ${to} (${name}): ${code}\n`);
    return { offline: true, previewUrl: null };
  }

  try {
    const info = await transporter.sendMail({
      from: '"NokosKu" <noreply@nokosku.id>',
      to,
      subject: "Kode Verifikasi Akun NokosKu",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eaedf5; border-radius: 12px;">
          <h2 style="color:#5b6cff; margin-bottom: 4px;">NokosKu</h2>
          <p>Halo <strong>${name}</strong>,</p>
          <p>Gunakan kode berikut untuk verifikasi akun kamu:</p>
          <div style="font-size:30px; font-weight:bold; letter-spacing:8px; background:#f4f6fb; padding:18px; text-align:center; border-radius:10px; color:#1f2430;">${code}</div>
          <p style="margin-top:16px;">Kode ini berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini ke siapa pun, termasuk pihak yang mengaku dari NokosKu.</p>
          <p style="color:#8891a5; font-size:12px;">Kalau kamu tidak merasa mendaftar di NokosKu, abaikan saja email ini.</p>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    if (previewUrl) {
      console.log(`\n📧 Preview email verifikasi (${to}): ${previewUrl}\n`);
    }
    return { offline: false, previewUrl };
  } catch (err) {
    console.warn("\n⚠️  Gagal mengirim email:", err.message);
    console.log(`🔑 [FALLBACK] Kode verifikasi untuk ${to}: ${code}\n`);
    return { offline: true, previewUrl: null };
  }
}

module.exports = { sendVerificationEmail };
