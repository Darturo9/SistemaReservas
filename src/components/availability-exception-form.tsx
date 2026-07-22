"use client";

import { useActionState, useEffect, useRef } from "react";

import type { AvailabilityFormState } from "@/app/panel/[organizationId]/disponibilidad/actions";

type AvailabilityExceptionFormProps = {
  action: (
    state: AvailabilityFormState,
    formData: FormData,
  ) => Promise<AvailabilityFormState>;
  locations: { id: string; name: string }[];
  resources: { id: string; name: string; locationName: string }[];
};

const initialState: AvailabilityFormState = {};

export function AvailabilityExceptionForm({
  action,
  locations,
  resources,
}: AvailabilityExceptionFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      formRef.current?.reset();
    }
  }, [state.message]);

  return (
    <form action={formAction} className="availability-form" ref={formRef}>
      <label className="field">
        <span>Sucursal</span>
        <select defaultValue="" name="locationId" required>
          <option disabled value="">
            Selecciona una sucursal
          </option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Aplicar a un recurso</span>
        <select defaultValue="" name="resourceId">
          <option value="">Toda la sucursal</option>
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name} · {resource.locationName}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Tipo</span>
        <select defaultValue="unavailable" name="kind">
          <option value="unavailable">Cierre o descanso</option>
          <option value="available">Horario extraordinario</option>
        </select>
      </label>
      <label className="field">
        <span>Desde</span>
        <input name="startsAt" required type="datetime-local" />
      </label>
      <label className="field">
        <span>Hasta</span>
        <input name="endsAt" required type="datetime-local" />
      </label>
      <label className="field">
        <span>Nota</span>
        <textarea
          maxLength={500}
          name="note"
          placeholder="Ej. Día feriado"
          rows={2}
        />
      </label>
      <div aria-live="polite" className="form-feedback">
        {state.error ? <p className="form-error">{state.error}</p> : null}
        {state.message ? <p className="form-success">{state.message}</p> : null}
      </div>
      <button
        className="button button-primary location-submit"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Guardando excepción..." : "Agregar excepción"}
      </button>
    </form>
  );
}
