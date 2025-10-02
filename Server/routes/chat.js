// Server/routes/chat.js  (CommonJS)
const fs = require("fs");
const path = require("path");
const express = require("express");
const OpenAI = require("openai");

const router = express.Router();

const MODEL = process.env.CHATBOT_MODEL || "gpt-4o-mini";
const VOICE_PATH = path.resolve("voice/nathan.md");

// Load “voice” (style) once
let NATHAN_STYLE = "You are a helpful assistant.";
try {
  NATHAN_STYLE = fs.readFileSync(VOICE_PATH, "utf8");
  console.log(`[chat] Loaded voice from ${VOICE_PATH}`);
} catch {
  console.warn(`[chat] Could not read ${VOICE_PATH}. Using default style.`);
}

if (!process.env.OPENAI_API_KEY) {
  console.warn("[chat] OPENAI_API_KEY is not set. /api/ask will 500.");
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Prefer Responses API, fallback to Chat Completions
async function answerWithFallback({ instructions, input, model }) {
  try {
    if (openai.responses && typeof openai.responses.create === "function") {
      const r = await openai.responses.create({
        model,
        instructions,
        input,
        temperature: 0.7,
      });
      const text = (r.output_text || "").trim();
      if (text) return text;
      console.warn(
        "[chat] responses.create returned empty output_text; falling back."
      );
    } else {
      console.warn(
        "[chat] responses.create not available; using chat.completions."
      );
    }
  } catch (err) {
    const code = err?.status || err?.response?.status;
    const data = err?.response?.data || err?.message || err;
    console.warn("[chat] responses.create failed:", code, data);
  }

  const chatModel = model.startsWith("gpt-4o") ? "gpt-4o-mini" : model;
  const r = await openai.chat.completions.create({
    model: chatModel,
    messages: [
      { role: "system", content: instructions },
      { role: "user", content: input },
    ],
    temperature: 0.7,
  });
  return (r.choices?.[0]?.message?.content || "").trim();
}

// POST /api/ask
router.post("/", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    const extraContext = String(req.body?.context || "").trim();

    if (!message) {
      return res.status(400).json({ ok: false, error: "No message provided." });
    }

    const instructions = NATHAN_STYLE;
    const input = `User question:
${message}

${extraContext ? `Relevant notes:\n${extraContext}\n` : ""}`;

    const reply = await answerWithFallback({
      instructions,
      input,
      model: MODEL,
    });

    res.json({ ok: true, reply: reply || "I’m not sure yet—mind rephrasing?" });
  } catch (err) {
    console.error(
      "[chat] error (final):",
      err?.response?.data || err?.message || err
    );
    res
      .status(500)
      .json({ ok: false, error: "Failed to answer (server error)." });
  }
});

module.exports = router;
