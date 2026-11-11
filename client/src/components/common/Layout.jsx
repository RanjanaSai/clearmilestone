import { NavLink } from "react-router-dom";

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">ClearMilestone</div>
        <div className="tagline">Get paid at every project stage</div>

        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Dashboard
          </NavLink>
        </nav>
      </aside>

      <div className="content">{children}</div>
    </div>
  );
}
