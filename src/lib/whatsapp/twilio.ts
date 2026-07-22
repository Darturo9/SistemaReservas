type WhatsAppBookingVerification = {
  expiresAt: string;
  recipientPhone: string;
  statusCallbackUrl: string;
  verificationUrl: string;
};

type TwilioWhatsAppMode = "sandbox" | "production";

type TwilioMessageResponse = {
  sid?: string;
  status?: string;
};

type TwilioWhatsAppConfiguration =
  | {
      accountSid: string;
      authToken: string;
      from: string;
      mode: "sandbox";
    }
  | {
      accountSid: string;
      authToken: string;
      contentSid: string;
      from: string;
      mode: "production";
    };

function getTwilioWhatsAppMode(): TwilioWhatsAppMode {
  const mode = process.env.TWILIO_WHATSAPP_MODE ?? "production";

  if (mode === "sandbox" || mode === "production") {
    return mode;
  }

  throw new Error("Twilio WhatsApp mode is invalid.");
}

function getTwilioWhatsAppConfiguration(): TwilioWhatsAppConfiguration {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const contentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const mode = getTwilioWhatsAppMode();

  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio WhatsApp is not configured.");
  }

  if (mode === "sandbox") {
    return { accountSid, authToken, from, mode };
  }

  if (!contentSid) {
    throw new Error("Twilio WhatsApp Content SID is not configured.");
  }

  return { accountSid, authToken, contentSid, from, mode };
}

function asWhatsAppAddress(value: string) {
  return value.startsWith("whatsapp:") ? value : `whatsapp:${value}`;
}

export function isTwilioWhatsAppConfigured() {
  try {
    getTwilioWhatsAppConfiguration();

    return true;
  } catch {
    return false;
  }
}

function createSandboxMessage(verificationUrl: string, expiresAt: string) {
  const expiry = new Intl.DateTimeFormat("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Guatemala",
  }).format(new Date(expiresAt));

  return `Confirma tu solicitud de reserva aqui: ${verificationUrl}\n\nEste enlace es de un solo uso y vence a las ${expiry}, hora de Guatemala.`;
}

export async function sendWhatsAppBookingVerification({
  expiresAt,
  recipientPhone,
  statusCallbackUrl,
  verificationUrl,
}: WhatsAppBookingVerification) {
  const configuration = getTwilioWhatsAppConfiguration();
  const body = new URLSearchParams({
    From: asWhatsAppAddress(configuration.from),
    StatusCallback: statusCallbackUrl,
    To: asWhatsAppAddress(recipientPhone),
  });

  if (configuration.mode === "sandbox") {
    body.set("Body", createSandboxMessage(verificationUrl, expiresAt));
  } else {
    body.set("ContentSid", configuration.contentSid);
    body.set("ContentVariables", JSON.stringify({ 1: verificationUrl }));
  }

  const authorization = Buffer.from(
    `${configuration.accountSid}:${configuration.authToken}`,
  ).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${configuration.accountSid}/Messages.json`,
    {
      body,
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    },
  );
  const data = (await response.json()) as TwilioMessageResponse;

  if (!response.ok || !data.sid) {
    throw new Error("Twilio could not queue the WhatsApp verification.");
  }

  return { id: data.sid, status: data.status || "queued" };
}
