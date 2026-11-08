"use client";

import { useState } from "react";
import { loginAction } from "@/app/admin/actions";

type AdminLoginFormProps = {
  error?: string;
  notice?: string;
};

export default function AdminLoginForm({ error, notice }: AdminLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="admin-login-form" action={loginAction}>
      {notice && <p className="admin-alert admin-alert-success" role="status">{notice}</p>}
      {error && <p className="admin-alert admin-alert-error" role="alert">{error}</p>}

      <label htmlFor="admin-login-email">E-mail</label>
      <div className="admin-login-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
          <path d="m4.5 7 7.5 6 7.5-6" />
        </svg>
        <input
          id="admin-login-email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="Digite seu e-mail"
          required
        />
      </div>

      <label htmlFor="admin-login-password">Senha</label>
      <div className="admin-login-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v2" />
        </svg>
        <input
          id="admin-login-password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Digite sua senha"
          required
        />
        <button
          className="admin-login-password-toggle"
          type="button"
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((visible) => !visible)}
        >
          {showPassword ? (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 3 21 21M10.6 10.7a2 2 0 0 0 2.7 2.7" />
              <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.2 0 8.5 5 9 7-.2.8-1 2-2.2 3.2M6.2 6.2C3.9 7.8 2.3 10.2 2 12c.5 2 3.8 7 10 7a10 10 0 0 0 3-.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2 12s3.3-7 10-7 10 7 10 7-3.3 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              <path d="m3 3 18 18" />
            </svg>
          )}
        </button>
      </div>

      <button className="admin-login-submit" type="submit">
        ACESSAR PAINEL
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
