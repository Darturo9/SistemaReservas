# Continuidad: SistemaReservas

## Estado Actual

Las fases 1 a 5 y el bloque minimo de aprobacion manual de Fase 6 estan implementados y validados. La confirmacion principal por WhatsApp, el correo de respaldo mediante Resend, los registros de entrega, la politica de aprobacion por servicio y las rutas internas sin UUID estan implementados.

La verificacion SMS queda diferida para controlar costos del MVP. El enlace de confirmacion no se consume al abrirse: muestra una pantalla de activacion y la persona debe pulsar **Confirmar reserva**. La reserva pasa a `confirmed` con politica `automatic` o a `pending_approval` con politica `manual`.

## Decisiones Vigentes

- Mercado inicial: Guatemala, idioma espanol y zona horaria `America/Guatemala`.
- No usar Docker ni iniciar Supabase local.
- Aplicar cambios de base de datos con el MCP de Supabase y conservar cada migracion SQL en `supabase/migrations/`.
- El registro es autoservicio con correo y contrasena; confirmar el correo es obligatorio.
- En el MVP, el telefono se captura en formato E.164 pero no se verifica por SMS. WhatsApp es el canal principal para confirmar la intencion de reserva mediante enlace de un solo uso; correo es respaldo automatico ante fallo de WhatsApp. Abrir el enlace no cambia datos; una activacion explícita confirma las reservas de servicios `automatic` o mueve las de servicios `manual` a `pending_approval`, que un `owner` o `admin` resuelve manualmente.
- RLS es la barrera principal entre tenants. `owner` y `admin` gestionan configuracion; `staff` solo consulta.
- `profiles.active_organization_id` conserva el negocio activo de cada persona entre dispositivos. Es una preferencia de navegación, no una fuente de permisos: cada ruta vuelve a validar la membresía vigente y RLS.

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
- `20260720203500_grant_booking_verification_deliveries_to_service_role.sql`
- `20260722012925_honor_service_approval_policy.sql`
- `20260722031925_add_active_organization_preference.sql`

Tablas disponibles:

- Identidad: `profiles`, `organizations`, `organization_members`, `audit_logs`.
- Configuracion: `locations`, `resources`, `services`, `service_resources`.
- Disponibilidad: `availability_rules`, `availability_exceptions`.
- Agenda: `bookings`.
- Clientes: `customers`, `customer_contacts`.

La funcion `public.create_service_with_resources(...)` crea un servicio y sus recursos compatibles en una sola transaccion. Es `SECURITY INVOKER`, requiere `owner` o `admin` y respeta RLS.

## Interfaz Implementada

- `/panel`: espacio operativo del negocio activo.
- `/panel/organizaciones`: selector de negocios para personas con varias membresías.
- `/panel/sucursales`: listado y alta de sucursales.
- `/panel/recursos`: listado, filtro por sucursal y alta de recursos.
- `/panel/servicios`: alta de servicios, politicas y recursos compatibles.
- `/panel/disponibilidad`: reglas semanales y excepciones fechadas.
- `/panel/agenda`: visor interno de slots y lista de reservas pendientes de aprobacion; `owner` y `admin` pueden confirmar o rechazar.
- `/panel/reservas-publicas`: propietarios y administradores definen un slug y publican o desactivan el catálogo público.
- `/reservar/[slug]`: catálogo público sin autenticación para consultar sucursal, servicio, fecha y slots disponibles.
- `/reservar/verificar-correo`: muestra una activacion no mutante para enlaces de correo o WhatsApp; el boton **Confirmar reserva** consume el token de un solo uso.

`profiles.active_organization_id` conserva el último negocio seleccionado, pero no autoriza acceso. Cada página y acción valida la membresía vigente bajo la sesión autenticada y las políticas RLS aplican la autorización definitiva. Los triggers de base de datos registran cambios de configuracion en `audit_logs`.

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

Entre el 20 y el 22 de julio de 2026 se validaron los flujos públicos de correo y WhatsApp en producción:

- La aplicacion esta desplegada en Vercel y disponible en `https://reservas.solucionesweb-2025.com`.
- Resend tiene `solucionesweb-2025.com` verificado y habilitado para envio.
- La reserva de prueba creó un bloqueo `pending_verification` y un token hasheado.
- Resend registró un correo como `delivered`; Gmail lo clasificó en Spam durante esa primera prueba.
- Twilio entregó una confirmación por WhatsApp. La vista previa del enlace no consumió el token; al pulsar **Confirmar reserva**, el contacto y la verificación quedaron con `verified_at`. El estado final ahora depende de `services.approval_policy`.
- Al reutilizar el mismo enlace, la página mostró que ya no estaba disponible.
- `public.resolve_pending_booking_approval(...)` solo puede mover una reserva `pending_approval` a `confirmed` o `cancelled` bajo un rol `owner` o `admin`; `anon` no tiene permiso de ejecucion.

## Avisos Conocidos

- El Security Advisor avisa que `public.create_organization(text)` es `SECURITY DEFINER` ejecutable por `authenticated`. Es intencional: crea organizacion, membresia owner y auditoria de forma atomica.
- El Security Advisor tambien avisa sobre `create_booking`, `list_available_slots`, `list_public_available_slots`, `get_public_booking_catalog`, `create_public_booking_hold` y `verify_public_booking_confirmation` porque son RPC `SECURITY DEFINER`. Es intencional: validan permisos o limitan el resultado antes de leer datos protegidos por RLS. Todas fijan `search_path = ''`; las RPC publicas solo tienen permiso para `anon`.
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

## Fase 5.3: Confirmacion Multicanal

- `booking_verifications` conserva hashes de tokens, no tokens en texto plano. Solo `service_role` accede a la tabla directamente; `anon` solo puede consumir un token válido mediante RPC.
- `public.issue_public_booking_verification(...)` se ejecuta exclusivamente mediante `service_role`, invalida un token pendiente del mismo canal y devuelve el token solo al servidor para entrega.
- `public.verify_public_booking_confirmation(...)` permite a `anon` consumir una vez un token vigente de WhatsApp o correo. Marca `customer_contacts.verified_at`, invalida otros tokens pendientes y devuelve `confirmed` para servicios `automatic` o `pending_approval` para servicios `manual`.
- Abrir `/reservar/verificar-correo?token=...` no consume el token. El formulario de la página ejecuta la confirmación únicamente después de una activación explícita.
- El servidor usa Twilio para WhatsApp y Resend como respaldo automático si falla la entrega. Requiere `SUPABASE_SERVICE_ROLE_KEY`, credenciales de Twilio y configuración de Resend; sin ellas la aplicación no crea el bloqueo para evitar retener horarios sin poder verificar.

## Siguiente Objetivo: Validar Fallback Y Definir Operacion

1. Simular un fallo de entrega de Twilio y comprobar que se emite correo de respaldo mediante Resend una sola vez.
2. Definir el siguiente bloque de Fase 6: detalle e historial de reserva, cancelación, reprogramación, no-show y una vista interna de agenda por día o semana.
3. Mantener SMS, recordatorios y notificaciones de resultado fuera de alcance hasta definir ese bloque.

## Mensaje Para Retomar

```text
Continua SistemaReservas desde este handoff, `AGENTS.md`, el README y los planes en docs/plans/. Las fases 1 a 5 y el bloque mínimo de aprobación manual de Fase 6 están implementados y validados. WhatsApp es el canal principal, Resend es respaldo automático y la confirmación exige pulsar **Confirmar reserva**; un servicio `automatic` termina en `confirmed` y uno `manual` en `pending_approval`. El panel usa rutas estáticas bajo `/panel` y una organización activa validada por membresía. Valida ahora el fallback Twilio→Resend y define el siguiente bloque operativo antes de avanzar a SMS, recordatorios o notificaciones de resultado. Revisa repositorio, handoff, migraciones y tablas remotas antes de cambiar código. Usa Supabase MCP y migraciones SQL versionadas; no uses Docker. No uses magic_21st_magic_component_builder porque el proyecto no tiene créditos.
```
