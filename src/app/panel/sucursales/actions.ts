"use server";

import { revalidatePath } from "next/cache";

import { getActiveWorkspace } from "@/lib/active-workspace";
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
  const { organizationId } = await getActiveWorkspace();

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

  revalidatePath("/panel");
  revalidatePath("/panel/sucursales");

  return { message: "Sucursal creada correctamente." };
}
