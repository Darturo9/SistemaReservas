import Link from "next/link";

import { updatePublicBookingPage } from "@/app/panel/reservas-publicas/actions";
import { PublicBookingPageForm } from "@/components/public-booking-page-form";
import { getActiveWorkspace } from "@/lib/active-workspace";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PublicBookingSettingsPage() {
  const { organizationId, organizationName, role } = await getActiveWorkspace();
  const supabase = await createClient();
  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("booking_slug, is_booking_public")
    .eq("id", organizationId)
    .maybeSingle();

  if (organizationError || !organization) {
    throw organizationError || new Error("No encontramos el negocio activo.");
  }

  const canManage = role === "owner" || role === "admin";
  const bookingUrl = organization.booking_slug
    ? `/reservar/${organization.booking_slug}`
    : null;

  return (
    <main className="panel-page workspace-page">
      <section
        aria-labelledby="public-booking-title"
        className="locations-shell"
      >
        <header className="locations-header">
          <div>
            <Link className="panel-back-link" href="/panel">
              Espacio operativo
            </Link>
            <p className="eyebrow">Reservas públicas</p>
            <h1 id="public-booking-title">
              Abre la agenda de {organizationName}
            </h1>
          </div>
          <p>
            Comparte una URL propia para que tus clientes revisen los horarios
            que tienes disponibles.
          </p>
        </header>

        <div className="locations-grid">
          <section className="locations-list-panel public-booking-preview">
            <p className="eyebrow">Estado de publicación</p>
            <h2>
              {organization.is_booking_public
                ? "Tu agenda está abierta."
                : "Tu agenda sigue privada."}
            </h2>
            <p>
              {organization.is_booking_public
                ? "Los visitantes pueden consultar servicios, sucursales y horarios libres. Todavía no pueden crear una reserva."
                : "Nadie puede consultar tus horarios hasta que actives la publicación."}
            </p>
            {bookingUrl ? (
              <div className="public-booking-link">
                <span>Enlace para compartir</span>
                {organization.is_booking_public ? (
                  <Link href={bookingUrl}>{bookingUrl}</Link>
                ) : (
                  <code>{bookingUrl}</code>
                )}
              </div>
            ) : (
              <div className="public-booking-link">
                <span>Enlace para compartir</span>
                <strong>Elige una URL para crear tu enlace.</strong>
              </div>
            )}
          </section>

          <aside className="locations-form-panel">
            {canManage ? (
              <>
                <p className="eyebrow">Configuración</p>
                <h2>Define tu enlace.</h2>
                <p>
                  Puedes desactivar la página en cualquier momento sin modificar
                  servicios, horarios ni recursos.
                </p>
                <PublicBookingPageForm
                  action={updatePublicBookingPage}
                  bookingSlug={organization.booking_slug}
                  isBookingPublic={organization.is_booking_public}
                />
              </>
            ) : (
              <div className="locations-read-only">
                <p className="eyebrow">Solo lectura</p>
                <h2>Tu rol no puede publicar reservas.</h2>
                <p>
                  Consulta a un propietario o administrador para hacer cambios.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
