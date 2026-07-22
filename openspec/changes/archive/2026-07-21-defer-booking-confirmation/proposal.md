## Why

Las vistas previas automáticas de enlaces de WhatsApp pueden solicitar la URL de confirmación y consumir el token antes de que la persona vea la página. Esto deja una reserva válida en `pending_approval`, pero muestra al visitante que el enlace ya no está disponible.

## What Changes

- Separar la apertura del enlace de confirmación de la acción que consume el token.
- Mostrar una pantalla de confirmación no mutante al abrir un enlace válido.
- Requerir una acción explícita de la persona para confirmar la reserva y moverla a aprobación manual.
- Mantener la semántica existente de token único, vencimiento y rechazo de enlaces ya usados o inválidos.

## Capabilities

### New Capabilities

- `booking-confirmation-activation`: Protege los enlaces de confirmación de reserva contra vistas previas automáticas y exige una activación explícita de la persona.

### Modified Capabilities

- Ninguna.

## Impact

- Afecta la ruta pública `/reservar/verificar-correo`, su interacción cliente/servidor y los estilos de la pantalla de confirmación.
- Reutiliza la RPC existente `verify_public_booking_confirmation`; no modifica la estructura de base de datos, la emisión de tokens ni los proveedores de WhatsApp y correo.
