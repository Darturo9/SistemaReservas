## Why

Los servicios permiten configurar una política de aprobación `automatic` o `manual`, pero toda reserva pública confirmada termina actualmente en `pending_approval`. Esto contradice la configuración visible para el negocio y obliga a intervenir manualmente incluso cuando el servicio debe confirmarse de inmediato.

## What Changes

- Aplicar la política de aprobación del servicio al consumir correctamente un token público de confirmación.
- Confirmar una reserva automáticamente cuando el servicio use la política `automatic`.
- Enviar una reserva a `pending_approval` únicamente cuando el servicio use la política `manual`.
- Comunicar al visitante el resultado correcto de la confirmación según la política aplicada.
- Mantener el uso único de tokens, la protección ante vistas previas, el bloqueo de horarios y la auditoría existente.

## Capabilities

### New Capabilities

- `service-approval-policy`: Define cómo la política configurada en un servicio determina el estado de una reserva pública después de verificar el contacto.

### Modified Capabilities

- `booking-confirmation-activation`: La activación explícita deja de tener un único resultado `pending_approval` y comunica el estado final condicionado por la política del servicio.

## Impact

- Afecta la RPC `public.verify_public_booking_confirmation(...)` y sus permisos, tipos generados y pruebas de migración.
- Afecta la acción y el formulario de `/reservar/verificar-correo`.
- La cola y la acción de aprobación de `/panel/[organizationId]/agenda` continúan atendiendo solamente reservas `pending_approval`.
- Requiere actualizar la documentación que hoy describe la aprobación manual como resultado universal.
