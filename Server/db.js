require("dotenv").config();
const mysql = require("mysql2/promise");

const useSSL = /^true$/i.test(process.env.DB_SSL || "true"); // Azure usually requires TLS

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: useSSL ? { minVersion: "TLSv1.2" } : undefined,
});

module.exports = pool;
