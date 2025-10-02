// Server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

// quick health check (app only)
app.get("/ping", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// db health check (queries MySQL)
app.get("/db-health", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS up");
    res.json({ ok: true, up: rows?.[0]?.up === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// routes
app.use("/api/projects", require("./routes/projects"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/ask", require("./routes/chat"));

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
