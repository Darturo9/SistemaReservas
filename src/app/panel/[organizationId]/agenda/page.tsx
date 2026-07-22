import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { resolvePendingBookingApproval } from "@/app/panel/[organizationId]/agenda/actions";
import { BookingApprovalActions } from "@/components/booking-approval-actions";
import { createClient } from "@/lib/supabase/server";

type AgendaPageProps = {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{
    date?: string;
    locationId?: string;
    resourceId?: string;
    serviceId?: string;
  }>;
};

function getDateInTimeZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isDate(value: string | undefined): value is string {
  return value !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatSlot(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

function formatBookingDateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone,
  }).format(new Date(value));
}

export const dynamic = "force-dynamic";

export default async function AgendaPage({
  params,
  searchParams,
}: AgendaPageProps) {
  const { organizationId } = await params;
  const filters = await searchParams;
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
    servicesResult,
    serviceResourcesResult,
    pendingBookingsResult,
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
      .select("id, name, timezone")
      .eq("tenant_id", organizationId)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("resources")
      .select("id, location_id, name")
      .eq("tenant_id", organizationId)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("services")
      .select(
        "id, name, duration_minutes, buffer_before_minutes, buffer_after_minutes",
      )
      .eq("tenant_id", organizationId)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("service_resources")
      .select("service_id, resource_id")
      .eq("tenant_id", organizationId),
    supabase
      .from("bookings")
      .select(
        "id, customer_id, ends_at, location_id, resource_id, service_id, starts_at",
      )
      .eq("tenant_id", organizationId)
      .eq("status", "pending_approval")
      .order("starts_at")
      .limit(20),
  ]);

  if (
    membershipResult.error ||
    organizationResult.error ||
    !membershipResult.data ||
    !organizationResult.data
  ) {
    notFound();
  }

  if (
    locationsResult.error ||
    resourcesResult.error ||
    servicesResult.error ||
    serviceResourcesResult.error ||
    pendingBookingsResult.error
  ) {
    throw (
      locationsResult.error ||
      resourcesResult.error ||
      servicesResult.error ||
      serviceResourcesResult.error ||
      pendingBookingsResult.error
    );
  }

  const pendingCustomerIds = [
    ...new Set(
      pendingBookingsResult.data
        .map((booking) => booking.customer_id)
        .filter((customerId): customerId is string => Boolean(customerId)),
    ),
  ];
  let pendingCustomers: { full_name: string; id: string }[] = [];
  let pendingContacts: {
    customer_id: string;
    kind: "email" | "phone";
    value: string;
  }[] = [];

  if (pendingCustomerIds.length) {
    const [customersResult, contactsResult] = await Promise.all([
      supabase
        .from("customers")
        .select("id, full_name")
        .eq("tenant_id", organizationId)
        .in("id", pendingCustomerIds),
      supabase
        .from("customer_contacts")
        .select("customer_id, kind, value")
        .eq("tenant_id", organizationId)
        .in("customer_id", pendingCustomerIds),
    ]);

    if (customersResult.error || contactsResult.error) {
      throw customersResult.error || contactsResult.error;
    }

    pendingCustomers = customersResult.data;
    pendingContacts = contactsResult.data;
  }

  const selectedLocation =
    locationsResult.data.find(
      (location) => location.id === filters.locationId,
    ) || locationsResult.data[0];
  const resourceById = new Map(
    resourcesResult.data.map((resource) => [resource.id, resource]),
  );
  const locationById = new Map(
    locationsResult.data.map((location) => [location.id, location]),
  );
  const serviceById = new Map(
    servicesResult.data.map((service) => [service.id, service]),
  );
  const customerNameById = new Map(
    pendingCustomers.map((customer) => [customer.id, customer.full_name]),
  );
  const contactsByCustomerId = new Map<
    string,
    { email?: string; phone?: string }
  >();

  for (const contact of pendingContacts) {
    const contacts = contactsByCustomerId.get(contact.customer_id) || {};

    contacts[contact.kind] = contact.value;
    contactsByCustomerId.set(contact.customer_id, contacts);
  }
  const compatibleResourceIdsByService = new Map<string, Set<string>>();

  for (const relationship of serviceResourcesResult.data) {
    const resourceIds = compatibleResourceIdsByService.get(
      relationship.service_id,
    );

    if (resourceIds) {
      resourceIds.add(relationship.resource_id);
    } else {
      compatibleResourceIdsByService.set(
        relationship.service_id,
        new Set([relationship.resource_id]),
      );
    }
  }

  const servicesForLocation = selectedLocation
    ? servicesResult.data.filter((service) =>
        [...(compatibleResourceIdsByService.get(service.id) || [])].some(
          (resourceId) =>
            resourceById.get(resourceId)?.location_id === selectedLocation.id,
        ),
      )
    : [];
  const selectedService =
    servicesForLocation.find((service) => service.id === filters.serviceId) ||
    servicesForLocation[0];
  const resourcesForService =
    selectedLocation && selectedService
      ? [...(compatibleResourceIdsByService.get(selectedService.id) || [])]
          .map((resourceId) => resourceById.get(resourceId))
          .filter(
            (resource): resource is NonNullable<typeof resource> =>
              resource?.location_id === selectedLocation.id,
          )
      : [];
  const selectedResource = resourcesForService.find(
    (resource) => resource.id === filters.resourceId,
  );
  const selectedDate = isDate(filters.date)
    ? filters.date
    : getDateInTimeZone(selectedLocation?.timezone || "America/Guatemala");
  const canManageBookings = membershipResult.data.role !== "staff";
  const approvalAction = resolvePendingBookingApproval.bind(
    null,
    organizationId,
  );

  let slots:
    | {
        available_resource_count: number;
        ends_at: string;
        resource_ids: string[];
        starts_at: string;
      }[]
    | null = null;

  if (selectedLocation && selectedService) {
    const { data, error } = await supabase.rpc("list_available_slots", {
      p_date: selectedDate,
      p_interval_minutes: 15,
      p_location_id: selectedLocation.id,
      p_resource_id: selectedResource?.id,
      p_service_id: selectedService.id,
      p_tenant_id: organizationId,
    });

    if (error) {
      throw error;
    }

    slots = data;
  }

  return (
    <main className="panel-page workspace-page">
      <section aria-labelledby="agenda-title" className="locations-shell">
        <header className="locations-header">
          <div>
            <Link className="panel-back-link" href={`/panel/${organizationId}`}>
              Espacio operativo
            </Link>
            <p className="eyebrow">Motor de agenda</p>
            <h1 id="agenda-title">
              Disponibilidad de {organizationResult.data.name}
            </h1>
          </div>
          <p>
            Revisa los horarios que el motor puede ofrecer antes de abrir las
            reservas al público.
          </p>
        </header>

        <section
          aria-labelledby="pending-approvals-title"
          className="booking-approvals-panel"
        >
          <div className="locations-section-heading">
            <div>
              <p className="eyebrow">Acción requerida</p>
              <h2 id="pending-approvals-title">Reservas por aprobar</h2>
            </div>
            <span>
              {pendingBookingsResult.data.length === 1
                ? "1 solicitud"
                : `${pendingBookingsResult.data.length} solicitudes`}
            </span>
          </div>

          {pendingBookingsResult.data.length ? (
            <ul className="booking-approvals-list">
              {pendingBookingsResult.data.map((booking) => {
                const location = locationById.get(booking.location_id);
                const service = serviceById.get(booking.service_id);
                const resource = resourceById.get(booking.resource_id);
                const contacts = booking.customer_id
                  ? contactsByCustomerId.get(booking.customer_id)
                  : undefined;
                const timeZone = location?.timezone || "America/Guatemala";

                return (
                  <li key={booking.id}>
                    <div className="booking-approval-identity">
                      <p className="booking-approval-status">
                        Pendiente de aprobación
                      </p>
                      <h3>
                        {booking.customer_id
                          ? customerNameById.get(booking.customer_id)
                          : "Cliente sin identificar"}
                      </h3>
                      <p>{contacts?.email || "Correo no disponible"}</p>
                      <p>{contacts?.phone || "Teléfono no disponible"}</p>
                    </div>
                    <div className="booking-approval-slot">
                      <strong>{service?.name || "Servicio"}</strong>
                      <span>
                        {formatBookingDateTime(booking.starts_at, timeZone)} ·{" "}
                        {formatSlot(booking.starts_at, timeZone)} a{" "}
                        {formatSlot(booking.ends_at, timeZone)}
                      </span>
                      <small>
                        {location?.name || "Sucursal"} ·{" "}
                        {resource?.name || "Recurso"}
                      </small>
                    </div>
                    {canManageBookings ? (
                      <BookingApprovalActions
                        action={approvalAction}
                        bookingId={booking.id}
                      />
                    ) : (
                      <p className="booking-approval-read-only">
                        Solo propietarios y administradores pueden resolverla.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="booking-approvals-empty">
              No hay solicitudes pendientes por decidir.
            </p>
          )}
        </section>

        {selectedLocation && servicesForLocation.length ? (
          <>
            <form className="agenda-filter" method="get">
              <label className="field">
                <span>Sucursal</span>
                <select defaultValue={selectedLocation.id} name="locationId">
                  {locationsResult.data.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Servicio</span>
                <select defaultValue={selectedService?.id} name="serviceId">
                  {servicesForLocation.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} · {service.duration_minutes} min
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Recurso</span>
                <select
                  defaultValue={selectedResource?.id || ""}
                  name="resourceId"
                >
                  <option value="">Cualquiera disponible</option>
                  {resourcesForService.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Fecha</span>
                <input
                  defaultValue={selectedDate}
                  name="date"
                  required
                  type="date"
                />
              </label>
              <button className="button button-primary" type="submit">
                Ver horarios
              </button>
            </form>

            <section className="agenda-results" aria-live="polite">
              <div className="locations-section-heading">
                <div>
                  <p className="eyebrow">Slots de 15 minutos</p>
                  <h2>
                    {slots?.length === 1
                      ? "1 horario disponible"
                      : `${slots?.length || 0} horarios disponibles`}
                  </h2>
                </div>
                <span>{selectedLocation.timezone}</span>
              </div>

              {slots?.length ? (
                <ul className="agenda-slots-list">
                  {slots.map((slot) => {
                    const resourceNames = slot.resource_ids
                      .map((resourceId) => resourceById.get(resourceId)?.name)
                      .filter((name): name is string => Boolean(name));

                    return (
                      <li key={slot.starts_at}>
                        <strong>
                          {formatSlot(
                            slot.starts_at,
                            selectedLocation.timezone,
                          )}
                          <small>
                            hasta{" "}
                            {formatSlot(
                              slot.ends_at,
                              selectedLocation.timezone,
                            )}
                          </small>
                        </strong>
                        <span>
                          {slot.available_resource_count === 1
                            ? "1 recurso libre"
                            : `${slot.available_resource_count} recursos libres`}
                        </span>
                        <p>{resourceNames.join(" · ")}</p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="locations-empty-state">
                  <p>No hay horarios para esta selección.</p>
                  <span>
                    Revisa las reglas, excepciones, recursos compatibles y
                    márgenes del servicio.
                  </span>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="availability-blocked">
            <p className="eyebrow">Configuración pendiente</p>
            <h2>Necesitas una sucursal y un servicio compatible.</h2>
            <p>
              Crea recursos activos, relaciónalos con un servicio y establece su
              disponibilidad para calcular slots.
            </p>
            <Link
              className="button button-primary"
              href={`/panel/${organizationId}/servicios`}
            >
              Configurar servicios
            </Link>
          </section>
        )}
      </section>
    </main>
  );
}
