"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const exceptionKinds = ["available", "unavailable"] as const;

export type AvailabilityFormState = {
  error?: string;
  message?: string;
};

function getText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function isTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function getGuatemalaInstant(value: string) {
  const date = new Date(`${value}:00-06:00`);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createAvailabilityRule(
  organizationId: string,
  _: AvailabilityFormState,
  formData: FormData,
): Promise<AvailabilityFormState> {
  const locationId = getText(formData, "locationId");
  const resourceId = getText(formData, "resourceId") || null;
  const dayOfWeek = Number(getText(formData, "dayOfWeek"));
  const startTime = getText(formData, "startTime");
  const endTime = getText(formData, "endTime");

  if (!locationId) {
    return { error: "Selecciona una sucursal activa." };
  }

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return { error: "Selecciona un día de la semana válido." };
  }

  if (!isTime(startTime) || !isTime(endTime) || startTime >= endTime) {
    return { error: "La hora de inicio debe ser anterior a la hora de fin." };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    return { error: "Tu sesión ya no es válida. Inicia sesión nuevamente." };
  }

  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("tenant_id", organizationId)
    .eq("is_active", true)
    .maybeSingle();

  if (locationError || !location) {
    return { error: "Selecciona una sucursal activa de este negocio." };
  }

  if (resourceId) {
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("id")
      .eq("id", resourceId)
      .eq("tenant_id", organizationId)
      .eq("location_id", location.id)
      .eq("is_active", true)
      .maybeSingle();

    if (resourceError || !resource) {
      return {
        error:
          "El recurso debe estar activo y pertenecer a la sucursal elegida.",
      };
    }
  }

  let overlapQuery = supabase
    .from("availability_rules")
    .select("id")
    .eq("tenant_id", organizationId)
    .eq("location_id", location.id)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .lt("start_time", endTime)
    .gt("end_time", startTime)
    .limit(1);

  overlapQuery = resourceId
    ? overlapQuery.eq("resource_id", resourceId)
    : overlapQuery.is("resource_id", null);

  const { data: overlaps, error: overlapsError } = await overlapQuery;

  if (overlapsError) {
    return { error: "No fue posible validar este horario. Intenta de nuevo." };
  }

  if (overlaps.length) {
    return { error: "Este horario se solapa con una regla existente." };
  }

  const { error } = await supabase.from("availability_rules").insert({
    tenant_id: organizationId,
    location_id: location.id,
    resource_id: resourceId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
  });

  if (error) {
    return { error: "No fue posible crear el horario. Intenta de nuevo." };
  }

  revalidatePath(`/panel/${organizationId}`);
  revalidatePath(`/panel/${organizationId}/disponibilidad`);

  return { message: "Horario semanal creado correctamente." };
}

export async function createAvailabilityException(
  organizationId: string,
  _: AvailabilityFormState,
  formData: FormData,
): Promise<AvailabilityFormState> {
  const locationId = getText(formData, "locationId");
  const resourceId = getText(formData, "resourceId") || null;
  const kind = getText(formData, "kind");
  const startsAt = getGuatemalaInstant(getText(formData, "startsAt"));
  const endsAt = getGuatemalaInstant(getText(formData, "endsAt"));
  const note = getText(formData, "note");

  if (!locationId) {
    return { error: "Selecciona una sucursal activa." };
  }

  if (!exceptionKinds.includes(kind as (typeof exceptionKinds)[number])) {
    return { error: "Selecciona el tipo de excepción." };
  }

  if (!startsAt || !endsAt || startsAt >= endsAt) {
    return { error: "La fecha de inicio debe ser anterior a la fecha de fin." };
  }

  if (note.length > 500) {
    return { error: "La nota no puede superar los 500 caracteres." };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    return { error: "Tu sesión ya no es válida. Inicia sesión nuevamente." };
  }

  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("tenant_id", organizationId)
    .eq("is_active", true)
    .maybeSingle();

  if (locationError || !location) {
    return { error: "Selecciona una sucursal activa de este negocio." };
  }

  if (resourceId) {
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("id")
      .eq("id", resourceId)
      .eq("tenant_id", organizationId)
      .eq("location_id", location.id)
      .eq("is_active", true)
      .maybeSingle();

    if (resourceError || !resource) {
      return {
        error:
          "El recurso debe estar activo y pertenecer a la sucursal elegida.",
      };
    }
  }

  const { error } = await supabase.from("availability_exceptions").insert({
    tenant_id: organizationId,
    location_id: location.id,
    resource_id: resourceId,
    kind: kind as (typeof exceptionKinds)[number],
    starts_at: startsAt,
    ends_at: endsAt,
    note: note || null,
  });

  if (error) {
    return { error: "No fue posible crear la excepción. Intenta de nuevo." };
  }

  revalidatePath(`/panel/${organizationId}`);
  revalidatePath(`/panel/${organizationId}/disponibilidad`);

  return { message: "Excepción de horario creada correctamente." };
}
