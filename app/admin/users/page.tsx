import AdminShell from "@/components/admin/AdminShell";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import {
  createAdminUserAction,
  deleteAdminUserAction,
  toggleAdminUserAction,
  updateAdminUserAction,
} from "@/app/admin/actions";
import { requireAdminRole } from "@/lib/admin-auth.server";
import { requirePool } from "@/lib/db.server";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor";
  active: boolean;
};

type UsersPageProps = {
  searchParams: Promise<{ error?: string; notice?: string }>;
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const user = await requireAdminRole();
  const [{ error, notice }, result] = await Promise.all([
    searchParams,
    requirePool().query<UserRow>(
      "SELECT id, name, email, role, active FROM public.admin_users ORDER BY created_at, id"
    ),
  ]);

  return (
    <AdminShell user={user} activeSection="users">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Acessos</p>
          <h1>Usuários</h1>
        </div>
      </div>
      {notice && <p className="admin-alert admin-alert-success">{notice}</p>}
      {error && <p className="admin-alert admin-alert-error" role="alert">{error}</p>}

      <section className="admin-panel">
        <div className="admin-section-heading">
          <div><p className="admin-eyebrow">Novo acesso</p><h2>Cadastrar usuário</h2></div>
          <p>Contas administrativas são criadas somente por um administrador conectado.</p>
        </div>
        <form className="admin-form admin-user-create-form" action={createAdminUserAction}>
          <label>Nome<input name="name" required maxLength={120} autoComplete="name" /></label>
          <label>E-mail<input name="email" type="email" required autoComplete="email" /></label>
          <label>Senha inicial<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /><small>Mínimo de 12 caracteres.</small></label>
          <label>Perfil
            <select name="role" defaultValue="editor">
              <option value="editor">Editor — gerencia camisas</option>
              <option value="admin">Administrador — gerencia camisas e usuários</option>
            </select>
          </label>
          <button className="admin-button" type="submit">Criar usuário</button>
        </form>
      </section>

      <section className="admin-panel">
        <div className="admin-section-heading">
          <div><p className="admin-eyebrow">Contas existentes</p><h2>Gerenciar acessos</h2></div>
          <p>Desative contas temporariamente ou remova-as de forma permanente.</p>
        </div>
        <div className="admin-user-list">
          {result.rows.map((account) => (
            <article className="admin-user-card" key={account.id}>
              <div className="admin-user-card-heading">
                <div>
                  <strong>{account.name}</strong>
                  <span>{account.email}</span>
                </div>
                <span className={account.active ? "admin-status is-active" : "admin-status"}>
                  {account.active ? "Ativo" : "Desativado"}
                </span>
              </div>
              <form className="admin-user-edit-form" action={updateAdminUserAction}>
                <input type="hidden" name="id" value={account.id} />
                <label>Nome<input name="name" required maxLength={120} defaultValue={account.name} /></label>
                <label>E-mail<input name="email" type="email" required defaultValue={account.email} /></label>
                <label>Perfil
                  <select name="role" defaultValue={account.role}>
                    <option value="editor">Editor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </label>
                <label>Nova senha (opcional)<input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" /></label>
                <button className="admin-button admin-button-small" type="submit">Salvar usuário</button>
              </form>
              <div className="admin-row-actions admin-user-actions">
                <form action={toggleAdminUserAction}>
                  <input type="hidden" name="id" value={account.id} />
                  {!account.active && <input type="hidden" name="active" value="on" />}
                  <button className="admin-text-link" type="submit">{account.active ? "Desativar" : "Ativar"}</button>
                </form>
                <form action={deleteAdminUserAction}>
                  <input type="hidden" name="id" value={account.id} />
                  <ConfirmSubmitButton className="admin-danger-link" question={`Remover a conta de ${account.name} permanentemente?`}>
                    Remover
                  </ConfirmSubmitButton>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
