"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const resourceKinds = [
  "person",
  "room",
  "court",
  "equipment",
  "other",
] as const;

export type ResourceFormState = {
  error?: string;
  message?: string;
};

function getText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

export async function createResource(
  organizationId: string,
  _: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  const name = getText(formData, "name");
  const locationId = getText(formData, "locationId");
  const kind = getText(formData, "kind");
  const capacityValue = getText(formData, "capacity");
  const capacity = Number(capacityValue);

  if (!name || name.length < 2 || name.length > 120) {
    return { error: "Escribe un nombre de entre 2 y 120 caracteres." };
  }

  if (!locationId) {
    return { error: "Selecciona la sucursal de este recurso." };
  }

  if (!resourceKinds.includes(kind as (typeof resourceKinds)[number])) {
    return { error: "Selecciona un tipo de recurso válido." };
  }

  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) {
    return { error: "La capacidad debe ser un número entero mayor que cero." };
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

  const { error } = await supabase.from("resources").insert({
    tenant_id: organizationId,
    location_id: location.id,
    name,
    kind: kind as (typeof resourceKinds)[number],
    capacity,
  });

  if (error?.code === "23505") {
    return { error: "Ya existe un recurso con ese nombre en la sucursal." };
  }

  if (error) {
    return { error: "No fue posible crear el recurso. Intenta de nuevo." };
  }

  revalidatePath(`/panel/${organizationId}`);
  revalidatePath(`/panel/${organizationId}/recursos`);

  return { message: "Recurso creado correctamente." };
}
