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

/** Throttle helper: runs tasks in parallel up to `limit` */
async function throttleAll(tasks, limit = 5) {
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

  // model cache (url -> blobUrl)
  const [modelCache, setModelCache] = useState(() => new Map());
  // Keep track of blob URLs to revoke on cleanup
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

          // Accept either video_url or video_urls (and a few aliases)
          const videosRaw = p.video_url ?? p.video_urls ?? p.videos ?? null;
          const shotsRaw = p.screenshots ?? p.images ?? p.shots ?? null;

          const videos = toArray(videosRaw).map(toPublicPath);
          const shots = toArray(shotsRaw).map(toPublicPath);

          return {
            ...p,
            tags,
            video_url: videos,
            screenshots: shots,
            thumbnail: toPublicPath(p.thumbnail),
            project_url: p.project_url ? toPublicPath(p.project_url) : "",
            fbx_path: p.fbx_path ? toPublicPath(p.fbx_path) : "",
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

  /* ---------- preload models once items are available ---------- */
  useEffect(() => {
    if (!items?.length) return;

    const controllers = [];
    const toPreload = items
      .map((p) => p.fbx_path)
      .filter(Boolean)
      .filter((url) => !modelCache.has(url)); // skip already cached

    if (toPreload.length === 0) return;

    const tasks = toPreload.map((url) => async () => {
      const ctrl = new AbortController();
      controllers.push(ctrl);

      try {
        const res = await fetch(url, {
          signal: ctrl.signal,
          credentials: "omit",
        });
        if (!res.ok) throw new Error(`Failed to preload ${url}: ${res.status}`);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        blobUrlsRef.current.add(blobUrl);
        // store in cache
        setModelCache((prev) => {
          const next = new Map(prev);
          next.set(url, blobUrl);
          return next;
        });
      } catch (e) {
        // swallow: we’ll just fall back to the original URL on click
        // console.warn(e);
      }
    });

    // throttle to avoid network bursts
    throttleAll(tasks, 3);

    return () => {
      // cancel any in-flight preloads on filter change/unmount
      controllers.forEach((c) => c.abort());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Revoke blob URLs when the page unmounts (or on hard reload)
  useEffect(() => {
    return () => {
      for (const u of blobUrlsRef.current) {
        URL.revokeObjectURL(u);
      }
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

          return (
            <article key={p.id} className={styles.card}>
              {p.thumbnail && (
                <img
                  src={p.thumbnail}
                  alt={p.title}
                  className={styles.thumb}
                  onClick={() => {
                    if (cat === "models" && p.fbx_path) {
                      const src = modelCache.get(p.fbx_path) || p.fbx_path;
                      setModelPreview({ src, title: p.title });
                    } else if (
                      (cat === "assets" || cat === "logos") &&
                      (p.project_url || p.thumbnail)
                    ) {
                      setImagePreview({
                        src: p.project_url || p.thumbnail,
                        title: p.title,
                      });
                    } else if (cat === "games" && hasGameMedia) {
                      setGamePreview({
                        title: p.title,
                        videos: p.video_url,
                        shots: p.screenshots,
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
                  {cat === "models" && p.fbx_path && (
                    <button
                      type="button"
                      className={styles.filterBtn}
                      onClick={() => {
                        const src = modelCache.get(p.fbx_path) || p.fbx_path;
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
                        onClick={() =>
                          setImagePreview({
                            src: p.project_url || p.thumbnail,
                            title: p.title,
                          })
                        }
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
                          shots: p.screenshots,
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
