import { useEffect, useState, useRef } from "react";
import { askChat } from "../lib/api";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef(null);

  const ICONS = {
    closed: "/icons/chat-bubble.png",
    open: "/icons/close.png",
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);

    try {
      const data = await askChat(text);
      setMsgs((m) => [
        ...m,
        { role: "assistant", text: data?.reply || "(no reply)" },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "assistant", text: "Sorry—something went wrong." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const ToggleButton = (
    <button
      onClick={() => setOpen((v) => !v)}
      aria-label={open ? "Close chat" : "Open chat"}
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        width: 56,
        height: 56,
        borderRadius: "999px",
        border: "2px solid #d7b24b",
        background: "rgba(6,36,28,.9)",
        color: "#f1e3b4",
        cursor: "pointer",
        zIndex: 100,
        boxShadow: "0 6px 18px rgba(0,0,0,.35)",
        display: "grid",
        placeItems: "center",
        padding: 0,
      }}
    >
      <img
        src={open ? ICONS.open : ICONS.closed}
        alt={open ? "Close" : "Chat"}
        width={42}
        height={42}
        draggable="false"
        style={{
          display: "block",
          pointerEvents: "none",
          filter: "drop-shadow(0 1px 0 rgba(0,0,0,.35))",
        }}
        onError={(e) =>
          e.currentTarget.replaceWith(
            document.createTextNode(open ? "×" : "💬")
          )
        }
      />
    </button>
  );

  if (!open) return ToggleButton;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "transparent",
          zIndex: 99,
        }}
      />
      {ToggleButton}
      <div
        ref={wrapRef}
        style={{
          position: "fixed",
          right: 16,
          bottom: 80,
          width: 340,
          maxHeight: 420,
          background: "rgba(6,36,28,.92)",
          border: "2px solid #d7b24b",
          borderRadius: 12,
          padding: 12,
          backdropFilter: "blur(6px)",
          color: "#f1e3b4",
          zIndex: 101,
          boxShadow: "0 14px 40px rgba(0,0,0,.45)",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "space-between",
          }}
        >
          <strong style={{ letterSpacing: ".03em" }}>Chat with Nathan</strong>
        </div>

        <div
          style={{
            overflowY: "auto",
            padding: 6,
            border: "1px solid rgba(215,178,75,.35)",
            borderRadius: 8,
            background: "rgba(255,255,255,.03)",
          }}
        >
          {msgs.length === 0 && (
            <div style={{ opacity: 0.85, fontStyle: "italic" }}>
              Ask about my stack, projects, or approach to a feature. I’ll keep
              it short and practical.
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} style={{ margin: "8px 0", lineHeight: 1.35 }}>
              <div style={{ fontWeight: 700, color: "#edd890" }}>
                {m.role === "user" ? "You" : "Nathan"}
              </div>
              <div>{m.text}</div>
            </div>
          ))}
        </div>

        <form onSubmit={send} style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me something…"
            autoFocus
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #d7b24b",
              background: "transparent",
              color: "#f1e3b4",
            }}
          />
          <button
            disabled={busy}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "2px solid #d7b24b",
              background: "transparent",
              color: "#f1e3b4",
              fontWeight: 700,
              cursor: "pointer",
              minWidth: 82,
            }}
          >
            {busy ? "…" : "Send"}
          </button>
        </form>
      </div>
    </>
  );
}
