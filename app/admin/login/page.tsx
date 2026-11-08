import { redirect } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/admin/actions";
import { getCurrentAdmin } from "@/lib/admin-auth.server";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  if (await getCurrentAdmin()) redirect("/admin");
  const { error, notice } = await searchParams;

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" action={loginAction}>
        <Link className="admin-brand" href="/admin/login">HEILIG® <span>ADMIN</span></Link>
        <p className="admin-eyebrow">Área restrita</p>
        <h1>Acesse sua conta</h1>
        {notice && <p className="admin-alert admin-alert-success">{notice}</p>}
        {error && <p className="admin-alert admin-alert-error" role="alert">{error}</p>}
        <label>
          E-mail
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Senha
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="admin-button" type="submit">Entrar</button>
        <Link className="admin-muted-link" href="/">Voltar para a loja</Link>
      </form>
    </main>
  );
}
