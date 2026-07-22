"use client";

import { useActionState } from "react";

import type { PublicBookingPageFormState } from "@/app/panel/[organizationId]/reservas-publicas/actions";

type PublicBookingPageFormProps = {
  action: (
    state: PublicBookingPageFormState,
    formData: FormData,
  ) => Promise<PublicBookingPageFormState>;
  bookingSlug: string | null;
  isBookingPublic: boolean;
};

const initialState: PublicBookingPageFormState = {};

export function PublicBookingPageForm({
  action,
  bookingSlug,
  isBookingPublic,
}: PublicBookingPageFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="public-booking-settings-form">
      <label className="field">
        <span>URL de reservas</span>
        <div className="booking-slug-input">
          <span aria-hidden="true">/reservar/</span>
          <input
            autoCapitalize="none"
            defaultValue={bookingSlug || ""}
            maxLength={64}
            name="bookingSlug"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="mi-negocio"
            spellCheck={false}
          />
        </div>
      </label>
      <p className="field-hint">
        Usa letras minúsculas, números y guiones. Ejemplo:{" "}
        <strong>cafe-centro</strong>.
      </p>
      <label className="public-booking-toggle">
        <input
          defaultChecked={isBookingPublic}
          name="isBookingPublic"
          type="checkbox"
        />
        <span>
          <strong>Publicar reservas</strong>
          <small>
            Permite que cualquier persona consulte horarios disponibles.
          </small>
        </span>
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
        {isPending ? "Guardando página..." : "Guardar página pública"}
      </button>
    </form>
  );
}
