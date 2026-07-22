import { Resend } from "resend";

type BookingVerificationEmail = {
  expiresAt: string;
  recipientEmail: string;
  verificationUrl: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function getResendConfiguration() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Resend is not configured.");
  }

  return { apiKey, from };
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export async function sendBookingVerificationEmail({
  expiresAt,
  recipientEmail,
  verificationUrl,
}: BookingVerificationEmail) {
  const { apiKey, from } = getResendConfiguration();
  const expiry = new Intl.DateTimeFormat("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Guatemala",
  }).format(new Date(expiresAt));
  const safeExpiry = escapeHtml(expiry);
  const safeVerificationUrl = escapeHtml(verificationUrl);
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    html: `<!doctype html>
<html lang="es">
  <body style="margin:0; padding:0; background-color:#f8f5ed; color:#18231e; font-family:Arial, 'Segoe UI', sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; background-color:#f8f5ed;">
      <tr>
        <td align="center" style="padding:36px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px;">
            <tr>
              <td style="padding:0 8px 16px; color:#123d31; font-family:Georgia, 'Times New Roman', serif; font-size:22px; font-weight:700; letter-spacing:-0.5px;">
                <span style="display:inline-block; width:28px; height:28px; margin-right:8px; border:1px solid #123d31; border-radius:50%; color:#123d31; font-family:Georgia, 'Times New Roman', serif; font-size:15px; line-height:28px; text-align:center; vertical-align:middle;">R</span><span style="vertical-align:middle;">Reserva</span>
              </td>
            </tr>
            <tr>
              <td style="overflow:hidden; border:1px solid #d9d6cc; border-radius:16px; background-color:#fffdf8;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:34px 36px 30px; border-bottom:1px solid #d9d6cc; background-color:#123d31; color:#fffdf8;">
                      <p style="margin:0 0 10px; color:#f3a17f; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;">Un paso mas</p>
                      <h1 style="margin:0; color:#fffdf8; font-family:Georgia, 'Times New Roman', serif; font-size:32px; font-weight:500; letter-spacing:-0.8px; line-height:1.1;">Confirma tu correo para continuar.</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:34px 36px 12px; font-size:16px; line-height:1.6;">
                      <p style="margin:0 0 18px;">Hemos retenido tu horario temporalmente. Confirma que este correo es tuyo para mantener el proceso de reserva activo.</p>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 26px;">
                        <tr>
                          <td style="border-radius:8px; background-color:#d86f4a;">
                            <a href="${safeVerificationUrl}" style="display:inline-block; padding:14px 20px; border-radius:8px; color:#fffdf8; font-size:15px; font-weight:700; line-height:1; text-decoration:none;">Verificar mi correo</a>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 26px;">
                        <tr>
                          <td style="padding:14px 16px; border-left:3px solid #d86f4a; background-color:#f8f5ed; color:#4a5a52; font-size:14px; line-height:1.5;">
                            Este enlace vence a las <strong style="color:#18231e;">${safeExpiry}</strong>, hora de Guatemala.
                          </td>
                        </tr>
                      </table>
                      <p style="margin:0 0 12px; color:#4a5a52; font-size:13px; line-height:1.55;">Si el boton no funciona, copia y pega este enlace en tu navegador:</p>
                      <p style="margin:0 0 24px; overflow-wrap:anywhere; word-break:break-word;"><a href="${safeVerificationUrl}" style="color:#123d31; font-size:13px; line-height:1.5;">${safeVerificationUrl}</a></p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 36px 30px; color:#6d746f; font-size:12px; line-height:1.5;">
                      Si no iniciaste una reserva, puedes ignorar este correo. No se confirmara ninguna reserva sin completar las verificaciones requeridas.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 8px 0; color:#6d746f; font-size:12px; line-height:1.5;">
                Reserva · Gestion de citas para negocios
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    subject: "Confirma tu correo para continuar con tu reserva",
    text: `RESERVA\n\nConfirma tu correo para continuar con tu reserva.\n\nVerifica tu correo: ${verificationUrl}\n\nEste enlace vence a las ${expiry}, hora de Guatemala.\n\nSi no iniciaste una reserva, puedes ignorar este correo.`,
    to: recipientEmail,
  });

  if (error) {
    throw new Error("Resend could not deliver the verification email.");
  }

  if (!data?.id) {
    throw new Error("Resend did not return a delivery identifier.");
  }

  return { id: data.id };
}
