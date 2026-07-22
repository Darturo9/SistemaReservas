"use client";

import { useActionState } from "react";
import Link from "next/link";

import type { BookingConfirmationState } from "@/app/reservar/verificar-correo/actions";

type BookingConfirmationFormProps = {
  action: (
    state: BookingConfirmationState,
    formData: FormData,
  ) => Promise<BookingConfirmationState>;
  token: string;
};

const initialState: BookingConfirmationState = { status: "idle" };

export function BookingConfirmationForm({
  action,
  token,
}: BookingConfirmationFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (state.status === "confirmed") {
    return (
      <>
        <p className="eyebrow">Confirmación de reserva</p>
        <h1>Tu solicitud ya está confirmada.</h1>
        <p>
          Tu solicitud fue enviada al negocio para aprobación. Te confirmarán la
          reserva manualmente.
        </p>
        <Link className="button message-secondary" href="/">
          Volver al inicio
        </Link>
      </>
    );
  }

  if (state.status === "unavailable") {
    return (
      <>
        <p className="eyebrow">Confirmación de reserva</p>
        <h1>Este enlace ya no está disponible.</h1>
        <p>
          El enlace puede haber vencido, ya fue utilizado o no es válido. Vuelve
          a iniciar una reserva para solicitar otro.
        </p>
        <Link className="button message-secondary" href="/">
          Volver al inicio
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="eyebrow">Confirmación de reserva</p>
      <h1>Confirma tu solicitud.</h1>
      <p>
        Para proteger tu reserva de vistas previas automáticas, confirma que
        deseas enviar tu solicitud al negocio.
      </p>
      <form action={formAction}>
        <input name="token" type="hidden" value={token} />
        <button
          className="button button-primary"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Confirmando solicitud..." : "Confirmar reserva"}
        </button>
      </form>
    </>
  );
}
