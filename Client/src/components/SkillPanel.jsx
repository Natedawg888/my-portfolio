import { useState } from "react";

/**
 * Edit these arrays to change data quickly.
 */
const CORE_SKILLS = [
  { label: "Systems", level: 60 },
  { label: "Frontend", level: 50 },
  { label: "Backend", level: 45 },
  { label: "Problem Solving", level: 65 },
  { label: "Testing & Debugging", level: 40 },
];

const LANG_SKILLS = [
  { label: "JavaScript / TypeScript", level: 50 },
  { label: "C# (Unity)", level: 60 },
  { label: "HTML / CSS", level: 60 },
  { label: "Python", level: 10 },
  { label: "SQL", level: 45 },
];

const DESIGN_TOOLS = [
  { label: "Blender", level: 50 },
  { label: "Photoshop", level: 40 },
  { label: "Figma", level: 20 },
  { label: "Illustrator", level: 30 },
  { label: "Video Editing", level: 25 },
];

export default function AboutPanel() {
  const [tab, setTab] = useState("overview"); // "overview" | "languages" | "design"

  return (
    <div className="about-panel">
      <div className="tabs">
        <button
          className={`tab-btn ${tab === "overview" ? "active" : ""}`}
          onClick={() => setTab("overview")}
        >
          Core Skills
        </button>
        <button
          className={`tab-btn ${tab === "languages" ? "active" : ""}`}
          onClick={() => setTab("languages")}
        >
          Languages
        </button>
        <button
          className={`tab-btn ${tab === "design" ? "active" : ""}`}
          onClick={() => setTab("design")}
        >
          Design
        </button>
      </div>

      <div className="panel-body">
        {tab === "overview" && (
          <BarList title="Core Skills" data={CORE_SKILLS} />
        )}
        {tab === "languages" && (
          <BarList title="Programming Languages" data={LANG_SKILLS} />
        )}
        {tab === "design" && <BarList title="Design" data={DESIGN_TOOLS} />}
      </div>
    </div>
  );
}

function BarList({ title, data }) {
  return (
    <div>
      <h3 className="panel-title">{title}</h3>
      <ul className="bars">
        {data.map(({ label, level }) => (
          <li key={label} className="bar-row">
            <span className="bar-label">{label}</span>
            <span className="bar-track" aria-label={`${label} ${level}%`}>
              <span className="bar-fill" style={{ width: `${level}%` }}></span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DesignList({ tools }) {
  return (
    <div>
      <h3 className="panel-title">Design</h3>
      <div className="pill-grid">
        {tools.map((t) => (
          <span key={t} className="pill">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
