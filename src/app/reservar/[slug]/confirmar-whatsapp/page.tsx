import Link from "next/link";

type ConfirmWhatsAppPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fallback?: string }>;
};

export default async function ConfirmWhatsAppPage({
  params,
  searchParams,
}: ConfirmWhatsAppPageProps) {
  const [{ slug }, { fallback }] = await Promise.all([params, searchParams]);
  const isEmailFallback = fallback === "email";

  return (
    <main className="message-page">
      <section
        className="message-card booking-confirmation-card"
        aria-live="polite"
      >
        <p className="eyebrow">Solicitud recibida</p>
        <div aria-hidden="true" className="booking-confirmation-mark">
          {isEmailFallback ? "@" : "✓"}
        </div>
        <h1>
          {isEmailFallback
            ? "Revisa tu correo para validar tu cita."
            : "Ahora valida tu cita en WhatsApp."}
        </h1>
        {isEmailFallback ? (
          <p>
            WhatsApp no pudo entregar el enlace. Te enviamos un correo de
            respaldo: ábrelo dentro de 15 minutos para validar tu solicitud.
          </p>
        ) : (
          <>
            <p>
              Te enviamos un enlace de un solo uso por WhatsApp. Ábrelo dentro
              de 15 minutos para validar tu solicitud.
            </p>
            <ol className="booking-confirmation-steps">
              <li>Abre WhatsApp.</li>
              <li>Busca el mensaje de confirmación.</li>
              <li>Abre el enlace para validar tu cita.</li>
            </ol>
          </>
        )}
        <p className="booking-confirmation-note">
          Tu cita no estará confirmada hasta que abras el enlace.
        </p>
        <Link className="button message-secondary" href={`/reservar/${slug}`}>
          Volver a horarios
        </Link>
      </section>
    </main>
  );
}
