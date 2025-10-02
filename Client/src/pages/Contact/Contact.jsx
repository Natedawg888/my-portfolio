import { useState } from "react";
import styles from "./Contact.module.css";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    website: "",
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setDone(false);

    // very light client validation
    if (
      !form.name.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ||
      !form.message.trim()
    ) {
      setErr("Please fill out name, a valid email, and a message.");
      return;
    }

    try {
      setSending(true);
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data.error || `HTTP ${r.status}`);

      setDone(true);
      setForm({ name: "", email: "", message: "", website: "" });
    } catch (e2) {
      setErr(String(e2.message || e2));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>Contact</h1>
        <p className={styles.blurb}>
          Hiring for a role or contract? Share the brief, timeline, and tech
          stack—I’ll respond with fit and availability.
        </p>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          {/* honeypot (hidden) */}
          <input
            type="text"
            name="website"
            autoComplete="off"
            value={form.website}
            onChange={onChange}
            className={styles.honey}
            tabIndex={-1}
          />

          <label className={styles.label}>
            <span>Name</span>
            <input
              className={styles.input}
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              required
            />
          </label>

          <label className={styles.label}>
            <span>Email</span>
            <input
              className={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          <label className={styles.label}>
            <span>Message</span>
            <textarea
              className={styles.textarea}
              name="message"
              rows={6}
              value={form.message}
              onChange={onChange}
              required
            />
          </label>

          <div className={styles.actions}>
            <button className={styles.submit} type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send Message"}
            </button>
            {done && <span className={styles.ok}>Sent! Check your inbox.</span>}
            {err && <span className={styles.error}>Error: {err}</span>}
          </div>
        </form>
      </div>
    </section>
  );
}
