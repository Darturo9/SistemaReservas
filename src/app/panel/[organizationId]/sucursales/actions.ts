"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type LocationFormState = {
  error?: string;
  message?: string;
};

function getOptionalText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() || null : null;
}

export async function createLocation(
  organizationId: string,
  _: LocationFormState,
  formData: FormData,
): Promise<LocationFormState> {
  const name = getOptionalText(formData, "name");
  const address = getOptionalText(formData, "address");
  const contactPhone = getOptionalText(formData, "contactPhone");
  const contactEmail = getOptionalText(formData, "contactEmail");

  if (!name || name.length < 2 || name.length > 120) {
    return { error: "Escribe un nombre de entre 2 y 120 caracteres." };
  }

  if (address && address.length > 500) {
    return { error: "La dirección no puede superar los 500 caracteres." };
  }

  if (contactPhone && contactPhone.length > 30) {
    return { error: "El teléfono no puede superar los 30 caracteres." };
  }

  if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail)) {
    return { error: "Escribe un correo de contacto válido." };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    return { error: "Tu sesión ya no es válida. Inicia sesión nuevamente." };
  }

  const { error } = await supabase.from("locations").insert({
    tenant_id: organizationId,
    name,
    address,
    contact_phone: contactPhone,
    contact_email: contactEmail,
  });

  if (error?.code === "23505") {
    return { error: "Ya existe una sucursal con ese nombre." };
  }

  if (error) {
    return { error: "No fue posible crear la sucursal. Intenta de nuevo." };
  }

  revalidatePath(`/panel/${organizationId}`);
  revalidatePath(`/panel/${organizationId}/sucursales`);

  return { message: "Sucursal creada correctamente." };
}
