"use client";

import { useActionState, useEffect, useRef } from "react";

import type { AvailabilityFormState } from "@/app/panel/disponibilidad/actions";

type AvailabilityRuleFormProps = {
  action: (
    state: AvailabilityFormState,
    formData: FormData,
  ) => Promise<AvailabilityFormState>;
  locations: { id: string; name: string }[];
  resources: { id: string; name: string; locationName: string }[];
};

const initialState: AvailabilityFormState = {};

export function AvailabilityRuleForm({
  action,
  locations,
  resources,
}: AvailabilityRuleFormProps) {
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
        <span>Restringir a un recurso</span>
        <select defaultValue="" name="resourceId">
          <option value="">Horario general de sucursal</option>
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name} · {resource.locationName}
            </option>
          ))}
        </select>
      </label>
      <div className="service-form-row">
        <label className="field">
          <span>Día</span>
          <select defaultValue="1" name="dayOfWeek">
            <option value="0">Domingo</option>
            <option value="1">Lunes</option>
            <option value="2">Martes</option>
            <option value="3">Miércoles</option>
            <option value="4">Jueves</option>
            <option value="5">Viernes</option>
            <option value="6">Sábado</option>
          </select>
        </label>
        <div className="availability-time-fields">
          <label className="field">
            <span>Inicio</span>
            <input defaultValue="09:00" name="startTime" required type="time" />
          </label>
          <label className="field">
            <span>Fin</span>
            <input defaultValue="17:00" name="endTime" required type="time" />
          </label>
        </div>
      </div>
      <div aria-live="polite" className="form-feedback">
        {state.error ? <p className="form-error">{state.error}</p> : null}
        {state.message ? <p className="form-success">{state.message}</p> : null}
      </div>
      <button
        className="button button-primary location-submit"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Guardando horario..." : "Agregar horario"}
      </button>
    </form>
  );
}
