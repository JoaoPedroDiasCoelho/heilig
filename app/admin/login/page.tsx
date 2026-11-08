import { redirect } from "next/navigation";
import Link from "next/link";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getCurrentAdmin } from "@/lib/admin-auth.server";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  if (await getCurrentAdmin()) redirect("/admin");
  const { error, notice } = await searchParams;

  return (
    <main className="admin-login-page">
      <header className="admin-login-header">
        <Link className="admin-login-brand" href="/admin/login" aria-label="HEILIG, administração">
          HEILIG<sup>®</sup>
        </Link>
      </header>

      <div className="admin-login-content">
        <section className="admin-login-intro" aria-label="Acesso restrito ao painel HEILIG">
          <h1>
            ACESSO
            <br />
            <em>RESTRITO.</em>
          </h1>
          <p>PAINEL ADMINISTRATIVO HEILIG®</p>
        </section>

        <section className="admin-login-panel" aria-labelledby="admin-login-heading">
          <div className="admin-login-panel-heading">
            <p className="admin-login-eyebrow"><i /> ÁREA RESTRITA / 01</p>
            <h2 id="admin-login-heading">Bem-vindo de volta.</h2>
            <p>Entre para acessar o painel administrativo.</p>
          </div>
          <AdminLoginForm error={error} notice={notice} />
        </section>
      </div>

    </main>
  );
}
