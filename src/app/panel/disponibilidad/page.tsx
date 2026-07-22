import Link from "next/link";

import {
  createAvailabilityException,
  createAvailabilityRule,
} from "@/app/panel/disponibilidad/actions";
import { AvailabilityExceptionForm } from "@/components/availability-exception-form";
import { AvailabilityRuleForm } from "@/components/availability-rule-form";
import { getActiveWorkspace } from "@/lib/active-workspace";
import { createClient } from "@/lib/supabase/server";

const dayLabels = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function formatTime(value: string) {
  return value.slice(0, 5);
}

function formatDateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const { organizationId, organizationName, role } = await getActiveWorkspace();
  const supabase = await createClient();
  const [locationsResult, resourcesResult, rulesResult, exceptionsResult] =
    await Promise.all([
      supabase
        .from("locations")
        .select("id, name, timezone, is_active")
        .eq("tenant_id", organizationId)
        .order("name"),
      supabase
        .from("resources")
        .select("id, location_id, name, is_active")
        .eq("tenant_id", organizationId)
        .order("name"),
      supabase
        .from("availability_rules")
        .select(
          "id, location_id, resource_id, day_of_week, start_time, end_time",
        )
        .eq("tenant_id", organizationId)
        .eq("is_active", true)
        .order("day_of_week")
        .order("start_time"),
      supabase
        .from("availability_exceptions")
        .select("id, location_id, resource_id, kind, starts_at, ends_at, note")
        .eq("tenant_id", organizationId)
        .order("starts_at"),
    ]);

  if (
    locationsResult.error ||
    resourcesResult.error ||
    rulesResult.error ||
    exceptionsResult.error
  ) {
    throw (
      locationsResult.error ||
      resourcesResult.error ||
      rulesResult.error ||
      exceptionsResult.error
    );
  }

  const activeLocations = locationsResult.data.filter(
    (location) => location.is_active,
  );
  const locationById = new Map(
    locationsResult.data.map((location) => [location.id, location]),
  );
  const activeResources = resourcesResult.data
    .filter((resource) => resource.is_active)
    .map((resource) => ({
      id: resource.id,
      name: resource.name,
      locationName: locationById.get(resource.location_id)?.name || "Sucursal",
    }));
  const resourceNames = new Map(
    resourcesResult.data.map((resource) => [resource.id, resource.name]),
  );
  const canManage = role === "owner" || role === "admin";

  return (
    <main className="panel-page workspace-page">
      <section aria-labelledby="availability-title" className="locations-shell">
        <header className="locations-header">
          <div>
            <Link className="panel-back-link" href="/panel">
              Espacio operativo
            </Link>
            <p className="eyebrow">Configuración comercial</p>
            <h1 id="availability-title">
              Disponibilidad de {organizationName}
            </h1>
          </div>
          <p>
            Define el horario normal, descansos, cierres y aperturas
            extraordinarias sin crear un calendario por adelantado.
          </p>
        </header>

        {canManage && activeLocations.length ? (
          <div className="availability-forms-grid">
            <section className="availability-form-panel">
              <p className="eyebrow">Horario semanal</p>
              <h2>Establece el ritmo normal.</h2>
              <p>
                El horario de sucursal sirve de base. Un recurso puede tener una
                regla más específica.
              </p>
              <AvailabilityRuleForm
                action={createAvailabilityRule}
                locations={activeLocations}
                resources={activeResources}
              />
            </section>
            <section className="availability-form-panel availability-exception-panel">
              <p className="eyebrow">Excepción fechada</p>
              <h2>Marca cierres o aperturas especiales.</h2>
              <p>
                Úsala para feriados, descansos puntuales y horarios fuera de lo
                habitual.
              </p>
              <AvailabilityExceptionForm
                action={createAvailabilityException}
                locations={activeLocations}
                resources={activeResources}
              />
            </section>
          </div>
        ) : canManage ? (
          <section className="availability-blocked">
            <p className="eyebrow">Primero una sucursal</p>
            <h2>Necesitas una sucursal activa para definir disponibilidad.</h2>
            <Link className="button button-primary" href="/panel/sucursales">
              Configurar sucursales
            </Link>
          </section>
        ) : (
          <section className="availability-blocked">
            <p className="eyebrow">Solo lectura</p>
            <h2>Tu rol no puede modificar la disponibilidad.</h2>
          </section>
        )}

        <div className="availability-lists-grid">
          <section className="locations-list-panel">
            <div className="locations-section-heading">
              <div>
                <p className="eyebrow">Reglas semanales</p>
                <h2>
                  {rulesResult.data.length === 1
                    ? "1 horario"
                    : `${rulesResult.data.length} horarios`}
                </h2>
              </div>
              <span>Recurrente</span>
            </div>
            {rulesResult.data.length ? (
              <ul className="availability-list">
                {rulesResult.data.map((rule) => {
                  const location = locationById.get(rule.location_id);
                  const resourceName = rule.resource_id
                    ? resourceNames.get(rule.resource_id)
                    : null;

                  return (
                    <li key={rule.id}>
                      <strong>{dayLabels[rule.day_of_week]}</strong>
                      <span>
                        {formatTime(rule.start_time)} -{" "}
                        {formatTime(rule.end_time)}
                      </span>
                      <small>
                        {resourceName
                          ? `${resourceName} · ${location?.name || "Sucursal"}`
                          : `${location?.name || "Sucursal"} · Horario general`}
                      </small>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="locations-empty-state">
                <p>Aún no hay horarios semanales.</p>
                <span>
                  Agrega la primera regla para habilitar la agenda base.
                </span>
              </div>
            )}
          </section>

          <section className="locations-list-panel">
            <div className="locations-section-heading">
              <div>
                <p className="eyebrow">Excepciones</p>
                <h2>
                  {exceptionsResult.data.length === 1
                    ? "1 excepción"
                    : `${exceptionsResult.data.length} excepciones`}
                </h2>
              </div>
              <span>Fechadas</span>
            </div>
            {exceptionsResult.data.length ? (
              <ul className="availability-list">
                {exceptionsResult.data.map((exception) => {
                  const location = locationById.get(exception.location_id);
                  const resourceName = exception.resource_id
                    ? resourceNames.get(exception.resource_id)
                    : null;
                  const timeZone = location?.timezone || "America/Guatemala";

                  return (
                    <li key={exception.id}>
                      <strong>
                        {exception.kind === "unavailable"
                          ? "Cierre o descanso"
                          : "Horario extraordinario"}
                      </strong>
                      <span>
                        {formatDateTime(exception.starts_at, timeZone)} -{" "}
                        {formatDateTime(exception.ends_at, timeZone)}
                      </span>
                      <small>
                        {resourceName || location?.name || "Sucursal"}
                        {exception.note ? ` · ${exception.note}` : ""}
                      </small>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="locations-empty-state">
                <p>Aún no hay excepciones.</p>
                <span>
                  Los cierres y horarios extraordinarios aparecerán aquí.
                </span>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
