import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (claimsError || !userId) {
    redirect("/iniciar-sesion");
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .order("created_at");

  if (membershipsError) {
    throw membershipsError;
  }

  if (!memberships.length) {
    redirect("/onboarding");
  }

  const organizationIds = memberships.map(
    (membership) => membership.organization_id,
  );
  const rolesByOrganizationId = new Map(
    memberships.map((membership) => [
      membership.organization_id,
      membership.role,
    ]),
  );
  const { data: organizations, error: organizationsError } = await supabase
    .from("organizations")
    .select("id, name")
    .in("id", organizationIds)
    .order("name");

  if (organizationsError) {
    throw organizationsError;
  }

  const businesses = organizations.flatMap((organization) => {
    const role = rolesByOrganizationId.get(organization.id);

    return role ? [{ ...organization, role }] : [];
  });

  if (!businesses.length) {
    redirect("/onboarding");
  }

  if (businesses.length === 1) {
    redirect(`/panel/${businesses[0].id}`);
  }

  return (
    <main className="panel-page panel-selector-page">
      <section
        aria-labelledby="business-selector-title"
        className="panel-selector"
      >
        <div className="panel-selector-intro">
          <p className="eyebrow">Tus espacios</p>
          <h1 id="business-selector-title">
            Elige el negocio que vas a operar.
          </h1>
          <p>
            Cada agenda mantiene sus servicios, sucursales, recursos y reservas
            separados.
          </p>
        </div>
        <div className="panel-selector-list">
          {businesses.map((business) => (
            <Link
              className="organization-choice"
              href={`/panel/${business.id}`}
              key={business.id}
            >
              <span className="organization-choice-label">Negocio</span>
              <strong>{business.name}</strong>
              <span>
                {business.role === "owner"
                  ? "Propietario"
                  : business.role === "admin"
                    ? "Administrador"
                    : "Personal"}
              </span>
            </Link>
          ))}
        </div>
        <Link className="panel-home-link" href="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
