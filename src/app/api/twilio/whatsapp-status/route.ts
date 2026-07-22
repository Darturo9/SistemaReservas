import { createHmac, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  createBookingVerificationDelivery,
  createBookingVerificationUrl,
  getBookingVerificationDeliveryErrorDetails,
  issueBookingVerification,
} from "@/lib/booking-confirmations";
import { sendBookingVerificationEmail } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";

const twilioStatuses = {
  accepted: "queued",
  delivered: "delivered",
  failed: "failed",
  queued: "queued",
  sending: "queued",
  sent: "sent",
  undelivered: "undelivered",
} as const;

function isTwilioRequestValid(request: NextRequest, values: URLSearchParams) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get("x-twilio-signature");

  if (!authToken || !signature) {
    return false;
  }

  const callbackUrl = new URL(
    request.nextUrl.pathname,
    getSiteUrl(),
  ).toString();
  const payload = [...values.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .reduce((value, [key, item]) => `${value}${key}${item}`, callbackUrl);
  const expected = createHmac("sha1", authToken)
    .update(payload)
    .digest("base64");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    signatureBuffer.length === expectedBuffer.length &&
    timingSafeEqual(signatureBuffer, expectedBuffer)
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const values = new URLSearchParams();

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values.append(key, value);
    }
  }

  if (!isTwilioRequestValid(request, values)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const messageId = values.get("MessageSid");
  const status =
    twilioStatuses[values.get("MessageStatus") as keyof typeof twilioStatuses];

  if (!messageId || !status) {
    return new NextResponse(null, { status: 204 });
  }

  const admin = createAdminClient();
  const { data: delivery, error: deliveryError } = await admin
    .from("booking_verification_deliveries")
    .select("id, verification_id, fallback_started_at")
    .eq("provider", "twilio")
    .eq("provider_message_id", messageId)
    .maybeSingle();

  if (deliveryError || !delivery) {
    return new NextResponse(null, { status: 204 });
  }

  const providerErrorCode = values.get("ErrorCode");
  const hasFailed = status === "failed" || status === "undelivered";

  if (!hasFailed || delivery.fallback_started_at) {
    await admin
      .from("booking_verification_deliveries")
      .update({ provider_error_code: providerErrorCode, status })
      .eq("id", delivery.id);

    return new NextResponse(null, { status: 204 });
  }

  const { data: claimedDelivery } = await admin
    .from("booking_verification_deliveries")
    .update({
      fallback_started_at: new Date().toISOString(),
      provider_error_code: providerErrorCode,
      status,
    })
    .eq("id", delivery.id)
    .is("fallback_started_at", null)
    .select("verification_id")
    .maybeSingle();

  if (!claimedDelivery) {
    return new NextResponse(null, { status: 204 });
  }

  const { data: verification } = await admin
    .from("booking_verifications")
    .select("booking_id")
    .eq("id", claimedDelivery.verification_id)
    .maybeSingle();

  if (!verification) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const emailVerification = await issueBookingVerification(
      verification.booking_id,
      "email",
    );
    const emailDelivery = await sendBookingVerificationEmail({
      expiresAt: emailVerification.expiresAt,
      recipientEmail: emailVerification.recipient,
      verificationUrl: createBookingVerificationUrl(emailVerification.token),
    });

    try {
      await createBookingVerificationDelivery({
        provider: "resend",
        providerMessageId: emailDelivery.id,
        status: "sent",
        verificationId: emailVerification.verificationId,
      });
    } catch (deliveryError) {
      const details = getBookingVerificationDeliveryErrorDetails(deliveryError);

      console.error("Booking verification delivery could not be recorded.", {
        code: details.code,
        message: details.message,
        provider: "resend",
        providerMessageId: emailDelivery.id,
        verificationId: emailVerification.verificationId,
      });
    }

    await admin
      .from("booking_verification_deliveries")
      .update({ fallback_sent_at: new Date().toISOString() })
      .eq("id", delivery.id);
  } catch {
    // The delivery remains claimed to prevent duplicate fallbacks on repeated callbacks.
  }

  return new NextResponse(null, { status: 204 });
}
