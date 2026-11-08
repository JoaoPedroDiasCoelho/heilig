import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminUser } from "@/lib/admin-auth.server";
import { logoutAction } from "@/app/admin/actions";

type AdminSection = "overview" | "products" | "users";

type AdminShellProps = {
  user: AdminUser;
  activeSection: AdminSection;
  children: ReactNode;
};

export default function AdminShell({ user, activeSection, children }: AdminShellProps) {
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link
          className="admin-brand"
          href="/admin"
          aria-label="HEILIG, administração"
          aria-current={activeSection === "overview" ? "page" : undefined}
        >
          HEILIG<sup>®</sup>
        </Link>
        <nav className="admin-nav" aria-label="Administração">
          <Link href="/admin/products" aria-current={activeSection === "products" ? "page" : undefined}>
            <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m8 4 4 2 4-2 5 3-2.5 4-2.5-1v10H8V10l-2.5 1L3 7l5-3Z" />
            </svg>
            Camisas
          </Link>
          {user.role === "admin" && (
            <Link href="/admin/users" aria-current={activeSection === "users" ? "page" : undefined}>
              <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20v-1.5a7 7 0 0 1 14 0V20H5Z" />
              </svg>
              Usuários
            </Link>
          )}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link className="admin-store-link" href="/">Ver a loja</Link>
          <div className="admin-account">
            <span className="admin-avatar" aria-hidden="true">{initials}</span>
            <span className="admin-account-details">
              <strong>{user.name}</strong>
              <small>{user.role === "admin" ? "Administrador" : "Editor"}</small>
            </span>
          </div>
          <form action={logoutAction}>
            <button className="admin-link-button" type="submit">Sair</button>
          </form>
        </div>
      </aside>
      <div className="admin-content">{children}</div>
    </main>
  );
}
