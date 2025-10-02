// src/components/AboutPanel.jsx
export default function AboutPanel() {
  return (
    <div className="about-panel">
      <h3 className="panel-title">About</h3>

      <p style={{ margin: 0 }}>
        I’m <strong>Nathan McCormick</strong>—a self-taught designer/developer
        with formal training at <strong>ACG Yoobee School of Design</strong>{" "}
        (design) and <strong>Mission Ready HQ</strong> (full-stack). I love
        programming, clean UI, and stylized low-poly 3D models. On the web I
        build with
        <strong> React + Vite</strong>; and for games I create with{" "}
        <strong>Unity/C#</strong> systems with an eye for readable code, good
        naming, and pixel-perfect detail.
      </p>

      <div style={{ height: "0.8rem" }} />

      <p style={{ margin: 0 }}>
        I’ve spent the past few years building a mobile strategy game inspired
        by the <strong>Kardashev scale</strong>—setting up procedural maps,
        turn-based time, population/resources/health systems, and an AI
        opponent—while low-poly modeling in Blender and exploring shaders. I
        enjoy systems design, polishing UX, and delivering small, thoughtful
        projects that feel great to use.
      </p>

      <div style={{ height: "1rem" }} />

      <div className="pill-grid">
        <span className="pill">React · Vite</span>
        <span className="pill">Unity · C#</span>
        <span className="pill">Node · Express</span>
        <span className="pill">MySQL</span>
        <span className="pill">Blender · Low-poly</span>
        <span className="pill">UI/UX</span>
      </div>
    </div>
  );
}
