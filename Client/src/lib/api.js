const API = import.meta.env.VITE_API_BASE; // set in SWA config

export async function getProjects() {
  const r = await fetch(`${API}/api/projects`);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}
