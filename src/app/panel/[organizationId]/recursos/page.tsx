import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createResource } from "@/app/panel/[organizationId]/recursos/actions";
import { ResourceForm } from "@/components/resource-form";
import { createClient } from "@/lib/supabase/server";

type ResourcesPageProps = {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ sucursal?: string }>;
};

const resourceKindLabels = {
  person: "Persona",
  room: "Sala",
  court: "Cancha",
  equipment: "Equipo",
  other: "Otro",
};

export const dynamic = "force-dynamic";

export default async function ResourcesPage({
  params,
  searchParams,
}: ResourcesPageProps) {
  const [{ organizationId }, { sucursal: selectedLocationId }] =
    await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (claimsError || !userId) {
    redirect("/iniciar-sesion");
  }

  const [
    membershipResult,
    organizationResult,
    locationsResult,
    resourcesResult,
  ] = await Promise.all([
    supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase
      .from("locations")
      .select("id, name, is_active")
      .eq("tenant_id", organizationId)
      .order("is_active", { ascending: false })
      .order("name"),
    supabase
      .from("resources")
      .select("id, location_id, name, kind, capacity, is_active")
      .eq("tenant_id", organizationId)
      .order("is_active", { ascending: false })
      .order("name"),
  ]);

  if (
    membershipResult.error ||
    organizationResult.error ||
    !membershipResult.data ||
    !organizationResult.data
  ) {
    notFound();
  }

  if (locationsResult.error || resourcesResult.error) {
    throw locationsResult.error || resourcesResult.error;
  }

  const activeLocations = locationsResult.data.filter(
    (location) => location.is_active,
  );
  const locationNames = new Map(
    locationsResult.data.map((location) => [location.id, location.name]),
  );
  const resources = selectedLocationId
    ? resourcesResult.data.filter(
        (resource) => resource.location_id === selectedLocationId,
      )
    : resourcesResult.data;
  const canManage =
    membershipResult.data.role === "owner" ||
    membershipResult.data.role === "admin";
  const action = createResource.bind(null, organizationId);

  return (
    <main className="panel-page workspace-page">
      <section aria-labelledby="resources-title" className="locations-shell">
        <header className="locations-header">
          <div>
            <Link className="panel-back-link" href={`/panel/${organizationId}`}>
              Espacio operativo
            </Link>
            <p className="eyebrow">Configuración comercial</p>
            <h1 id="resources-title">
              Recursos de {organizationResult.data.name}
            </h1>
          </div>
          <p>
            Cada recurso representa una persona, espacio o equipo que puede
            atender una reserva.
          </p>
        </header>

        <div className="locations-grid">
          <section className="locations-list-panel">
            <div className="locations-section-heading">
              <div>
                <p className="eyebrow">Tus recursos</p>
                <h2>
                  {resources.length === 1
                    ? "1 recurso"
                    : `${resources.length} recursos`}
                </h2>
              </div>
              <form className="resource-filter">
                <label>
                  <span>Sucursal</span>
                  <select
                    defaultValue={selectedLocationId || ""}
                    name="sucursal"
                  >
                    <option value="">Todas</option>
                    {locationsResult.data.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit">Filtrar</button>
              </form>
            </div>

            {resources.length ? (
              <>
                <ul className="locations-list">
                  {resources.map((resource) => (
                    <li
                      className="location-card resource-card"
                      key={resource.id}
                    >
                      <div className="location-card-title">
                        <h3>{resource.name}</h3>
                        <span
                          className={
                            resource.is_active
                              ? "location-status location-status-active"
                              : "location-status"
                          }
                        >
                          {resource.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <p>
                        {locationNames.get(resource.location_id) || "Sucursal"}
                      </p>
                      <div className="location-card-meta">
                        <span>{resourceKindLabels[resource.kind]}</span>
                        <span>
                          Capacidad{" "}
                          {resource.capacity === 1 ? "1" : resource.capacity}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link
                  className="locations-next-link"
                  href={`/panel/${organizationId}/servicios`}
                >
                  Continuar con servicios
                </Link>
              </>
            ) : (
              <div className="locations-empty-state">
                <p>Aún no hay recursos para mostrar.</p>
                <span>
                  Crea personas, salas, canchas o equipos para continuar con la
                  configuración de servicios.
                </span>
              </div>
            )}
          </section>

          <aside className="locations-form-panel">
            {canManage && activeLocations.length ? (
              <>
                <p className="eyebrow">Nuevo recurso</p>
                <h2>Agrega algo que se pueda reservar.</h2>
                <p>
                  Vincúlalo a una sucursal activa para usarlo más adelante en
                  tus servicios.
                </p>
                <ResourceForm action={action} locations={activeLocations} />
              </>
            ) : canManage ? (
              <div className="locations-read-only">
                <p className="eyebrow">Primero una sucursal</p>
                <h2>Necesitas una sucursal activa.</h2>
                <p>
                  Los recursos siempre pertenecen a una ubicación de atención.
                </p>
                <Link
                  className="button button-primary location-submit"
                  href={`/panel/${organizationId}/sucursales`}
                >
                  Configurar sucursales
                </Link>
              </div>
            ) : (
              <div className="locations-read-only">
                <p className="eyebrow">Solo lectura</p>
                <h2>Tu rol no puede modificar recursos.</h2>
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
