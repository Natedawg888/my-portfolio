// Server/db.js
require("dotenv").config();
const mysql = require("mysql2/promise");

const {
  DB_HOST = "localhost",
  DB_PORT = "3306",
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "",
  DB_SSL = "true", // Azure requires TLS
} = process.env;

const useSSL = String(DB_SSL).toLowerCase() !== "false";

// For Azure MySQL you don't need to ship a CA; TLS v1.2 is fine.
const ssl = useSSL
  ? { minVersion: "TLSv1.2", rejectUnauthorized: true }
  : undefined;

const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Optional: quick startup probe so logs show if DB is reachable
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log(
      `[db] Connected to ${DB_HOST}:${DB_PORT} (db=${DB_NAME}, ssl=${!!ssl})`
    );
  } catch (err) {
    console.error("[db] Initial connection failed:", err?.message || err);
  }
})();

module.exports = pool;
