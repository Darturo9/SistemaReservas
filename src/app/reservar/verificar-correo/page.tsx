import Link from "next/link";

import { confirmPublicBooking } from "@/app/reservar/verificar-correo/actions";
import { BookingConfirmationForm } from "@/components/booking-confirmation-form";

type VerifyBookingEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export const dynamic = "force-dynamic";

export default async function VerifyBookingEmailPage({
  searchParams,
}: VerifyBookingEmailPageProps) {
  const { token } = await searchParams;

  return (
    <main className="message-page">
      <section className="message-card" aria-live="polite">
        {token ? (
          <BookingConfirmationForm
            action={confirmPublicBooking}
            token={token}
          />
        ) : (
          <>
            <p className="eyebrow">Confirmación de reserva</p>
            <h1>Este enlace ya no está disponible.</h1>
            <p>
              El enlace puede haber vencido, ya fue utilizado o no es válido.
              Vuelve a iniciar una reserva para solicitar otro.
            </p>
            <Link className="button message-secondary" href="/">
              Volver al inicio
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
