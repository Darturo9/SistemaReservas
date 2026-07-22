"use server";

import { redirect } from "next/navigation";

import {
  createBookingVerificationDelivery,
  createBookingVerificationUrl,
  getBookingVerificationDeliveryErrorDetails,
  issueBookingVerification,
  setBookingConfirmationChannel,
} from "@/lib/booking-confirmations";
import {
  sendBookingVerificationEmail,
  isResendConfigured,
} from "@/lib/email/resend";
import { createPublicClient } from "@/lib/supabase/public";
import {
  isTwilioWhatsAppConfigured,
  sendWhatsAppBookingVerification,
} from "@/lib/whatsapp/twilio";

export type PublicBookingHoldFormState = {
  error?: string;
  slotUnavailable?: boolean;
};

function getRequiredText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function isUnavailableSlotError(error: { code?: string; message?: string }) {
  return (
    error.code === "23P01" ||
    error.message === "The selected time is invalid." ||
    error.message === "The selected time is no longer available."
  );
}

export async function createPublicBookingHold(
  bookingSlug: string,
  locationId: string,
  serviceId: string,
  startsAt: string,
  _: PublicBookingHoldFormState,
  formData: FormData,
): Promise<PublicBookingHoldFormState> {
  const customerName = getRequiredText(formData, "customerName");
  const email = getRequiredText(formData, "email");
  const localPhone = getRequiredText(formData, "phone");
  const whatsappConsent = formData.get("whatsappConsent") === "on";
  const confirmationChannel = "whatsapp";

  if (customerName.length < 2 || customerName.length > 120) {
    return { error: "Escribe tu nombre completo." };
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Escribe un correo válido." };
  }

  if (!/^[0-9]{8}$/.test(localPhone)) {
    return {
      error: "Escribe los 8 dígitos de tu teléfono de Guatemala.",
    };
  }

  const phone = `+502${localPhone}`;

  if (!whatsappConsent) {
    return {
      error:
        "Necesitamos tu consentimiento para enviarte la confirmación por WhatsApp.",
    };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !isResendConfigured()) {
    return {
      error:
        "No pudimos iniciar la verificación. Intenta nuevamente más tarde.",
    };
  }

  if (!isTwilioWhatsAppConfigured()) {
    return {
      error:
        "La confirmación por WhatsApp no está disponible en este momento. Intenta nuevamente más tarde.",
    };
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("create_public_booking_hold", {
    p_booking_slug: bookingSlug,
    p_customer_name: customerName,
    p_email: email,
    p_location_id: locationId,
    p_phone: phone,
    p_service_id: serviceId,
    p_starts_at: startsAt,
    p_whatsapp_consent: whatsappConsent,
  });

  if (error) {
    if (isUnavailableSlotError(error)) {
      console.warn("Public booking hold unavailable.", {
        code: error.code,
        message: error.message,
        startsAt,
      });

      return {
        error:
          "Este horario ya no está disponible. Actualiza la página y elige otro.",
        slotUnavailable: true,
      };
    }

    console.error("Public booking hold failed.", {
      code: error.code,
      message: error.message,
    });

    return {
      error:
        "No pudimos retener este horario. Revisa tus datos o elige otro horario.",
    };
  }

  const hold = data[0];

  if (!hold) {
    return { error: "No pudimos retener este horario. Intenta nuevamente." };
  }

  let emailFallback = false;

  try {
    const channel = confirmationChannel;

    await setBookingConfirmationChannel(hold.booking_id, channel);

    const verification = await issueBookingVerification(
      hold.booking_id,
      channel,
    );
    const verificationUrl = createBookingVerificationUrl(verification.token);

    try {
      const delivery = await sendWhatsAppBookingVerification({
        expiresAt: verification.expiresAt,
        recipientPhone: verification.recipient,
        statusCallbackUrl: `${new URL(verificationUrl).origin}/api/twilio/whatsapp-status`,
        verificationUrl,
      });

      try {
        await createBookingVerificationDelivery({
          provider: "twilio",
          providerMessageId: delivery.id,
          status: "queued",
          verificationId: verification.verificationId,
        });
      } catch (deliveryError) {
        const details =
          getBookingVerificationDeliveryErrorDetails(deliveryError);

        console.error("Booking verification delivery could not be recorded.", {
          code: details.code,
          message: details.message,
          provider: "twilio",
          providerMessageId: delivery.id,
          verificationId: verification.verificationId,
        });
      }
    } catch {
      try {
        const emailVerification = await issueBookingVerification(
          hold.booking_id,
          "email",
        );
        const emailDelivery = await sendBookingVerificationEmail({
          expiresAt: emailVerification.expiresAt,
          recipientEmail: emailVerification.recipient,
          verificationUrl: createBookingVerificationUrl(
            emailVerification.token,
          ),
        });

        try {
          await createBookingVerificationDelivery({
            provider: "resend",
            providerMessageId: emailDelivery.id,
            status: "sent",
            verificationId: emailVerification.verificationId,
          });
        } catch (deliveryError) {
          const details =
            getBookingVerificationDeliveryErrorDetails(deliveryError);

          console.error(
            "Booking verification delivery could not be recorded.",
            {
              code: details.code,
              message: details.message,
              provider: "resend",
              providerMessageId: emailDelivery.id,
              verificationId: emailVerification.verificationId,
            },
          );
        }

        emailFallback = true;
      } catch (fallbackError) {
        console.error("Public booking WhatsApp fallback email failed.", {
          message:
            fallbackError instanceof Error
              ? fallbackError.message
              : "Unknown error.",
        });

        return {
          error:
            "No pudimos enviar el enlace de validación. Intenta nuevamente en unos minutos.",
        };
      }
    }
  } catch {
    return {
      error:
        "No pudimos enviar el enlace de validación. Intenta nuevamente en unos minutos.",
    };
  }

  redirect(
    `/reservar/${bookingSlug}/confirmar-whatsapp${
      emailFallback ? "?fallback=email" : ""
    }`,
  );
}
