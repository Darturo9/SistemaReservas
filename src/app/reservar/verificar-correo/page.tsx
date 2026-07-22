import Link from "next/link";

import { createPublicClient } from "@/lib/supabase/public";

type VerifyBookingEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export const dynamic = "force-dynamic";

export default async function VerifyBookingEmailPage({
  searchParams,
}: VerifyBookingEmailPageProps) {
  const { token } = await searchParams;
  const supabase = createPublicClient();
  const { data: isVerified, error } = token
    ? await supabase.rpc("verify_public_booking_confirmation", {
        p_token: token,
      })
    : { data: false, error: null };
  const verified = !error && isVerified;

  return (
    <main className="message-page">
      <section className="message-card" aria-live="polite">
        <p className="eyebrow">Confirmación de reserva</p>
        <h1>
          {verified
            ? "Tu solicitud ya está confirmada."
            : "Este enlace ya no está disponible."}
        </h1>
        <p>
          {verified
            ? "Tu solicitud fue enviada al negocio para aprobación. Te confirmarán la reserva manualmente."
            : "El enlace puede haber vencido, ya fue utilizado o no es válido. Vuelve a iniciar una reserva para solicitar otro."}
        </p>
        <Link className="button message-secondary" href="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
