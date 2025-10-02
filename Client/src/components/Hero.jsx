export default function Hero() {
  return (
    <section className="hero celt-frame">
      <div className="hero-inner">
        <div className="hero-copy">
          <h1 className="title">Nathan McCormick</h1>
          <p className="tag">CRAFTING LEGENDS IN CODE</p>

          <div className="cta">
            <a href="/projects" className="btn outline">
              VIEW PROJECTS
            </a>
            <a href="/contact" className="btn outline">
              GET IN TOUCH
            </a>
          </div>
        </div>

        <div className="portrait-wrap">
          <img src="/portrait.png" alt="Nathan portrait" className="portrait" />
        </div>
      </div>
    </section>
  );
}
