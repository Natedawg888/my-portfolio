import { useEffect, useMemo, useRef, useState } from "react";
import { getProjects } from "../../lib/api";
import styles from "./Projects.module.css";

import ModelViewerModal from "../../components/ModelViewerModal/ModelViewerModal.jsx";
import ImageModal from "../../components/ImageModal/ImageModal.jsx";
import GameViewerModal from "../../components/GameViewerModal/GameViewerModal.jsx";

const CATS = [
  { key: "all", label: "All" },
  { key: "logos", label: "Logos" },
  { key: "games", label: "Games" },
  { key: "websites", label: "Websites" },
  { key: "assets", label: "UI Assets" },
  { key: "models", label: "3D Models" },
];

/* ---------- helpers ---------- */
function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === "string") {
    const j = safeParseJSON(val);
    if (Array.isArray(j)) return j.filter(Boolean);
    return val.trim() ? [val.trim()] : [];
  }
  return [];
}
function toPublicPath(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p; // leave full URLs as-is
  return p.startsWith("/") ? p : `/${p}`;
}
function isLikelyImage(u = "") {
  return /\.(png|jpe?g|webp|gif|svg|avif)(\?|#|$)/i.test(u);
}
function isLikelyGlb(u = "") {
  return /\.(glb|gltf)(\?|#|$)/i.test(u);
}

/** Throttle helper: runs tasks in parallel up to `limit` */
async function throttleAll(tasks, limit = 3) {
  const ret = [];
  let i = 0;
  const workers = new Array(Math.min(limit, tasks.length))
    .fill(null)
    .map(async () => {
      while (i < tasks.length) {
        const idx = i++;
        try {
          ret[idx] = await tasks[idx]();
        } catch (e) {
          ret[idx] = e;
        }
      }
    });
  await Promise.all(workers);
  return ret;
}

export default function Projects() {
  // filters/data
  const [active, setActive] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // modals
  const [modelPreview, setModelPreview] = useState(null); // { src, title }
  const [imagePreview, setImagePreview] = useState(null); // { src, title }
  const [gamePreview, setGamePreview] = useState(null); // { title, videos, shots }

  // caches
  const [modelCache, setModelCache] = useState(() => new Map()); // GLB -> blobUrl
  const [imageCache, setImageCache] = useState(() => new Map()); // IMG -> blobUrl
  const videoMetaWarmed = useRef(new Set()); // Set<videoUrl>

  // track blob URLs to revoke on cleanup
  const blobUrlsRef = useRef(new Set());

  // transform filter → API arg
  const endpointArg = useMemo(
    () => (active === "all" ? undefined : active),
    [active]
  );

  // fetch projects
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setErr("");

    getProjects(endpointArg)
      .then((data = []) => {
        if (cancel) return;

        const normalized = data.map((p) => {
          const tags =
            typeof p.tags === "string"
              ? safeParseJSON(p.tags) ?? []
              : Array.isArray(p.tags)
              ? p.tags
              : [];

          const videosRaw = p.video_url ?? p.video_urls ?? p.videos ?? null;
          const shotsRaw = p.screenshots ?? p.images ?? p.shots ?? null;

          const videos = toArray(videosRaw).map(toPublicPath);
          const shots = toArray(shotsRaw).map(toPublicPath);

          // 👇 normalize a generic model url; prefer GLB/GLTF, fall back to old field if present
          const model_url = toPublicPath(
            p.glb_path || p.model_path || p.fbx_path || ""
          );

          return {
            ...p,
            tags,
            video_url: videos,
            screenshots: shots,
            thumbnail: toPublicPath(p.thumbnail),
            project_url: p.project_url ? toPublicPath(p.project_url) : "",
            model_url, // <— use this everywhere below
          };
        });

        setItems(normalized);
      })
      .catch((e) => !cancel && setErr(String(e.message || e)))
      .finally(() => !cancel && setLoading(false));

    return () => {
      cancel = true;
    };
  }, [endpointArg]);

  /* ---------- warm glb models + images + video metadata ---------- */
  useEffect(() => {
    if (!items?.length) return;

    const controllers = [];

    // Collect URLs to warm
    const modelUrls = items
      .map((p) => p.model_url)
      .filter((u) => u && isLikelyGlb(u))
      .filter((u) => !modelCache.has(u));

    const imageUrls = [];
    for (const p of items) {
      if (p.thumbnail && !imageCache.has(p.thumbnail))
        imageUrls.push(p.thumbnail);
      if (isLikelyImage(p.project_url) && !imageCache.has(p.project_url)) {
        imageUrls.push(p.project_url);
      }
      for (const s of p.screenshots || []) {
        if (s && !imageCache.has(s)) imageUrls.push(s);
      }
    }

    // Create tasks
    const modelTasks = modelUrls.map((url) => async () => {
      const ctrl = new AbortController();
      controllers.push(ctrl);
      try {
        const res = await fetch(url, {
          signal: ctrl.signal,
          credentials: "omit",
        });
        if (!res.ok) throw new Error(`preload model ${url}: ${res.status}`);
        const blob = await res.blob(); // .glb
        const blobUrl = URL.createObjectURL(blob);
        blobUrlsRef.current.add(blobUrl);
        setModelCache((prev) => {
          const next = new Map(prev);
          next.set(url, blobUrl);
          return next;
        });
      } catch {}
    });

    const imageTasks = imageUrls.map((url) => async () => {
      const ctrl = new AbortController();
      controllers.push(ctrl);
      try {
        const res = await fetch(url, {
          signal: ctrl.signal,
          credentials: "omit",
        });
        if (!res.ok) throw new Error(`preload image ${url}: ${res.status}`);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        blobUrlsRef.current.add(blobUrl);
        setImageCache((prev) => {
          const next = new Map(prev);
          next.set(url, blobUrl);
          return next;
        });
      } catch {}
    });

    // Warm video metadata lightly (no heavy downloads)
    for (const p of items) {
      for (const v of p.video_url || []) {
        if (!videoMetaWarmed.current.has(v)) {
          videoMetaWarmed.current.add(v);
          const vid = document.createElement("video");
          vid.preload = "metadata";
          vid.src = v;
          vid.onloadedmetadata = vid.onerror = () => {
            setTimeout(() => {
              vid.removeAttribute("src");
              vid.load();
            }, 1200);
          };
          vid.style.position = "absolute";
          vid.style.left = "-99999px";
          vid.style.top = "-99999px";
          document.body.appendChild(vid);
          setTimeout(() => vid.remove(), 2500);
        }
      }
    }

    // Run warmers with throttling
    throttleAll([...modelTasks, ...imageTasks], 3);

    return () => {
      controllers.forEach((c) => c.abort());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Cleanup all blob URLs on unmount
  useEffect(() => {
    return () => {
      for (const u of blobUrlsRef.current) URL.revokeObjectURL(u);
      blobUrlsRef.current.clear();
    };
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Projects</h1>
        <div className={styles.filters}>
          {CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={`${styles.filterBtn} ${
                active === c.key ? styles.active : ""
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className={styles.muted}>Loading…</p>}
      {err && <p className={styles.error}>Error: {err}</p>}

      <div className={styles.grid}>
        {items.map((p) => {
          const cat = (p.category || "").toLowerCase();
          const hasGameMedia =
            (Array.isArray(p.video_url) && p.video_url.length > 0) ||
            (Array.isArray(p.screenshots) && p.screenshots.length > 0);

          const thumbSrc = imageCache.get(p.thumbnail) || p.thumbnail;

          return (
            <article key={p.id} className={styles.card}>
              {p.thumbnail && (
                <img
                  src={thumbSrc}
                  alt={p.title}
                  className={styles.thumb}
                  onClick={() => {
                    if (cat === "models" && p.model_url) {
                      const src = modelCache.get(p.model_url) || p.model_url;
                      setModelPreview({ src, title: p.title });
                    } else if (
                      (cat === "assets" || cat === "logos") &&
                      (p.project_url || p.thumbnail)
                    ) {
                      const srcCandidate = p.project_url || p.thumbnail;
                      const src =
                        (isLikelyImage(srcCandidate) &&
                          imageCache.get(srcCandidate)) ||
                        imageCache.get(p.thumbnail) ||
                        srcCandidate;
                      setImagePreview({ src, title: p.title });
                    } else if (cat === "games" && hasGameMedia) {
                      const shots = (p.screenshots || []).map(
                        (s) => imageCache.get(s) || s
                      );
                      setGamePreview({
                        title: p.title,
                        videos: p.video_url, // warmed metadata only
                        shots,
                      });
                    }
                  }}
                  style={{ cursor: "pointer" }}
                />
              )}

              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{p.title}</h3>
                <p className={styles.cardDesc}>{p.description}</p>

                <div className={styles.meta}>
                  <span className={styles.badge}>{p.category}</span>
                  {Array.isArray(p.tags) && p.tags.length > 0 && (
                    <div className={styles.tags}>
                      {p.tags.map((t) => (
                        <span key={t} className={styles.tag}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}
                >
                  {/* Models -> 3D preview */}
                  {cat === "models" && p.model_url && (
                    <button
                      type="button"
                      className={styles.filterBtn}
                      onClick={() => {
                        const src = modelCache.get(p.model_url) || p.model_url;
                        setModelPreview({ src, title: p.title });
                      }}
                    >
                      Preview 3D
                    </button>
                  )}

                  {/* Assets & Logos -> Image preview */}
                  {(cat === "assets" || cat === "logos") &&
                    (p.project_url || p.thumbnail) && (
                      <button
                        type="button"
                        className={styles.filterBtn}
                        onClick={() => {
                          const srcCandidate = p.project_url || p.thumbnail;
                          const src =
                            (isLikelyImage(srcCandidate) &&
                              imageCache.get(srcCandidate)) ||
                            imageCache.get(p.thumbnail) ||
                            srcCandidate;
                          setImagePreview({ src, title: p.title });
                        }}
                      >
                        Preview
                      </button>
                    )}

                  {/* Games -> video/screenshots viewer */}
                  {cat === "games" && hasGameMedia && (
                    <button
                      type="button"
                      className={styles.filterBtn}
                      onClick={() =>
                        setGamePreview({
                          title: p.title,
                          videos: p.video_url,
                          shots: (p.screenshots || []).map(
                            (s) => imageCache.get(s) || s
                          ),
                        })
                      }
                    >
                      View Demo
                    </button>
                  )}

                  {/* Optional external link */}
                  {p.project_url && /^https?:\/\//i.test(p.project_url) && (
                    <a
                      className={styles.viewLink}
                      href={p.project_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modals */}
      {modelPreview && (
        <ModelViewerModal
          src={modelPreview.src}
          title={modelPreview.title}
          onClose={() => setModelPreview(null)}
        />
      )}
      {imagePreview && (
        <ImageModal
          src={imagePreview.src}
          title={imagePreview.title}
          onClose={() => setImagePreview(null)}
        />
      )}
      {gamePreview && (
        <GameViewerModal
          title={gamePreview.title}
          videos={gamePreview.videos}
          shots={gamePreview.shots}
          onClose={() => setGamePreview(null)}
        />
      )}
    </section>
  );
}
