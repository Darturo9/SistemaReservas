"use client";

import { useRouter } from "next/navigation";

type PublicBookingFiltersFormLocation = {
  location_id: string;
  location_name: string;
};

type PublicBookingFiltersFormService = {
  service_duration_minutes: number;
  service_id: string;
  service_name: string;
};

type PublicBookingFiltersFormProps = {
  locations: PublicBookingFiltersFormLocation[];
  maxDate: string;
  selectedDate: string;
  selectedLocationId: string;
  selectedServiceId: string;
  servicesForLocation: PublicBookingFiltersFormService[];
  slug: string;
  today: string;
};

export function PublicBookingFiltersForm({
  locations,
  maxDate,
  selectedDate,
  selectedLocationId,
  selectedServiceId,
  servicesForLocation,
  slug,
  today,
}: PublicBookingFiltersFormProps) {
  const router = useRouter();

  function replaceFilters(next: {
    date: string;
    locationId: string;
    serviceId?: string;
  }) {
    const query = new URLSearchParams({
      date: next.date,
      locationId: next.locationId,
    });

    if (next.serviceId) {
      query.set("serviceId", next.serviceId);
    }

    router.replace(`/reservar/${slug}?${query.toString()}`, {
      scroll: false,
    });
  }

  return (
    <form className="public-booking-filters" method="get">
      <label className="field">
        <span>Sucursal</span>
        <select
          defaultValue={selectedLocationId}
          name="locationId"
          onChange={(event) => {
            replaceFilters({
              date: selectedDate,
              locationId: event.target.value,
            });
          }}
        >
          {locations.map((location) => (
            <option key={location.location_id} value={location.location_id}>
              {location.location_name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Servicio</span>
        <select
          defaultValue={selectedServiceId}
          name="serviceId"
          onChange={(event) => {
            replaceFilters({
              date: selectedDate,
              locationId: selectedLocationId,
              serviceId: event.target.value,
            });
          }}
        >
          {servicesForLocation.map((service) => (
            <option key={service.service_id} value={service.service_id}>
              {service.service_name} · {service.service_duration_minutes} min
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Fecha</span>
        <input
          defaultValue={selectedDate}
          max={maxDate}
          min={today}
          name="date"
          onChange={(event) => {
            replaceFilters({
              date: event.target.value,
              locationId: selectedLocationId,
              serviceId: selectedServiceId,
            });
          }}
          required
          type="date"
        />
      </label>
      <button className="button button-primary" type="submit">
        Ver horarios
      </button>
    </form>
  );
}
