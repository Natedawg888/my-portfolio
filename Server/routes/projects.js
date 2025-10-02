// Server/routes/projects.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/projects?category=logos|games|websites|assets|models&limit=50
router.get("/", async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    const valid = ["logos", "games", "websites", "assets", "models"];
    const params = [];

    let sql = `
      SELECT
        id,
        title,
        category,
        description,
        thumbnail,
        fbx_path,
        project_url,
        CAST(tags         AS CHAR) AS tags,
        CAST(video_url    AS CHAR) AS video_url,
        CAST(screenshots  AS CHAR) AS screenshots,
        featured,
        created_at
      FROM projects
    `;

    if (category && valid.includes(String(category).toLowerCase())) {
      sql += " WHERE category = ?";
      params.push(String(category).toLowerCase());
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    sql += ` ORDER BY featured DESC, created_at DESC LIMIT ${safeLimit}`;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error("GET /api/projects error:", e);
    res.status(500).json({
      ok: false,
      error: "Failed to load projects",
      code: e.code,
      message: e.sqlMessage || e.message,
    });
  }
});

module.exports = router;
