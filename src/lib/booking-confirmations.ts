import type { PostgrestError } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";

export const confirmationChannels = ["email", "whatsapp"] as const;

export type ConfirmationChannel = (typeof confirmationChannels)[number];

type IssuedBookingVerification = {
  expiresAt: string;
  recipient: string;
  token: string;
  verificationId: string;
};

export function createBookingVerificationUrl(token: string) {
  const verificationUrl = new URL("/reservar/verificar-correo", getSiteUrl());

  verificationUrl.searchParams.set("token", token);

  return verificationUrl.toString();
}

export async function issueBookingVerification(
  bookingId: string,
  channel: ConfirmationChannel,
): Promise<IssuedBookingVerification> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("issue_public_booking_verification", {
    p_booking_id: bookingId,
    p_channel: channel,
  });
  const verification = data?.[0];

  if (error || !verification) {
    throw new Error("Booking verification could not be issued.");
  }

  return {
    expiresAt: verification.expires_at,
    recipient: verification.recipient,
    token: verification.token,
    verificationId: verification.verification_id,
  };
}

export async function setBookingConfirmationChannel(
  bookingId: string,
  channel: ConfirmationChannel,
) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("set_public_booking_confirmation_channel", {
    p_booking_id: bookingId,
    p_channel: channel,
  });

  if (error) {
    throw new Error("Booking confirmation channel could not be set.");
  }
}

export async function createBookingVerificationDelivery({
  provider,
  providerMessageId,
  status,
  verificationId,
}: {
  provider: "resend" | "twilio";
  providerMessageId: string;
  status: "queued" | "sent" | "delivered" | "failed" | "undelivered";
  verificationId: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("booking_verification_deliveries").insert({
    provider,
    provider_message_id: providerMessageId,
    status,
    verification_id: verificationId,
  });

  if (error) {
    throw new Error("Booking verification delivery could not be recorded.", {
      cause: error,
    });
  }
}

export function getBookingVerificationDeliveryErrorDetails(error: unknown): {
  code?: string;
  message: string;
} {
  const cause = error instanceof Error ? error.cause : undefined;

  if (cause instanceof Error && "code" in cause) {
    const postgrestError = cause as PostgrestError;

    return { code: postgrestError.code, message: postgrestError.message };
  }

  return {
    message: error instanceof Error ? error.message : "Unknown error.",
  };
}
