// Centralized API client.
// Reads VITE_API_BASE (set per environment) and appends paths safely.

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

async function http(path, init) {
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
