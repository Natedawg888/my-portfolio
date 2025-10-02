require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

// Parse CORS_ORIGIN as a single value or comma-separated list
function parseOrigins(s) {
  if (!s) return [];
  const list = String(s)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return list.length <= 1 ? list[0] || false : list;
}
const ALLOWED_ORIGINS = parseOrigins(process.env.CORS_ORIGIN);

// CORS
app.use(
  cors({
    origin: ALLOWED_ORIGINS || "*",
    credentials: true,
  })
);

app.use(express.json());

// health/home
app.get("/", (_req, res) => {
  res
    .type("text/plain")
    .send("portfolio-api-nz running. Try GET /ping or /api/projects");
});

app.get("/ping", (_req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

// routes
app.use("/api/projects", require("./routes/projects"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/ask", require("./routes/chat"));

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
