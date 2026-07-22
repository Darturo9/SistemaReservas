"use client";

import { useActionState, useEffect, useRef } from "react";

import type { ServiceFormState } from "@/app/panel/servicios/actions";

type ServiceFormProps = {
  action: (
    state: ServiceFormState,
    formData: FormData,
  ) => Promise<ServiceFormState>;
  resources: { id: string; name: string; locationName: string }[];
};

const initialState: ServiceFormState = {};

export function ServiceForm({ action, resources }: ServiceFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      formRef.current?.reset();
    }
  }, [state.message]);

  return (
    <form action={formAction} className="service-form" ref={formRef}>
      <label className="field">
        <span>Nombre del servicio</span>
        <input
          maxLength={120}
          name="name"
          placeholder="Ej. Corte de cabello"
          required
        />
      </label>
      <label className="field">
        <span>Descripción</span>
        <textarea
          maxLength={2000}
          name="description"
          placeholder="Describe brevemente lo que incluye."
          rows={3}
        />
      </label>
      <div className="service-form-row">
        <label className="field">
          <span>Duración (minutos)</span>
          <input
            defaultValue="30"
            max="1440"
            min="1"
            name="durationMinutes"
            required
            type="number"
          />
        </label>
        <label className="field">
          <span>Precio (GTQ)</span>
          <input
            defaultValue="0"
            min="0"
            name="price"
            required
            step="0.01"
            type="number"
          />
        </label>
      </div>
      <div className="service-form-row">
        <label className="field">
          <span>Margen antes</span>
          <input
            defaultValue="0"
            max="720"
            min="0"
            name="bufferBeforeMinutes"
            required
            type="number"
          />
        </label>
        <label className="field">
          <span>Margen después</span>
          <input
            defaultValue="0"
            max="720"
            min="0"
            name="bufferAfterMinutes"
            required
            type="number"
          />
        </label>
      </div>
      <label className="field">
        <span>Confirmación</span>
        <select defaultValue="automatic" name="approvalPolicy">
          <option value="automatic">Confirmar automáticamente</option>
          <option value="manual">Aprobar manualmente</option>
        </select>
      </label>
      <fieldset className="service-options">
        <legend>Política para el cliente</legend>
        <label>
          <input
            defaultChecked
            name="allowClientCancellation"
            type="checkbox"
          />
          Permitir cancelación
        </label>
        <label>
          <input
            defaultChecked
            name="allowClientRescheduling"
            type="checkbox"
          />
          Permitir reprogramación
        </label>
        <label className="field">
          <span>Aviso mínimo para cancelar (minutos)</span>
          <input
            defaultValue="0"
            max="525600"
            min="0"
            name="cancellationNoticeMinutes"
            required
            type="number"
          />
        </label>
      </fieldset>
      <fieldset className="service-resource-picker">
        <legend>Recursos compatibles</legend>
        <p>Selecciona quién o qué puede prestar este servicio.</p>
        <div>
          {resources.map((resource) => (
            <label key={resource.id}>
              <input name="resourceIds" type="checkbox" value={resource.id} />
              <span>
                <strong>{resource.name}</strong>
                <small>{resource.locationName}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div aria-live="polite" className="form-feedback">
        {state.error ? <p className="form-error">{state.error}</p> : null}
        {state.message ? <p className="form-success">{state.message}</p> : null}
      </div>
      <button
        className="button button-primary location-submit"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Guardando servicio..." : "Guardar servicio"}
      </button>
    </form>
  );
}
