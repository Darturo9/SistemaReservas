"use client";

import { useActionState, useEffect, useRef } from "react";

import type { LocationFormState } from "@/app/panel/[organizationId]/sucursales/actions";

type LocationFormProps = {
  action: (
    state: LocationFormState,
    formData: FormData,
  ) => Promise<LocationFormState>;
};

const initialState: LocationFormState = {};

export function LocationForm({ action }: LocationFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      formRef.current?.reset();
    }
  }, [state.message]);

  return (
    <form action={formAction} className="location-form" ref={formRef}>
      <label className="field">
        <span>Nombre de la sucursal</span>
        <input
          autoComplete="organization"
          maxLength={120}
          name="name"
          placeholder="Ej. Zona 10"
          required
        />
      </label>
      <label className="field">
        <span>Dirección</span>
        <textarea
          maxLength={500}
          name="address"
          placeholder="Ej. 6a avenida 12-45, Ciudad de Guatemala"
          rows={3}
        />
      </label>
      <div className="location-form-contact">
        <label className="field">
          <span>Teléfono</span>
          <input
            autoComplete="tel"
            maxLength={30}
            name="contactPhone"
            placeholder="Ej. +502 1234 5678"
            type="tel"
          />
        </label>
        <label className="field">
          <span>Correo</span>
          <input
            autoComplete="email"
            name="contactEmail"
            placeholder="Ej. hola@negocio.com"
            type="email"
          />
        </label>
      </div>
      <p className="location-timezone">
        Zona horaria inicial: <strong>Guatemala (UTC-6)</strong>
      </p>
      <div aria-live="polite" className="form-feedback">
        {state.error ? <p className="form-error">{state.error}</p> : null}
        {state.message ? <p className="form-success">{state.message}</p> : null}
      </div>
      <button
        className="button button-primary location-submit"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Guardando sucursal..." : "Guardar sucursal"}
      </button>
    </form>
  );
}
