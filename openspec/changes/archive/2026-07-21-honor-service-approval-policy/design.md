## Context

`services.approval_policy` ya admite `automatic` y `manual`, y el panel comunica esa configuración al negocio. Sin embargo, `public.verify_public_booking_confirmation(text)` devuelve un booleano y mueve incondicionalmente cualquier reserva válida de `pending_verification` a `pending_approval`. La página pública, por tanto, siempre informa que la solicitud será revisada manualmente.

La RPC es `SECURITY DEFINER`, consume una vez el token, bloquea la verificación y la reserva, verifica el contacto e invalida los demás tokens pendientes. La actualización de `bookings` ya queda registrada por el trigger de auditoría. La agenda interna solo consulta reservas `pending_approval` y su RPC de resolución permanece sin cambios.

## Goals / Non-Goals

**Goals:**

- Aplicar atómicamente la política del servicio al confirmar un token público válido.
- Distinguir para el visitante una reserva confirmada de una solicitud pendiente de aprobación.
- Preservar las garantías existentes de seguridad, concurrencia, token de un solo uso, bloqueo de horario y auditoría.

**Non-Goals:**

- No cambiar cómo se crean o editan servicios ni sus políticas.
- No añadir cancelación, reprogramación, no-show, recordatorios o notificaciones de resultado.
- No añadir una interfaz de historial de auditoría ni motivos de rechazo.
- No reclasificar reservas existentes; el cambio solo afecta confirmaciones futuras.

## Decisions

### Resolver la política dentro de la RPC transaccional

La RPC obtendrá y bloqueará la política del servicio junto con la verificación y la reserva válidas. Actualizará la reserva a `confirmed` para `automatic` o a `pending_approval` para `manual` en la misma transacción que verifica el contacto e invalida tokens alternos.

Esto evita que el navegador decida un estado de reserva o que una lectura separada observe una política distinta a la aplicada. La exclusión de ocupación ya trata ambos estados como bloqueantes, por lo que no requiere cambios.

Alternativa descartada: consultar `approval_policy` desde la acción de Next.js después de recibir el booleano de la RPC. Introduce una carrera con la edición del servicio, duplica autorización y permite mostrar un resultado distinto al persistido.

### Devolver el estado final al cliente público

La RPC devolverá el estado final permitido, `confirmed` o `pending_approval`, en vez del booleano actual. La acción de servidor lo convertirá en un estado de presentación explícito y el formulario mostrará el mensaje correspondiente.

PostgreSQL no permite cambiar el tipo de retorno con `CREATE OR REPLACE FUNCTION`; la migración eliminará la firma actual y la recreará dentro de la migración, restableciendo inmediatamente sus permisos para `anon`. No existen consumidores de aplicación fuera de la acción pública actual.

Alternativa descartada: mantener el booleano y un mensaje genérico. Oculta al visitante si su reserva está confirmada y no satisface la política visible del servicio.

### Mantener la agenda y la auditoría existentes

Las reservas manuales seguirán entrando en la cola existente y se resolverán con `resolve_pending_booking_approval`. Las automáticas no aparecerán porque la consulta ya filtra `pending_approval`. El trigger existente registrará la actualización como `bookings.update`, con actor, estado anterior y posterior; no se añade un segundo mecanismo de auditoría.

## Risks / Trade-offs

- [Cambio de contrato de RPC] → Actualizar la acción pública y regenerar `database.types.ts` inmediatamente después de aplicar la migración; comprobar que no haya otros consumidores antes de eliminar la firma anterior.
- [Cambio concurrente de política] → Bloquear la fila de servicio al seleccionar la confirmación válida, para que el estado persistido corresponda a una política consistente.
- [Texto público incoherente] → Cubrir ambos resultados en el estado tipado de la acción y en pruebas manuales con un servicio de cada política.
- [Roles sin validar en producción] → Antes de cerrar tareas manuales, probar con cuentas separadas `owner`, `admin` y `staff`; el entorno actual solo tiene una membresía owner.

## Migration Plan

1. Crear y aplicar una migración versionada que reemplace la firma de `verify_public_booking_confirmation(text)` y conserve `SECURITY DEFINER`, `search_path = ''` y el permiso exclusivo de `anon`.
2. Regenerar los tipos de Supabase y adaptar la acción y la interfaz pública al estado devuelto.
3. Ejecutar formato, lint y build.
4. Validar una reserva automática y una manual con tokens nuevos, además de la matriz de roles de agenda y entradas de auditoría.

Si se requiere revertir, restaurar en una nueva migración la RPC booleana y su transición universal a `pending_approval`; las reservas creadas durante el cambio conservan su estado histórico y no se modifican.

## Open Questions

Ninguna. La decisión de producto es respetar la política configurada por servicio.
