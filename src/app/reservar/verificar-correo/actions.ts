"use server";

import { createPublicClient } from "@/lib/supabase/public";

export type BookingConfirmationState = {
  status: "confirmed" | "idle" | "unavailable";
};

export async function confirmPublicBooking(
  _: BookingConfirmationState,
  formData: FormData,
): Promise<BookingConfirmationState> {
  const token = formData.get("token");

  if (typeof token !== "string" || !token) {
    return { status: "unavailable" };
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc(
    "verify_public_booking_confirmation",
    { p_token: token },
  );

  return { status: !error && data ? "confirmed" : "unavailable" };
}
