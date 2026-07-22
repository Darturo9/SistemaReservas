"use client";

import { useState } from "react";
import Link from "next/link";

type PublicTimeSlot = {
  available_resource_count: number;
  ends_at: string;
  starts_at: string;
};

type TimePeriod = {
  id: "early" | "morning" | "afternoon" | "night";
  label: string;
  slots: PublicTimeSlot[];
};

type PublicTimeSelectionProps = {
  date: string;
  locationId: string;
  serviceId: string;
  slots: PublicTimeSlot[];
  slug: string;
  timeZone: string;
};

const initialSlotLimit = 12;

function getLocalHour(value: string, timeZone: string) {
  const hour = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone,
  })
    .formatToParts(new Date(value))
    .find((part) => part.type === "hour")?.value;

  return Number(hour);
}

function getTimePeriod(hour: number): TimePeriod["id"] {
  if (hour < 6) {
    return "early";
  }

  if (hour < 12) {
    return "morning";
  }

  if (hour < 18) {
    return "afternoon";
  }

  return "night";
}

function formatTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

function createTimePeriods(slots: PublicTimeSlot[], timeZone: string) {
  const periods: TimePeriod[] = [
    { id: "early", label: "Madrugada", slots: [] },
    { id: "morning", label: "Mañana", slots: [] },
    { id: "afternoon", label: "Tarde", slots: [] },
    { id: "night", label: "Noche", slots: [] },
  ];

  for (const slot of slots) {
    const period = periods.find(
      (item) =>
        item.id === getTimePeriod(getLocalHour(slot.starts_at, timeZone)),
    );

    period?.slots.push(slot);
  }

  return periods.filter((period) => period.slots.length > 0);
}

export function PublicTimeSelection({
  date,
  locationId,
  serviceId,
  slots,
  slug,
  timeZone,
}: PublicTimeSelectionProps) {
  const periods = createTimePeriods(slots, timeZone);
  const [activePeriodId, setActivePeriodId] = useState<
    TimePeriod["id"] | undefined
  >(periods[0]?.id);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!periods.length) {
    return (
      <div className="public-booking-empty">
        <p>No hay horarios disponibles para esta fecha.</p>
        <span>Prueba con otro día, sucursal o servicio.</span>
      </div>
    );
  }

  const activePeriod =
    periods.find((period) => period.id === activePeriodId) || periods[0];
  const visibleSlots = isExpanded
    ? activePeriod.slots
    : activePeriod.slots.slice(0, initialSlotLimit);
  const hiddenSlotCount = activePeriod.slots.length - visibleSlots.length;

  return (
    <div className="public-booking-time-selection">
      <div
        aria-label="Franja horaria"
        className="public-booking-time-periods"
        role="group"
      >
        {periods.map((period) => (
          <button
            aria-pressed={period.id === activePeriod.id}
            className={
              period.id === activePeriod.id
                ? "public-booking-time-period public-booking-time-period-active"
                : "public-booking-time-period"
            }
            key={period.id}
            onClick={() => {
              setActivePeriodId(period.id);
              setIsExpanded(false);
            }}
            type="button"
          >
            <span>{period.label}</span>
            <small>{period.slots.length}</small>
          </button>
        ))}
      </div>

      <div className="public-booking-time-selection-heading">
        <h3>{activePeriod.label}</h3>
        <p>{activePeriod.slots.length} horarios disponibles</p>
      </div>

      <ul className="public-booking-time-grid">
        {visibleSlots.map((slot) => {
          const startTime = formatTime(slot.starts_at, timeZone);
          const endTime = formatTime(slot.ends_at, timeZone);
          const resourceLabel =
            slot.available_resource_count === 1
              ? "1 espacio disponible"
              : `${slot.available_resource_count} espacios disponibles`;
          const query = new URLSearchParams({
            date,
            locationId,
            serviceId,
            startsAt: slot.starts_at,
          });

          return (
            <li key={slot.starts_at}>
              <Link
                aria-label={`${startTime}. Termina a las ${endTime}. ${resourceLabel}.`}
                className="public-booking-time-option"
                href={`/reservar/${slug}?${query.toString()}`}
              >
                <time dateTime={slot.starts_at}>{startTime}</time>
              </Link>
            </li>
          );
        })}
      </ul>

      {hiddenSlotCount > 0 ? (
        <button
          className="public-booking-show-more"
          onClick={() => setIsExpanded(true)}
          type="button"
        >
          Ver {hiddenSlotCount} horario{hiddenSlotCount === 1 ? "" : "s"} más
        </button>
      ) : null}
    </div>
  );
}
