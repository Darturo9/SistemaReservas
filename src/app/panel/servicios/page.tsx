import Link from "next/link";

import { createService } from "@/app/panel/servicios/actions";
import { ServiceForm } from "@/components/service-form";
import { getActiveWorkspace } from "@/lib/active-workspace";
import { createClient } from "@/lib/supabase/server";

function formatPrice(priceCents: number | null) {
  if (priceCents === null) {
    return "Precio pendiente";
  }

  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(priceCents / 100);
}

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const { organizationId, organizationName, role } = await getActiveWorkspace();
  const supabase = await createClient();
  const [
    locationsResult,
    resourcesResult,
    servicesResult,
    serviceResourcesResult,
  ] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name")
      .eq("tenant_id", organizationId),
    supabase
      .from("resources")
      .select("id, location_id, name, is_active")
      .eq("tenant_id", organizationId)
      .order("name"),
    supabase
      .from("services")
      .select(
        "id, name, duration_minutes, buffer_before_minutes, buffer_after_minutes, price_cents, approval_policy, is_active",
      )
      .eq("tenant_id", organizationId)
      .order("is_active", { ascending: false })
      .order("name"),
    supabase
      .from("service_resources")
      .select("service_id, resource_id")
      .eq("tenant_id", organizationId),
  ]);

  if (
    locationsResult.error ||
    resourcesResult.error ||
    servicesResult.error ||
    serviceResourcesResult.error
  ) {
    throw (
      locationsResult.error ||
      resourcesResult.error ||
      servicesResult.error ||
      serviceResourcesResult.error
    );
  }

  const locationNames = new Map(
    locationsResult.data.map((location) => [location.id, location.name]),
  );
  const activeResources = resourcesResult.data
    .filter((resource) => resource.is_active)
    .map((resource) => ({
      id: resource.id,
      name: resource.name,
      locationName: locationNames.get(resource.location_id) || "Sucursal",
    }));
  const resourceNames = new Map(
    resourcesResult.data.map((resource) => [resource.id, resource.name]),
  );
  const resourcesByServiceId = new Map<string, string[]>();

  for (const relationship of serviceResourcesResult.data) {
    const resourceName = resourceNames.get(relationship.resource_id);

    if (resourceName) {
      const names = resourcesByServiceId.get(relationship.service_id) || [];

      names.push(resourceName);
      resourcesByServiceId.set(relationship.service_id, names);
    }
  }

  const canManage = role === "owner" || role === "admin";

  return (
    <main className="panel-page workspace-page">
      <section aria-labelledby="services-title" className="locations-shell">
        <header className="locations-header">
          <div>
            <Link className="panel-back-link" href="/panel">
              Espacio operativo
            </Link>
            <p className="eyebrow">Configuración comercial</p>
            <h1 id="services-title">Servicios de {organizationName}</h1>
          </div>
          <p>
            Define qué se puede reservar, cuánto dura y qué recursos pueden
            prestarlo.
          </p>
        </header>

        <div className="locations-grid">
          <section className="locations-list-panel">
            <div className="locations-section-heading">
              <div>
                <p className="eyebrow">Tus servicios</p>
                <h2>
                  {servicesResult.data.length === 1
                    ? "1 servicio"
                    : `${servicesResult.data.length} servicios`}
                </h2>
              </div>
              <span>GTQ</span>
            </div>

            {servicesResult.data.length ? (
              <>
                <ul className="locations-list">
                  {servicesResult.data.map((service) => {
                    const compatibleResources =
                      resourcesByServiceId.get(service.id) || [];

                    return (
                      <li
                        className="location-card service-card"
                        key={service.id}
                      >
                        <div className="location-card-title">
                          <h3>{service.name}</h3>
                          <span
                            className={
                              service.is_active
                                ? "location-status location-status-active"
                                : "location-status"
                            }
                          >
                            {service.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        <p>
                          {service.duration_minutes} min ·{" "}
                          {formatPrice(service.price_cents)}
                        </p>
                        <div className="location-card-meta">
                          <span>
                            {service.approval_policy === "automatic"
                              ? "Confirmación automática"
                              : "Aprobación manual"}
                          </span>
                          <span>
                            Margen {service.buffer_before_minutes}/
                            {service.buffer_after_minutes} min
                          </span>
                        </div>
                        <div className="service-card-resources">
                          {compatibleResources.length
                            ? compatibleResources.join(" · ")
                            : "Sin recursos compatibles"}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  className="locations-next-link"
                  href="/panel/disponibilidad"
                >
                  Continuar con disponibilidad
                </Link>
              </>
            ) : (
              <div className="locations-empty-state">
                <p>Aún no hay servicios para mostrar.</p>
                <span>
                  Crea tu primer servicio y conéctalo con los recursos que lo
                  pueden atender.
                </span>
              </div>
            )}
          </section>

          <aside className="locations-form-panel">
            {canManage && activeResources.length ? (
              <>
                <p className="eyebrow">Nuevo servicio</p>
                <h2>Define una experiencia reservable.</h2>
                <p>
                  La duración y los márgenes preparan el cálculo de horarios de
                  la siguiente fase.
                </p>
                <ServiceForm
                  action={createService}
                  resources={activeResources}
                />
              </>
            ) : canManage ? (
              <div className="locations-read-only">
                <p className="eyebrow">Primero un recurso</p>
                <h2>Necesitas al menos un recurso activo.</h2>
                <p>Todo servicio debe indicar quién o qué puede atenderlo.</p>
                <Link
                  className="button button-primary location-submit"
                  href="/panel/recursos"
                >
                  Configurar recursos
                </Link>
              </div>
            ) : (
              <div className="locations-read-only">
                <p className="eyebrow">Solo lectura</p>
                <h2>Tu rol no puede modificar servicios.</h2>
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
