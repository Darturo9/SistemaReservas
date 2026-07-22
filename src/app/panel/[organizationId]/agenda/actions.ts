"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const approvalDecisions = ["confirmed", "cancelled"] as const;

export type BookingApprovalState = {
  error?: string;
  message?: string;
};

function getText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

export async function resolvePendingBookingApproval(
  organizationId: string,
  _: BookingApprovalState,
  formData: FormData,
): Promise<BookingApprovalState> {
  const bookingId = getText(formData, "bookingId");
  const decision = getText(formData, "decision");

  if (!bookingId) {
    return { error: "No encontramos la reserva a resolver." };
  }

  if (
    !approvalDecisions.includes(decision as (typeof approvalDecisions)[number])
  ) {
    return { error: "Selecciona una decisión válida para la reserva." };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    return { error: "Tu sesión ya no es válida. Inicia sesión nuevamente." };
  }

  const { error } = await supabase.rpc("resolve_pending_booking_approval", {
    p_booking_id: bookingId,
    p_status: decision as (typeof approvalDecisions)[number],
  });

  if (error?.code === "42501") {
    return {
      error: "Solo propietarios y administradores pueden resolver reservas.",
    };
  }

  if (error?.code === "22023") {
    return {
      error:
        "Esta reserva ya no está pendiente de aprobación. Actualiza la página e intenta de nuevo.",
    };
  }

  if (error) {
    return { error: "No fue posible actualizar la reserva. Intenta de nuevo." };
  }

  revalidatePath(`/panel/${organizationId}`);
  revalidatePath(`/panel/${organizationId}/agenda`);

  return {
    message:
      decision === "confirmed"
        ? "Reserva confirmada."
        : "Reserva rechazada y horario liberado.",
  };
}
