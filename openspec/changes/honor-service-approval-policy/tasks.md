## 1. Política En La Base De Datos

- [x] 1.1 Crear una migración versionada que reemplace `verify_public_booking_confirmation(text)` para bloquear y aplicar `services.approval_policy`, devolver el estado final y restaurar sus atributos y permisos de seguridad.
- [x] 1.2 Aplicar la migración al proyecto remoto mediante Supabase MCP y ejecutar `npm run types:generate`.

## 2. Resultado Público De La Confirmación

- [x] 2.1 Adaptar `confirmPublicBooking` al estado final que devuelve la RPC y conservar el estado de enlace no disponible.
- [x] 2.2 Mostrar mensajes distintos para reservas confirmadas automáticamente y solicitudes enviadas a aprobación manual.

## 3. Documentación

- [x] 3.1 Actualizar README, handoff y planes afectados para describir el resultado condicionado por la política del servicio, sin alterar el alcance diferido.

## 4. Verificación

- [x] 4.1 Ejecutar `npm run format`, `npm run lint` y `npm run build`.
- [ ] 4.2 Validar manualmente una confirmación pública para un servicio `automatic` y otra para `manual`, incluyendo token de uso único, estado final y auditoría de cada reserva.
- [ ] 4.3 Validar manualmente que `owner` y `admin` resuelven solicitudes manuales, que `staff` solo consulta y que cada decisión queda en `audit_logs`.
