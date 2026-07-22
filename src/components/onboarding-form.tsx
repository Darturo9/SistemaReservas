"use client";

import { useActionState } from "react";

import type { AuthFormState } from "@/lib/auth/types";

type OnboardingFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
};

const initialState: AuthFormState = {};

export function OnboardingForm({ action }: OnboardingFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="auth-form">
      <label className="field">
        <span>Nombre de tu negocio</span>
        <input
          autoComplete="organization"
          name="organizationName"
          placeholder="Ej. Estudio Limon"
          required
        />
      </label>
      <p className="field-hint">
        Podras agregar sucursales, servicios y equipo en los siguientes pasos.
      </p>
      <div aria-live="polite" className="form-feedback">
        {state.error ? <p className="form-error">{state.error}</p> : null}
      </div>
      <button
        className="button button-primary auth-submit"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Creando espacio..." : "Crear mi espacio"}
      </button>
    </form>
  );
}
