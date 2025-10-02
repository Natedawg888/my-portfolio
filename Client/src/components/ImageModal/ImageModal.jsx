import styles from "./ImageModal.module.css";

export default function ImageModal({ src, title, onClose }) {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title || "Preview"}</h3>
          <button className={styles.close} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.body}>
          <img className={styles.img} src={src} alt={title || "image"} />
        </div>
      </div>
    </div>
  );
}
