import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdminUser } from "@/lib/admin-auth.server";
import { requirePool } from "@/lib/db.server";

export default async function AdminHomePage() {
  const user = await requireAdminUser();
  const pool = requirePool();
  const [products, users] = await Promise.all([
    pool.query<{ total: string; active: string }>(
      "SELECT count(*) AS total, count(*) FILTER (WHERE active = true) AS active FROM public.products"
    ),
    user.role === "admin"
      ? pool.query<{ total: string }>("SELECT count(*) AS total FROM public.admin_users")
      : Promise.resolve({ rows: [{ total: "0" }] }),
  ]);
  const productCounts = products.rows[0] ?? { total: "0", active: "0" };

  return (
    <AdminShell user={user} activeSection="overview">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Painel de controle</p>
          <h1>Olá, {user.name}</h1>
        </div>
        <Link className="admin-button" href="/admin/products/new">Cadastrar camisa</Link>
      </div>
      <section className="admin-stat-grid" aria-label="Resumo da loja">
        <article className="admin-stat-card">
          <span>Camisas cadastradas</span>
          <strong>{productCounts.total}</strong>
          <small>{productCounts.active} visíveis na loja</small>
        </article>
        {user.role === "admin" && (
          <article className="admin-stat-card">
            <span>Contas administrativas</span>
            <strong>{users.rows[0]?.total ?? "0"}</strong>
            <small>Gerencie acessos ao painel</small>
          </article>
        )}
      </section>
      <section className="admin-quick-links">
        <Link href="/admin/products">Gerenciar catálogo <span>→</span></Link>
        {user.role === "admin" && <Link href="/admin/users">Gerenciar usuários <span>→</span></Link>}
      </section>
    </AdminShell>
  );
}
