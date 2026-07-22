"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import type { AuthFormState } from "@/lib/auth/types";

type AuthFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  mode: "register" | "sign-in";
};

const initialState: AuthFormState = {};

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmationPassword, setShowConfirmationPassword] =
    useState(false);
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="auth-form">
      {isRegister ? (
        <label className="field">
          <span>Tu nombre</span>
          <input
            autoComplete="name"
            name="fullName"
            placeholder="Ej. Andrea Morales"
            required
          />
        </label>
      ) : null}

      <label className="field">
        <span>Correo de trabajo</span>
        <input
          autoComplete="email"
          inputMode="email"
          name="email"
          placeholder="tu@negocio.com"
          required
          type="email"
        />
      </label>

      <label className="field">
        <span>Contraseña</span>
        <div className="password-control">
          <input
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={8}
            name="password"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            aria-pressed={showPassword}
            className="password-toggle"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </label>

      {isRegister ? (
        <label className="field">
          <span>Confirmar contraseña</span>
          <div className="password-control">
            <input
              autoComplete="new-password"
              minLength={8}
              name="confirmPassword"
              required
              type={showConfirmationPassword ? "text" : "password"}
            />
            <button
              aria-label={
                showConfirmationPassword
                  ? "Ocultar confirmación de contraseña"
                  : "Mostrar confirmación de contraseña"
              }
              aria-pressed={showConfirmationPassword}
              className="password-toggle"
              onClick={() => setShowConfirmationPassword((current) => !current)}
              type="button"
            >
              {showConfirmationPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </label>
      ) : null}

      <div aria-live="polite" className="form-feedback">
        {state.error ? <p className="form-error">{state.error}</p> : null}
        {state.message ? <p className="form-success">{state.message}</p> : null}
      </div>

      <button
        className="button button-primary auth-submit"
        disabled={isPending}
        type="submit"
      >
        {isPending
          ? "Un momento..."
          : isRegister
            ? "Crear mi cuenta"
            : "Entrar a mi agenda"}
      </button>

      <p className="auth-switch">
        {isRegister ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"}{" "}
        <Link href={isRegister ? "/iniciar-sesion" : "/registro"}>
          {isRegister ? "Inicia sesión" : "Crea tu negocio"}
        </Link>
      </p>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m3 3 18 18" />
      <path d="M6.7 6.7C4.1 8.3 2.5 12 2.5 12s3.5 6 9.5 6c1.6 0 3-.4 4.2-1" />
      <path d="M9.9 6.2A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a13 13 0 0 1-2.8 3.3" />
      <path d="M9.7 9.7A3.25 3.25 0 0 0 14.3 14.3" />
    </svg>
  );
}
