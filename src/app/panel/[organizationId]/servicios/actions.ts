"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const approvalPolicies = ["automatic", "manual"] as const;

export type ServiceFormState = {
  error?: string;
  message?: string;
};

function getText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function getInteger(value: string) {
  const number = Number(value);

  return Number.isInteger(number) ? number : null;
}

export async function createService(
  organizationId: string,
  _: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const name = getText(formData, "name");
  const description = getText(formData, "description");
  const durationMinutes = getInteger(getText(formData, "durationMinutes"));
  const bufferBeforeMinutes = getInteger(
    getText(formData, "bufferBeforeMinutes"),
  );
  const bufferAfterMinutes = getInteger(
    getText(formData, "bufferAfterMinutes"),
  );
  const cancellationNoticeMinutes = getInteger(
    getText(formData, "cancellationNoticeMinutes"),
  );
  const price = Number(getText(formData, "price"));
  const approvalPolicy = getText(formData, "approvalPolicy");
  const resourceIds = formData
    .getAll("resourceIds")
    .filter((value): value is string => typeof value === "string");

  if (!name || name.length < 2 || name.length > 120) {
    return { error: "Escribe un nombre de entre 2 y 120 caracteres." };
  }

  if (description.length > 2000) {
    return { error: "La descripción no puede superar los 2000 caracteres." };
  }

  if (!durationMinutes || durationMinutes < 1 || durationMinutes > 1440) {
    return { error: "La duración debe estar entre 1 minuto y 24 horas." };
  }

  if (
    bufferBeforeMinutes === null ||
    bufferBeforeMinutes < 0 ||
    bufferBeforeMinutes > 720 ||
    bufferAfterMinutes === null ||
    bufferAfterMinutes < 0 ||
    bufferAfterMinutes > 720
  ) {
    return { error: "Cada margen debe estar entre 0 y 720 minutos." };
  }

  if (
    cancellationNoticeMinutes === null ||
    cancellationNoticeMinutes < 0 ||
    cancellationNoticeMinutes > 525600
  ) {
    return { error: "El aviso de cancelación no es válido." };
  }

  if (!Number.isFinite(price) || price < 0 || price > 21474836.47) {
    return { error: "Escribe un precio válido en quetzales." };
  }

  if (
    !approvalPolicies.includes(
      approvalPolicy as (typeof approvalPolicies)[number],
    )
  ) {
    return { error: "Selecciona una política de aprobación válida." };
  }

  if (!resourceIds.length || new Set(resourceIds).size !== resourceIds.length) {
    return { error: "Selecciona al menos un recurso compatible." };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    return { error: "Tu sesión ya no es válida. Inicia sesión nuevamente." };
  }

  const { error } = await supabase.rpc("create_service_with_resources", {
    p_tenant_id: organizationId,
    p_name: name,
    p_description: description,
    p_duration_minutes: durationMinutes,
    p_buffer_before_minutes: bufferBeforeMinutes,
    p_buffer_after_minutes: bufferAfterMinutes,
    p_price_cents: Math.round(price * 100),
    p_approval_policy: approvalPolicy as (typeof approvalPolicies)[number],
    p_allow_client_cancellation: formData.has("allowClientCancellation"),
    p_allow_client_rescheduling: formData.has("allowClientRescheduling"),
    p_cancellation_notice_minutes: cancellationNoticeMinutes,
    p_resource_ids: resourceIds,
  });

  if (error?.code === "23505") {
    return { error: "Ya existe un servicio con ese nombre." };
  }

  if (error) {
    return { error: "No fue posible crear el servicio. Intenta de nuevo." };
  }

  revalidatePath(`/panel/${organizationId}`);
  revalidatePath(`/panel/${organizationId}/servicios`);

  return { message: "Servicio creado correctamente." };
}
