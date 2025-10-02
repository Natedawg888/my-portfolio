// Server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.set("trust proxy", true);

const PORT = Number(process.env.PORT || 4000);

// Allow one origin, or a comma-separated list in CORS_ORIGIN
const rawOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim());
const corsOptions = {
  origin: rawOrigins.length === 1 && rawOrigins[0] === "*" ? true : rawOrigins,
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: "1mb" }));

// Quick health check
app.get("/ping", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// API routes
app.use("/api/projects", require("./routes/projects"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/ask", require("./routes/chat"));

// 404 for unknown API routes
app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

// Generic error handler (so stack traces don't leak)
app.use((err, _req, res, _next) => {
  console.error("[server] unhandled error:", err);
  res.status(500).json({ ok: false, error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
