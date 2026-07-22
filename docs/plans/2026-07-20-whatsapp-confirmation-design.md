# Diseno: Confirmacion De Reservas Por WhatsApp

## Objetivo

Usar WhatsApp como canal principal para confirmar la intencion de reservar en Guatemala. El correo se mantiene como respaldo automatico si Twilio rechaza o no puede entregar el mensaje de WhatsApp.

## Flujo

1. El visitante consiente recibir el enlace de confirmacion por WhatsApp; este es el canal principal.
2. La aplicacion crea el bloqueo en `pending_verification` por 15 minutos y emite un token hasheado asociado a WhatsApp.
3. El servidor envia una plantilla utility de Twilio con un enlace de un solo uso.
4. Abrir el enlace solo muestra una pantalla de activacion; la persona debe pulsar **Confirmar reserva** para confirmar una reserva de servicio `automatic` o mover una de servicio `manual` a `pending_approval`.
5. Si la entrega de WhatsApp falla, el servidor emite un token de correo y envia el respaldo mediante Resend. El negocio confirma o rechaza desde agenda solamente las solicitudes de servicios `manual`.

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
