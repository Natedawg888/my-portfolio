// Client/src/lib/api.js
const raw = (import.meta.env.VITE_API_BASE || "").trim();
const API_BASE = raw
  ? (raw.startsWith("http://") || raw.startsWith("https://")
      ? raw
      : `https://${raw}`
    ).replace(/\/$/, "")
  : "";

async function http(path, init) {
  if (!API_BASE) throw new Error("VITE_API_BASE is missing.");
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${text}`);
  return text ? JSON.parse(text) : null;
}

export function getProjects(category) {
  const qs =
    category && category !== "all"
      ? `?category=${encodeURIComponent(category)}`
      : "";
  return http(`/api/projects${qs}`);
}

export function sendContact(payload) {
  return http("/api/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function askChat(message, context = "") {
  return http("/api/ask", {
    method: "POST",
    body: JSON.stringify({ message, context }),
  });
}
