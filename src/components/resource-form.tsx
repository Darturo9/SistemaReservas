"use client";

import { useActionState, useEffect, useRef } from "react";

import type { ResourceFormState } from "@/app/panel/recursos/actions";

type ResourceFormProps = {
  action: (
    state: ResourceFormState,
    formData: FormData,
  ) => Promise<ResourceFormState>;
  locations: { id: string; name: string }[];
};

const initialState: ResourceFormState = {};

export function ResourceForm({ action, locations }: ResourceFormProps) {
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
        <span>Nombre del recurso</span>
        <input
          maxLength={120}
          name="name"
          placeholder="Ej. Sala privada 1"
          required
        />
      </label>
      <div className="location-form-contact">
        <label className="field">
          <span>Tipo</span>
          <select defaultValue="other" name="kind">
            <option value="person">Persona</option>
            <option value="room">Sala</option>
            <option value="court">Cancha</option>
            <option value="equipment">Equipo</option>
            <option value="other">Otro</option>
          </select>
        </label>
        <label className="field">
          <span>Capacidad</span>
          <input
            defaultValue="1"
            min="1"
            name="capacity"
            required
            type="number"
          />
        </label>
      </div>
      <p className="location-timezone">
        La capacidad es informativa por ahora; cada reserva futura asignará un
        recurso compatible.
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
        {isPending ? "Guardando recurso..." : "Guardar recurso"}
      </button>
    </form>
  );
}
