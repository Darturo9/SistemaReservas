import Link from "next/link";

import { createLocation } from "@/app/panel/sucursales/actions";
import { LocationForm } from "@/components/location-form";
import { getActiveWorkspace } from "@/lib/active-workspace";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const { organizationId, organizationName, role } = await getActiveWorkspace();
  const supabase = await createClient();
  const { data: locations, error: locationsError } = await supabase
    .from("locations")
    .select(
      "id, name, address, contact_phone, contact_email, timezone, is_active",
    )
    .eq("tenant_id", organizationId)
    .order("is_active", { ascending: false })
    .order("name");

  if (locationsError) {
    throw locationsError;
  }

  const canManage = role === "owner" || role === "admin";

  return (
    <main className="panel-page workspace-page">
      <section aria-labelledby="locations-title" className="locations-shell">
        <header className="locations-header">
          <div>
            <Link className="panel-back-link" href="/panel">
              Espacio operativo
            </Link>
            <p className="eyebrow">Configuración comercial</p>
            <h1 id="locations-title">Sucursales de {organizationName}</h1>
          </div>
          <p>
            Cada sucursal tendrá su propio horario y concentrará los recursos
            que pueden atender reservas.
          </p>
        </header>

        <div className="locations-grid">
          <section className="locations-list-panel">
            <div className="locations-section-heading">
              <div>
                <p className="eyebrow">Tus sucursales</p>
                <h2>
                  {locations.length === 1
                    ? "1 sucursal"
                    : `${locations.length} sucursales`}
                </h2>
              </div>
              <span>Guatemala</span>
            </div>

            {locations.length ? (
              <>
                <ul className="locations-list">
                  {locations.map((location) => (
                    <li className="location-card" key={location.id}>
                      <div className="location-card-title">
                        <h3>{location.name}</h3>
                        <span
                          className={
                            location.is_active
                              ? "location-status location-status-active"
                              : "location-status"
                          }
                        >
                          {location.is_active ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                      <p>{location.address || "Dirección pendiente"}</p>
                      <div className="location-card-meta">
                        <span>
                          {location.contact_phone || "Teléfono pendiente"}
                        </span>
                        <span>
                          {location.contact_email || "Correo pendiente"}
                        </span>
                        <span>{location.timezone}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link className="locations-next-link" href="/panel/recursos">
                  Continuar con recursos
                </Link>
              </>
            ) : (
              <div className="locations-empty-state">
                <p>Aún no has creado una sucursal.</p>
                <span>
                  Comienza con la ubicación donde atenderás tus primeras
                  reservas.
                </span>
              </div>
            )}
          </section>

          <aside className="locations-form-panel">
            {canManage ? (
              <>
                <p className="eyebrow">Nueva sucursal</p>
                <h2>Agrega un lugar de atención.</h2>
                <p>
                  Podrás asociar recursos, servicios y horarios en los
                  siguientes pasos.
                </p>
                <LocationForm action={createLocation} />
              </>
            ) : (
              <div className="locations-read-only">
                <p className="eyebrow">Solo lectura</p>
                <h2>Tu rol no puede modificar sucursales.</h2>
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
