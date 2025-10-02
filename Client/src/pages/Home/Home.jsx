import Hero from "../../components/Hero.jsx";
import SkillPanel from "../../components/SkillPanel.jsx";
import AboutPanel from "../../components/AboutPanel.jsx";
import styles from "./Home.module.css";

export default function Home() {
  return (
    <>
      <Hero />

      <section className="about celt-frame">
        <div className="about-grid">
          <div className={styles.titleWrap}>
            <h2 className={styles.sectionTitle}>About</h2>
          </div>
          <AboutPanel />
        </div>
      </section>

      <section className="about celt-frame">
        <div className="about-grid">
          <div className={styles.titleWrap}>
            <h2 className={styles.sectionTitle}>Skills</h2>
          </div>
          <SkillPanel />
        </div>
      </section>
    </>
  );
}
