# Diseno: Confirmacion De Reservas Por WhatsApp

## Objetivo

Usar WhatsApp como canal principal para confirmar la intencion de reservar en Guatemala. El correo se mantiene como respaldo automatico si Twilio rechaza o no puede entregar el mensaje de WhatsApp.

## Flujo

1. El visitante elige `WhatsApp` o `Correo` al retener un horario. WhatsApp es la opcion predeterminada.
2. Si elige WhatsApp, debe otorgar consentimiento explicito para recibir el mensaje de confirmacion.
3. La aplicacion crea el bloqueo en `pending_verification` por 15 minutos y emite un token hasheado asociado al canal elegido.
4. Para WhatsApp, el servidor envia una plantilla utility de Twilio con un enlace de un solo uso. Para correo, envia el enlace mediante Resend.
5. Al abrir cualquier enlace valido, la reserva pasa a `pending_approval`; el negocio la confirma o rechaza desde la agenda.
6. Si Twilio devuelve un error inmediato o un webhook informa `failed`/`undelivered`, el servidor emite un token de correo y envia el respaldo automaticamente. Una reserva no recibe dos respaldos por el mismo fallo.

## Datos Y Seguridad

- `bookings.confirmation_channel` conserva el canal elegido por reserva.
- `booking_verifications` conserva tokens hasheados para `email` y `whatsapp`; cada token sirve una vez.
- `booking_verification_deliveries` guarda proveedor, identificador externo, estado y datos de fallback sin guardar el token.
- Las RPC publicas solo consumen tokens. La emision, los cambios de canal y los registros de entrega son exclusivos de `service_role`.
- El webhook valida `X-Twilio-Signature` antes de actualizar estados o iniciar fallback.
- La confirmacion por WhatsApp requiere consentimiento vigente; una baja de WhatsApp bloquea ese canal.

## Configuracion Externa

### Sandbox

- Definir `TWILIO_WHATSAPP_MODE=sandbox`, las credenciales activas de Twilio y el remitente compartido Sandbox. Las Test Account Credentials no pueden enviar ni consultar mensajes reales de Sandbox.
- Cada telefono de prueba envia exactamente `join <codigo-del-sandbox>` al Sandbox. Eso habilita mensajes de texto libre por 24 horas; el usuario debe unirse de nuevo despues de tres dias.
- Sandbox no usa `TWILIO_WHATSAPP_CONTENT_SID` ni admite plantillas propias.

### Produccion

- Definir `TWILIO_WHATSAPP_MODE=production`.
- Cuenta Twilio con WhatsApp Business Account y remitente habilitado.
- Plantilla utility aprobada con una variable para el enlace de confirmacion y su Content SID.
- Credenciales de Twilio, remitente y Content SID en Vercel y `.env.local`.

En ambos modos, Twilio reporta estados a `/api/twilio/whatsapp-status` en el dominio de produccion.

## Fuera De Alcance

No se implementan SMS, respuestas conversacionales de WhatsApp, recordatorios, cancelaciones, reprogramaciones ni notificaciones de confirmacion/rechazo.
