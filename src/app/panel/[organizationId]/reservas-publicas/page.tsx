import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updatePublicBookingPage } from "@/app/panel/[organizationId]/reservas-publicas/actions";
import { PublicBookingPageForm } from "@/components/public-booking-page-form";
import { createClient } from "@/lib/supabase/server";

type PublicBookingSettingsPageProps = {
  params: Promise<{ organizationId: string }>;
};

export const dynamic = "force-dynamic";

export default async function PublicBookingSettingsPage({
  params,
}: PublicBookingSettingsPageProps) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (claimsError || !userId) {
    redirect("/iniciar-sesion");
  }

  const [membershipResult, organizationResult] = await Promise.all([
    supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("id, name, booking_slug, is_booking_public")
      .eq("id", organizationId)
      .maybeSingle(),
  ]);

  if (
    membershipResult.error ||
    organizationResult.error ||
    !membershipResult.data ||
    !organizationResult.data
  ) {
    notFound();
  }

  const canManage =
    membershipResult.data.role === "owner" ||
    membershipResult.data.role === "admin";
  const action = updatePublicBookingPage.bind(null, organizationId);
  const bookingUrl = organizationResult.data.booking_slug
    ? `/reservar/${organizationResult.data.booking_slug}`
    : null;

  return (
    <main className="panel-page workspace-page">
      <section
        aria-labelledby="public-booking-title"
        className="locations-shell"
      >
        <header className="locations-header">
          <div>
            <Link className="panel-back-link" href={`/panel/${organizationId}`}>
              Espacio operativo
            </Link>
            <p className="eyebrow">Reservas públicas</p>
            <h1 id="public-booking-title">
              Abre la agenda de {organizationResult.data.name}
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
              {organizationResult.data.is_booking_public
                ? "Tu agenda está abierta."
                : "Tu agenda sigue privada."}
            </h2>
            <p>
              {organizationResult.data.is_booking_public
                ? "Los visitantes pueden consultar servicios, sucursales y horarios libres. Todavía no pueden crear una reserva."
                : "Nadie puede consultar tus horarios hasta que actives la publicación."}
            </p>
            {bookingUrl ? (
              <div className="public-booking-link">
                <span>Enlace para compartir</span>
                {organizationResult.data.is_booking_public ? (
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
                  action={action}
                  bookingSlug={organizationResult.data.booking_slug}
                  isBookingPublic={organizationResult.data.is_booking_public}
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
