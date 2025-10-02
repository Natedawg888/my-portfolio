import { useEffect, useMemo, useState, useCallback } from "react";
import styles from "./GameViewerModal.module.css";

const isVideoFile = (src = "") => /\.(mp4|webm|ogg)(\?.*)?$/i.test(src);
const isYouTube = (url = "") =>
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);

// Turn any YT URL into an embeddable URL
function toYouTubeEmbed(url = "") {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.searchParams.get("v")) {
      const id = u.searchParams.get("v");
      return `https://www.youtube.com/embed/${id}`;
    }
    const segs = u.pathname.split("/").filter(Boolean);
    const id = segs[segs.length - 1] || "";
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return url;
  }
}

// Best-effort YouTube thumbnail
function youTubeThumb(url = "") {
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.replace("/", "");
    } else if (u.searchParams.get("v")) {
      id = u.searchParams.get("v");
    }
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  } catch {
    return "";
  }
}

export default function GameViewerModal({
  title,
  videos = [],
  shots = [],
  onClose,
}) {
  // videos first, then screenshots
  const media = useMemo(() => {
    const v = (videos || []).filter(Boolean);
    const s = (shots || []).filter(Boolean);
    return [...v, ...s];
  }, [videos, shots]);

  const [index, setIndex] = useState(0);
  const current = media[index];

  // aspect ratio of the main viewer (width/height)
  const [aspect, setAspect] = useState(16 / 9);

  // Update aspect ratio from image metadata
  const onImgLoad = useCallback((e) => {
    const img = e.currentTarget;
    if (img?.naturalWidth && img?.naturalHeight) {
      setAspect(img.naturalWidth / img.naturalHeight);
    }
  }, []);

  // Update aspect ratio from video metadata
  const onVideoMeta = useCallback((e) => {
    const v = e.currentTarget;
    if (v?.videoWidth && v?.videoHeight) {
      setAspect(v.videoWidth / v.videoHeight);
    }
  }, []);

  // When media changes: reset aspect for YouTube (we can’t read its size)
  useEffect(() => {
    if (isYouTube(current)) {
      // default to 16:9 for YouTube embeds (change to 9/16 if you prefer Shorts)
      setAspect(16 / 9);
    }
    // Videos/images will update aspect after metadata/load events fire
  }, [current]);

  // Arrow keys navigate and prevent page scroll while open
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i + 1) % media.length);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => (i - 1 + media.length) % media.length);
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow || "";
    };
  }, [media.length, onClose]);

  if (!media.length) return null;

  const renderMain = (src) => {
    if (isYouTube(src)) {
      const embed = toYouTubeEmbed(src);
      return (
        <iframe
          className={styles.player}
          src={embed}
          title={title || "YouTube video"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      );
    }
    if (isVideoFile(src)) {
      return (
        <video
          className={styles.player}
          src={src}
          controls
          controlsList="nodownload"
          playsInline
          onLoadedMetadata={onVideoMeta}
        />
      );
    }
    return (
      <img className={styles.image} src={src} alt={title} onLoad={onImgLoad} />
    );
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title || "Game"}</h3>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* aspect-respecting box */}
        <div
          className={styles.main}
          style={{ "--ar": aspect } /* used by CSS aspect-ratio */}
        >
          {renderMain(current)}
        </div>

        {media.length > 1 && (
          <div className={styles.thumbs}>
            {media.map((m, i) => {
              const active = i === index;
              const yt = isYouTube(m);
              const vid = isVideoFile(m);
              const thumb = yt ? youTubeThumb(m) : vid ? "" : m;

              return (
                <button
                  key={m + i}
                  className={`${styles.thumbBtn} ${
                    active ? styles.active : ""
                  }`}
                  onClick={() => setIndex(i)}
                  title={`Show ${yt ? "video" : "image"} ${i + 1}`}
                >
                  {thumb ? (
                    <img className={styles.thumbImg} src={thumb} alt="" />
                  ) : yt || vid ? (
                    <div className={styles.thumbVideo}>
                      <span>▶</span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
