# Continuidad: SistemaReservas

## Estado Actual

Las fases 1, 2, 3, 4 y los bloques 5.1, 5.2, 5.3 y aprobacion manual inicial estan implementados. El siguiente bloque integra confirmacion por WhatsApp mediante Twilio con correo de respaldo. La verificacion real de correo fue validada en produccion.

La verificacion SMS queda diferida para controlar costos del MVP. El siguiente bloque es WhatsApp como confirmacion principal y correo automatico de respaldo; despues se valida la aprobacion manual completa.

## Decisiones Vigentes

- Mercado inicial: Guatemala, idioma espanol y zona horaria `America/Guatemala`.
- No usar Docker ni iniciar Supabase local.
- Aplicar cambios de base de datos con el MCP de Supabase y conservar cada migracion SQL en `supabase/migrations/`.
- El registro es autoservicio con correo y contrasena; confirmar el correo es obligatorio.
- En el MVP, el telefono se captura en formato E.164 pero no se verifica por SMS. WhatsApp es el canal principal para confirmar la intencion de reserva mediante enlace de un solo uso; correo es respaldo automatico ante fallo de WhatsApp. Un enlace consumido mueve la reserva a `pending_approval`, que un `owner` o `admin` resuelve manualmente.
- RLS es la barrera principal entre tenants. `owner` y `admin` gestionan configuracion; `staff` solo consulta.

## Base De Datos

Migraciones local y remota sincronizadas:

- `20260720032647_remote_schema.sql`
- `20260720035613_create_identity_and_multitenancy.sql`
- `20260720035903_move_rls_helpers_to_private.sql`
- `20260720040019_optimize_audit_and_membership_policies.sql`
- `20260720163336_create_commercial_configuration.sql`
- `20260720163452_optimize_commercial_configuration.sql`
- `20260720171544_create_service_with_resources.sql`
- `20260720173943_create_booking_engine.sql`
- `20260720174530_expose_public_availability.sql`
- `20260720174711_harden_public_availability_and_index.sql`
- `20260720174806_fix_public_availability_tenant_reference.sql`
- `20260720180102_create_public_booking_catalog.sql`
- `20260720181714_create_customers_and_public_booking_holds.sql`
- `20260720182220_optimize_customer_policies.sql`
- `20260720182331_add_customer_contact_preference.sql`
- `20260720182906_create_email_booking_verifications.sql`
- `20260720183210_optimize_booking_verifications.sql`
- `20260720194210_add_manual_booking_approval.sql`
- `20260720201015_add_whatsapp_verification_channel.sql`
- `20260720201208_add_multichannel_booking_confirmations.sql`

Tablas disponibles:

- Identidad: `profiles`, `organizations`, `organization_members`, `audit_logs`.
- Configuracion: `locations`, `resources`, `services`, `service_resources`.
- Disponibilidad: `availability_rules`, `availability_exceptions`.
- Agenda: `bookings`.
- Clientes: `customers`, `customer_contacts`.

La funcion `public.create_service_with_resources(...)` crea un servicio y sus recursos compatibles en una sola transaccion. Es `SECURITY INVOKER`, requiere `owner` o `admin` y respeta RLS.

## Interfaz Implementada

- `/panel`: redirige al unico negocio o permite seleccionar entre varios.
- `/panel/[organizationId]`: espacio operativo protegido por membresia.
- `/panel/[organizationId]/sucursales`: listado y alta de sucursales.
- `/panel/[organizationId]/recursos`: listado, filtro por sucursal y alta de recursos.
- `/panel/[organizationId]/servicios`: alta de servicios, politicas y recursos compatibles.
- `/panel/[organizationId]/disponibilidad`: reglas semanales y excepciones fechadas.
- `/panel/[organizationId]/agenda`: visor interno de slots y lista de reservas pendientes de aprobacion; `owner` y `admin` pueden confirmar o rechazar.
- `/panel/[organizationId]/reservas-publicas`: propietarios y administradores definen un slug y publican o desactivan el catálogo público.
- `/reservar/[slug]`: catálogo público sin autenticación para consultar sucursal, servicio, fecha y slots disponibles.
- `/reservar/verificar-correo`: consume un enlace de correo o WhatsApp de un solo uso y confirma la solicitud.

Las acciones de servidor validan los datos y las politicas RLS aplican la autorizacion definitiva. Los triggers de base de datos registran cambios de configuracion en `audit_logs`.

## Disponibilidad Actual

- Las reglas semanales pueden aplicarse a toda una sucursal o a un recurso especifico.
- El sistema bloquea reglas semanales solapadas dentro del mismo alcance.
- Las excepciones pueden ser `unavailable` para cierres y descansos, o `available` para horarios extraordinarios.
- Los formularios de excepciones interpretan las fechas en la zona horaria inicial de Guatemala y persisten instantes UTC.
- El calculo final de slots y la precedencia de reglas se implementaron en Fase 4.

## Verificacion Reciente

La ultima ejecucion correcta completo:

```text
npm run format
npm run lint
npx tsc --noEmit
npm run build
supabase migration list --linked
```

El historial local y remoto esta alineado.

El 20 de julio de 2026 tambien se valido el flujo publico de correo en produccion:

- La aplicacion esta desplegada en Vercel y disponible en `https://reservas.solucionesweb-2025.com`.
- Resend tiene `solucionesweb-2025.com` verificado y habilitado para envio.
- La reserva de prueba creo un unico bloqueo `pending_verification` y un token de correo hasheado.
- Resend registro el mensaje como `delivered`; Gmail lo clasifico en Spam durante esta primera prueba.
- Al consumir el enlace, el contacto y la verificacion quedaron con `verified_at`; la reserva permanecio en `pending_verification` hasta la futura verificacion SMS.
- Al reutilizar el mismo enlace, la pagina mostro que ya no estaba disponible.
- `public.resolve_pending_booking_approval(...)` solo puede mover una reserva `pending_approval` a `confirmed` o `cancelled` bajo un rol `owner` o `admin`; `anon` no tiene permiso de ejecucion.

## Avisos Conocidos

- El Security Advisor avisa que `public.create_organization(text)` es `SECURITY DEFINER` ejecutable por `authenticated`. Es intencional: crea organizacion, membresia owner y auditoria de forma atomica.
- El Security Advisor tambien avisa sobre `create_booking`, `list_available_slots`, `list_public_available_slots`, `get_public_booking_catalog`, `create_public_booking_hold` y `verify_public_booking_email` porque son RPC `SECURITY DEFINER`. Es intencional: validan permisos o limitan el resultado antes de leer datos protegidos por RLS. Todas fijan `search_path = ''`; las RPC publicas solo tienen permiso para `anon`.
- Supabase Auth tiene desactivada la proteccion de contrasenas filtradas. Activarla en el Dashboard antes de produccion.
- Los indices nuevos aparecen como sin uso porque aun no hay datos de configuracion; no deben eliminarse por ese aviso inicial.
- No usar `magic_21st_magic_component_builder` en este proyecto: no hay creditos disponibles. Construir componentes y estilos de forma nativa.

## Motor De Agenda

- `bookings` conserva el intervalo del servicio, los buffers aplicados y `occupied_at` como `tstzrange` semiabierto (`[)`).
- La restriccion `bookings_resource_occupied_at_excl` bloquea solapamientos por recurso para `pending_verification`, `pending_approval` y `confirmed`.
- `private.resource_is_available_at(...)` aplica los buffers, disponibilidad recurrente, excepciones y reservas bloqueantes.
- Una regla específica del recurso prevalece sobre las reglas generales de la sucursal para ese día. Una excepción `unavailable` prevalece sobre reglas y aperturas extraordinarias; una excepción `available` puede extender el horario normal.
- `public.create_booking(...)` valida al administrador, el servicio, la sucursal y los recursos compatibles. Si no recibe recurso, bloquea candidatos con `FOR UPDATE SKIP LOCKED` y asigna uno disponible de forma transaccional.
- `public.list_available_slots(...)` es para miembros autenticados y devuelve slots con recursos internos disponibles.
- `public.list_public_available_slots(...)` es para `anon`, acepta solamente sucursal, servicio, fecha y recurso opcional, limita el horizonte a 90 días y no devuelve identificadores internos de recursos.
- Las reservas de `pending_verification` vencidas se cancelan antes de calcular o crear una reserva. Fase 7 debe programar esa limpieza para que no dependa de actividad en la aplicación.

## Fase 5.1: Catalogo Publico

- `organizations.booking_slug` es opcional, usa solo minusculas, numeros y guiones, y es unico sin distinguir mayusculas.
- `organizations.is_booking_public` inicia en `false`; un negocio requiere slug para activarlo.
- `public.get_public_booking_catalog(text)` es la unica RPC que expone el catalogo al rol `anon`. Solo devuelve negocios publicados, sucursales activas y servicios activos que tengan recursos activos compatibles; no expone recursos.
- `public.list_public_available_slots(...)` ahora exige que la organizacion este publicada antes de devolver disponibilidad.
- Ambas RPC publicas son `SECURITY DEFINER` intencionalmente, fijan `search_path = ''` y solo tienen permiso para `anon`.
- El visitante solo consulta horarios. Fase 5.1 no crea clientes, contactos, reservas, bloqueos, correos, SMS ni tokens.

## Fase 5.2: Clientes Y Bloqueos Pendientes

- `customers` contiene el nombre, canal preferido (`email`, `sms` o `whatsapp`) y pertenece a un tenant. `customer_contacts` almacena correo normalizado y telefono E.164, verificacion futura y consentimiento/baja de WhatsApp.
- RLS permite leer clientes a miembros y gestionarlos a `owner`/`admin`; `anon` no puede leer ninguna tabla de clientes.
- La auditoria de clientes registra solo IDs y acciones; no copia nombres, correos ni telefonos al log.
- `bookings.customer_id` relaciona una reserva con un cliente dentro del mismo tenant.
- `public.create_public_booking_hold(...)` solo se ejecuta como `anon`. Revalida slug publicado, servicio, sucursal, intervalo de 15 minutos, horizonte de 90 dias y disponibilidad transaccional antes de crear un `pending_verification`.
- Cada bloqueo vence en 15 minutos. Los contactos deben coincidir como el mismo par correo/telefono para reutilizar un cliente existente; de otro modo se rechaza sin exponer datos.
- La pagina publica permite seleccionar un slot y retenerlo con nombre, correo, telefono y consentimiento opcional de WhatsApp. No envia WhatsApp ni verifica ningun canal todavia.
- `createPublicClient()` mantiene las RPC publicas bajo el rol `anon`, incluso si el visitante tiene una sesion interna iniciada.

## Fase 5.3: Verificacion De Correo

- `booking_verifications` conserva hashes de tokens, no tokens en texto plano. Solo `service_role` accede a la tabla directamente; `anon` solo puede consumir un token valido mediante RPC.
- `public.issue_email_booking_verification(...)` se ejecuta exclusivamente mediante `service_role`, invalida un token de correo pendiente anterior y devuelve el token solo al servidor para entrega.
- `public.verify_public_booking_email(...)` permite a `anon` consumir una vez un token vigente. Marca `customer_contacts.verified_at`, consume el token y mueve la reserva a `pending_approval`.
- El servidor usa Resend para enviar `/reservar/verificar-correo?token=...`. Requiere `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` y `RESEND_FROM_EMAIL`; sin ellas la aplicacion no crea el bloqueo para evitar retener horarios sin poder verificar.
- La entrega real por Resend se valido en produccion. La primera entrega llego a Spam en Gmail pese a que Resend la reporto como `delivered`; revisar la reputacion y autenticacion del remitente antes de lanzar el flujo a clientes.
- Si el correo de un cliente ya estaba verificado, `public.issue_email_booking_verification(...)` mueve el nuevo bloqueo a `pending_approval` sin enviar un segundo correo.

## Siguiente Objetivo: Validar Aprobacion Manual

1. Configurar Twilio WhatsApp Business, un remitente y una plantilla utility con enlace de confirmacion.
2. Crear una reserva con WhatsApp, consumir su enlace y validar que quede en `pending_approval`.
3. Simular un fallo de entrega de Twilio y comprobar que se emite correo de respaldo una sola vez.
4. Confirmar y rechazar solicitudes desde `/panel/[organizationId]/agenda` bajo un rol `owner` o `admin`; verificar que `staff` solo consulta y que los cambios quedan en `audit_logs`.
5. No implementar SMS, cancelacion, reprogramacion, recordatorios ni notificaciones de resultado hasta validar este bloque.

## Mensaje Para Retomar

```text
Continua SistemaReservas desde docs/2026-07-20-phase-3-handoff.md y los planes en docs/plans/. Las fases 1 a 4, Fases 5.1, 5.2 y 5.3, y la aprobacion manual inicial estan implementadas. El MVP no usara SMS por ahora: el correo validado mueve la reserva a pending_approval y owner/admin pueden confirmarla o rechazarla desde agenda. Valida primero este flujo completo y la auditoria; no avances a SMS, cancelacion, reprogramacion, WhatsApp, recordatorios ni notificaciones de resultado. Revisa repositorio, handoff, migraciones y tablas remotas antes de cambiar codigo. Usa Supabase MCP y migraciones SQL versionadas; no uses Docker. No uses magic_21st_magic_component_builder porque el proyecto no tiene creditos.
```
