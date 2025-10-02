const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const { GMAIL_USER = "", GMAIL_PASS = "", MAIL_TO = "" } = process.env;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: GMAIL_USER, pass: GMAIL_PASS }, // Use a Gmail App Password
});

router.post("/", async (req, res) => {
  try {
    const {
      name = "",
      email = "",
      message = "",
      website = "",
    } = req.body || {};

    // Honeypot field to drop bots silently
    if (website) return res.json({ ok: true });

    const cleanName = String(name).trim().slice(0, 120);
    const cleanEmail = String(email).trim().toLowerCase().slice(0, 180);
    const cleanMsg = String(message).trim();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!cleanName || !emailOk || !cleanMsg) {
      return res.status(400).json({ ok: false, error: "Invalid input." });
    }

    // Send ONE email TO YOU. Replying goes to the sender.
    await transporter.sendMail({
      from: `"Portfolio" <${GMAIL_USER}>`,
      to: MAIL_TO || GMAIL_USER, // <- your inbox
      replyTo: `${cleanName} <${cleanEmail}>`, // reply goes to the sender
      subject: `Portfolio Contact — ${cleanName} <${cleanEmail}>`,
      text: `From: ${cleanName} <${cleanEmail}>

${cleanMsg}
`,
      html: `
        <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial">
          <h2 style="margin:0 0 8px">New Portfolio Message</h2>
          <p><strong>From:</strong> ${escapeHtml(cleanName)} &lt;${escapeHtml(
        cleanEmail
      )}&gt;</p>
          <pre style="white-space:pre-wrap;margin:0">${escapeHtml(
            cleanMsg
          )}</pre>
        </div>
      `,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error("Contact send error:", e);
    res.status(500).json({ ok: false, error: "Failed to send message." });
  }
});

function escapeHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

module.exports = router;
