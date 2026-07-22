## Context

`/reservar/verificar-correo` actualmente llama a `verify_public_booking_confirmation` mientras renderiza una solicitud `GET`. Esa RPC marca el token como verificado, invalida otros tokens pendientes y mueve la reserva de `pending_verification` a `pending_approval`. Las vistas previas automáticas de WhatsApp y otros clientes pueden solicitar el enlace antes de la persona, por lo que consumen una confirmación sin interacción humana.

La RPC existente ya valida formato, vencimiento, estado de la reserva y uso único dentro de una transacción. El cambio debe conservar esas garantías sin requerir cambios de esquema ni nuevos privilegios de base de datos.

## Goals / Non-Goals

**Goals:**

- Hacer que una solicitud `GET` al enlace de confirmación sea estrictamente de solo lectura.
- Exigir una activación explícita de la persona antes de consumir el token.
- Mantener el resultado actual: una confirmación válida pasa la reserva a `pending_approval`; un token vencido, inválido o usado se rechaza.
- Permitir que una vista previa automática deje el enlace disponible para el posterior clic de la persona.

**Non-Goals:**

- Cambiar la expiración, generación, hashing o permisos de tokens.
- Cambiar los flujos de envío de Twilio, Resend, aprobación manual o estados de reserva.
- Garantizar protección ante automatizaciones que ejecuten deliberadamente solicitudes `POST` con el token.

## Decisions

### Separar la visualización `GET` de la activación `POST`

La página leerá el token únicamente para renderizar una pantalla con un botón de confirmación; no invocará ninguna RPC mutante durante el render del servidor. Al pulsar el botón, un server action recibirá el token mediante un formulario y llamará a la RPC existente bajo el cliente anónimo.

Se elige un server action sobre exponer una nueva ruta API porque el formulario y sus estados de éxito/error permanecen encapsulados en la ruta actual y no introducen una nueva superficie HTTP pública. La alternativa de validar el token con una RPC de solo lectura durante `GET` no evita el problema principal y añade trabajo de base de datos sin mejorar la protección ante previsualizaciones.

### No validar ni consumir el token hasta la activación

Una URL con cualquier token no vacío mostrará la pantalla de activación. Después del `POST`, la respuesta de `verify_public_booking_confirmation` determina si se muestra éxito o el estado no disponible. Esto evita que un crawler obtenga una respuesta que dependa del estado del token y garantiza que no existan escrituras durante `GET`.

### Mantener la RPC de uso único como autoridad

La RPC actual conserva la decisión final sobre vencimiento, token usado, estado de reserva y transición a `pending_approval`. No se duplicará esa lógica en TypeScript. Dos activaciones simultáneas siguen siendo seguras: la primera que bloquee y actualice los registros obtiene éxito; las posteriores reciben el estado no disponible.

## Risks / Trade-offs

- [La persona necesita un toque adicional] → La página explica que debe confirmar su solicitud y ofrece un único botón de acción clara.
- [Un automatismo avanzado podría enviar un `POST`] → El cambio bloquea la causa observada, que son solicitudes `GET` de previsualización; el token sigue siendo de un solo uso y expira en el plazo actual.
- [Un token vencido se descubre después de pulsar] → La pantalla posterior comunica el estado no disponible y permite iniciar otra reserva.
- [Regresión en el flujo público] → Se validará manualmente un enlace de WhatsApp con vista previa, una primera confirmación válida y un segundo uso del mismo enlace.

## Migration Plan

1. Implementar el formulario de activación y el server action sin cambiar la RPC ni el esquema.
2. Ejecutar formato, lint y build.
3. Crear una reserva de prueba por WhatsApp y permitir que se genere una vista previa del enlace; confirmar que el token siga válido.
4. Activar el botón una vez y confirmar la transición a `pending_approval`; repetir el enlace y comprobar que sea rechazado.

No hay migración de datos. El rollback restaura la llamada de verificación durante `GET`, aunque eso reintroduce el consumo por vistas previas.

## Open Questions

- Ninguna para este alcance. La protección contra bots que ejecuten `POST` intencionalmente requiere una defensa adicional y no forma parte de la incidencia observada.
