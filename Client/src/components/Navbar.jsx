import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand">
          Nathan <span>McCormick</span>
        </NavLink>
        <nav className="links">
          <NavLink to="/" end className="link">
            Home
          </NavLink>
          <NavLink to="/projects" className="link">
            Projects
          </NavLink>
          <NavLink to="/contact" className="link">
            Contact
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
