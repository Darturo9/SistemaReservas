import { notFound } from "next/navigation";

import { createPublicBookingHold } from "@/app/reservar/actions";
import { PublicBookingFiltersForm } from "@/components/public-booking-filters-form";
import { PublicBookingHoldForm } from "@/components/public-booking-hold-form";
import { PublicBookingStepper } from "@/components/public-booking-stepper";
import { PublicTimeSelection } from "@/components/public-time-selection";
import { createPublicClient } from "@/lib/supabase/public";

type PublicBookingPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    date?: string;
    locationId?: string;
    serviceId?: string;
    startsAt?: string;
  }>;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

function isValidDate(value: string | undefined): value is string {
  if (!value || !DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function addDays(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return date.toISOString().slice(0, 10);
}

function formatSlot(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

function formatPrice(priceCents: number | null, currency: string) {
  if (priceCents === null) {
    return null;
  }

  return new Intl.NumberFormat("es-GT", {
    currency,
    style: "currency",
  }).format(priceCents / 100);
}

function formatDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "full",
    timeZone,
  }).format(new Date(`${value}T12:00:00Z`));
}

export const dynamic = "force-dynamic";

export default async function PublicBookingPage({
  params,
  searchParams,
}: PublicBookingPageProps) {
  const [{ slug }, filters] = await Promise.all([params, searchParams]);
  const supabase = createPublicClient();
  const { data: catalog, error: catalogError } = await supabase.rpc(
    "get_public_booking_catalog",
    { p_booking_slug: slug },
  );

  if (catalogError) {
    throw catalogError;
  }

  if (!catalog?.length) {
    notFound();
  }

  const locationById = new Map<string, (typeof catalog)[number]>();
  for (const item of catalog) {
    if (!locationById.has(item.location_id)) {
      locationById.set(item.location_id, item);
    }
  }

  const locations = [...locationById.values()];
  const selectedLocation =
    locations.find((location) => location.location_id === filters.locationId) ||
    locations[0];
  const servicesForLocation = catalog.filter(
    (item) => item.location_id === selectedLocation.location_id,
  );
  const selectedService =
    servicesForLocation.find(
      (service) => service.service_id === filters.serviceId,
    ) || servicesForLocation[0];
  const today = getDateInTimeZone(selectedLocation.location_timezone);
  const selectedDate = isValidDate(filters.date) ? filters.date : today;
  const maxDate = addDays(today, 90);

  const { data: slots, error: slotsError } = await supabase.rpc(
    "list_public_available_slots",
    {
      p_date: selectedDate,
      p_interval_minutes: 15,
      p_location_id: selectedLocation.location_id,
      p_service_id: selectedService.service_id,
    },
  );

  if (slotsError) {
    throw slotsError;
  }

  const selectedSlot = slots?.find(
    (slot) => slot.starts_at === filters.startsAt,
  );
  const holdAction = selectedSlot
    ? createPublicBookingHold.bind(
        null,
        slug,
        selectedLocation.location_id,
        selectedService.service_id,
        selectedSlot.starts_at,
      )
    : null;

  const price = formatPrice(
    selectedService.service_price_cents,
    selectedService.service_currency,
  );
  const editBookingQuery = new URLSearchParams({
    date: selectedDate,
    locationId: selectedLocation.location_id,
    serviceId: selectedService.service_id,
  });

  return (
    <main className="public-booking-page">
      <section className="public-booking-shell">
        <header className="public-booking-header">
          <a className="public-booking-wordmark" href={`/reservar/${slug}`}>
            <span aria-hidden="true">R</span>
            Reserva
          </a>
          <p>Reserva en línea</p>
        </header>

        <div className="public-booking-intro">
          <p className="eyebrow">Agenda de {catalog[0].organization_name}</p>
          <h1>
            {selectedSlot
              ? "Completa tu reserva en tres pasos."
              : "Encuentra el momento que te quede mejor."}
          </h1>
          <p>
            {selectedSlot
              ? "Ya elegiste tu horario. Completa tus datos y valida la solicitud desde WhatsApp."
              : "Elige el servicio y la sucursal. Te mostraremos los horarios que siguen libres para atenderte."}
          </p>
        </div>

        <PublicBookingStepper currentStep={selectedSlot ? 2 : 1} />

        {!selectedSlot ? (
          <>
            <PublicBookingFiltersForm
              key={`${selectedLocation.location_id}:${selectedService.service_id}:${selectedDate}`}
              locations={locations}
              maxDate={maxDate}
              selectedDate={selectedDate}
              selectedLocationId={selectedLocation.location_id}
              selectedServiceId={selectedService.service_id}
              servicesForLocation={servicesForLocation}
              slug={slug}
              today={today}
            />

            <section aria-live="polite" className="public-booking-results">
              <div className="public-booking-results-heading">
                <div>
                  <p className="eyebrow">{selectedLocation.location_name}</p>
                  <h2>{selectedService.service_name}</h2>
                  <p>
                    {selectedService.service_duration_minutes} min
                    {price ? ` · ${price}` : ""}
                    {selectedService.service_description
                      ? ` · ${selectedService.service_description}`
                      : ""}
                  </p>
                  <p className="public-booking-results-date">
                    {formatDate(
                      selectedDate,
                      selectedLocation.location_timezone,
                    )}
                  </p>
                </div>
                <span>{selectedLocation.location_timezone}</span>
              </div>

              <PublicTimeSelection
                date={selectedDate}
                key={`${selectedLocation.location_id}:${selectedService.service_id}:${selectedDate}`}
                locationId={selectedLocation.location_id}
                serviceId={selectedService.service_id}
                slots={slots || []}
                slug={slug}
                timeZone={selectedLocation.location_timezone}
              />
            </section>
          </>
        ) : null}

        {selectedSlot && holdAction ? (
          <PublicBookingHoldForm
            action={holdAction}
            editBookingHref={`/reservar/${slug}?${editBookingQuery.toString()}`}
            serviceName={selectedService.service_name}
            slotLabel={`${formatSlot(selectedSlot.starts_at, selectedLocation.location_timezone)} a ${formatSlot(selectedSlot.ends_at, selectedLocation.location_timezone)}`}
          />
        ) : null}

        {!selectedSlot ? (
          <p className="public-booking-notice">
            Selecciona un horario para continuar. Tendrás 15 minutos para
            validarlo desde WhatsApp.
          </p>
        ) : null}
      </section>
    </main>
  );
}
