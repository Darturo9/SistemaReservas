"use server";

import { revalidatePath } from "next/cache";

import { getActiveWorkspace } from "@/lib/active-workspace";
import { createClient } from "@/lib/supabase/server";

export type PublicBookingPageFormState = {
  error?: string;
  message?: string;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function updatePublicBookingPage(
  _: PublicBookingPageFormState,
  formData: FormData,
): Promise<PublicBookingPageFormState> {
  const rawSlug = formData.get("bookingSlug");
  const bookingSlug =
    typeof rawSlug === "string" ? rawSlug.trim().toLowerCase() : "";
  const isBookingPublic = formData.get("isBookingPublic") === "on";

  if (
    bookingSlug &&
    (bookingSlug.length < 3 ||
      bookingSlug.length > 64 ||
      !SLUG_PATTERN.test(bookingSlug))
  ) {
    return {
      error:
        "La URL debe usar entre 3 y 64 letras minúsculas, números o guiones.",
    };
  }

  if (isBookingPublic && !bookingSlug) {
    return { error: "Elige una URL antes de publicar las reservas." };
  }

  const supabase = await createClient();
  const { organizationId, role } = await getActiveWorkspace();

  if (role !== "owner" && role !== "admin") {
    return { error: "Tu rol no puede configurar las reservas públicas." };
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      booking_slug: bookingSlug || null,
      is_booking_public: isBookingPublic,
    })
    .eq("id", organizationId);

  if (error?.code === "23505") {
    return { error: "Esa URL ya está en uso. Elige otra." };
  }

  if (error) {
    return {
      error: "No fue posible actualizar la página pública. Intenta de nuevo.",
    };
  }

  revalidatePath("/panel");
  revalidatePath("/panel/reservas-publicas");
  revalidatePath("/reservar/[slug]", "page");

  return {
    message: isBookingPublic
      ? "La página pública ya está publicada."
      : "La página pública quedó desactivada.",
  };
}
