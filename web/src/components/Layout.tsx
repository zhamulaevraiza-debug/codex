import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../auth";
import type { Role } from "../types";

const NAV: { to: string; label: string; roles: Role[] }[] = [
  { to: "/operator", label: "Заявки оператора", roles: ["OPERATOR"] },
  { to: "/driver", label: "Маршруты", roles: ["DRIVER"] },
  { to: "/workshop", label: "Цех", roles: ["WORKSHOP"] },
  { to: "/admin/orders", label: "Заявки", roles: ["ADMIN"] },
  { to: "/admin/cash", label: "Касса", roles: ["ADMIN"] },
  { to: "/admin/reports", label: "Отчёты", roles: ["ADMIN"] },
  { to: "/admin/staff", label: "Сотрудники", roles: ["ADMIN"] },
];

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Руководитель",
  OPERATOR: "Оператор",
  DRIVER: "Водитель",
  WORKSHOP: "Цех",
  USER: "Пользователь",
};

export function Layout({ children }: { children: ReactNode }) {
  const { role, email, logout } = useAuth();
  const links = NAV.filter((n) => role && n.roles.includes(role));

  return (
    <div className="layout">
      <header className="topbar">
        <span className="topbar-brand">Carpet CRM</span>
        <nav className="topbar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-user">
          <span>
            {email} · {role ? ROLE_LABEL[role] : ""}
          </span>
          <button className="btn btn-ghost" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
