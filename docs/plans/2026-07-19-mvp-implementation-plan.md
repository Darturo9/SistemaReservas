# Plan Tecnico: MVP De Sistema De Reservas

## Estado Actual

- Fase 1 completada: Next.js, Supabase CLI, migraciones versionadas y tipos TypeScript.
- Fase 2 completada: autenticacion interna, onboarding, organizaciones, membresias, RLS y auditoria.
- Fase 3 completada: sucursales, recursos, servicios, compatibilidades y disponibilidad con pantallas protegidas por tenant.
- Fase 4 completada: motor de slots, reservas transaccionales, proteccion anti-solapamiento y visor interno de agenda.
- Fase 5.1 completada: catálogo público por slug, publicación explícita y consulta anónima de disponibilidad.
- Fase 5.2 completada: clientes, contactos normalizados y bloqueos públicos de 15 minutos en `pending_verification`.
- Fase 5.3 completada: tokens hasheados de un solo uso, confirmacion principal por WhatsApp y correo de respaldo mediante Resend.
- El bloque minimo de aprobacion manual de Fase 6 esta implementado y validado: la politica de cada servicio determina si una reserva verificada queda `confirmed` o `pending_approval`, y `owner`, `admin` y `staff` respetan sus permisos en agenda.
- El panel usa rutas canónicas sin UUID y una preferencia de organización activa validada contra membresías y RLS. Siguiente objetivo: validar el fallback Twilio→Resend antes de ampliar el panel operativo.
- SMS queda diferido para controlar costos del MVP.

## Objetivo De Entrega

Entregar una aplicacion web responsive en Next.js y TypeScript, respaldada por Supabase, donde un comercio configure sus servicios y agenda, y sus clientes reserven con correo y telefono verificados.

## Principios De Implementacion

- Mantener un monolito modular; no introducir microservicios.
- PostgreSQL es la fuente canonica de agenda y reservas.
- Aplicar seguridad por tenant en base de datos mediante RLS, no solo en la interfaz.
- Modelar instantes en UTC y mostrar fechas en la zona horaria de la sucursal.
- Ejecutar notificaciones y vencimientos fuera de las solicitudes HTTP.
- Completar cada fase con pruebas y criterios de aceptacion verificables.

## Fase 1: Fundacion Del Proyecto

1. Inicializar Next.js con TypeScript, App Router, ESLint, Prettier y Tailwind CSS.
2. Definir convenciones de modulos, validacion de datos y manejo de errores.
3. Crear los entornos local, staging y produccion; documentar todas las variables de entorno.
4. Crear el proyecto Supabase y configurar CLI, migraciones versionadas y generacion de tipos TypeScript.
5. Configurar CI para lint, comprobacion de tipos y pruebas.

Criterios de aceptacion:

- La aplicacion ejecuta lint, tipos y pruebas en CI.
- Ningun secreto queda en el repositorio.
- Las migraciones se aplican de forma repetible en una base de datos limpia.

## Fase 2: Identidad Y Multitenancy

1. Configurar Supabase Auth para los usuarios internos.
2. Crear tablas `organizations`, `organization_members` y perfiles de usuario.
3. Implementar roles `owner`, `admin` y `staff`.
4. Agregar `tenant_id` a cada tabla funcional y definir politicas RLS de lectura y escritura.
5. Implementar alta de comercio y seleccion de organizacion activa.
6. Registrar eventos de seguridad y cambios de membresia en auditoria.

Criterios de aceptacion:

- Un usuario no puede consultar ni modificar datos de otro tenant desde navegador ni API.
- Un propietario puede invitar y administrar miembros de su comercio.
- El personal solo accede a los recursos y reservas habilitados para su rol.

## Fase 3: Configuracion Comercial

1. Crear migraciones y pantallas para sucursales, incluyendo direccion, zona horaria y datos de contacto.
2. Implementar recursos reservables con tipo, sucursal, capacidad y estado activo.
3. Implementar servicios con duracion, buffer previo/posterior, precio informativo, aprobacion y politica de cancelacion.
4. Definir relaciones servicio-recurso para indicar que recursos pueden prestar un servicio.
5. Crear la gestion de disponibilidad: reglas semanales, descansos, cierres y excepciones.
6. Crear bitacora de cambios para configuracion relevante.

Criterios de aceptacion:

- Un administrador puede configurar un comercio con al menos una sucursal, recurso, servicio y horario.
- Un servicio solo se puede reservar en recursos compatibles y activos.
- Las excepciones de disponibilidad prevalecen sobre las reglas recurrentes.

## Fase 4: Motor De Agenda

1. Diseñar el calculo de slots desde reglas de disponibilidad, duracion, buffers, reservas y bloqueos.
2. Persistir los intervalos de reserva en `tstzrange` o un rango equivalente de PostgreSQL.
3. Aplicar una restriccion de exclusion que impida solapamientos por recurso para estados que bloquean agenda.
4. Implementar asignacion transaccional de "cualquiera disponible" con bloqueo y reintento apropiados.
5. Manejar zonas horarias de entrada y salida con `America/Guatemala` como valor inicial de sucursal.
6. Exponer consultas publicas de disponibilidad limitadas por servicio, sucursal y recurso.

Criterios de aceptacion:

- Dos operaciones concurrentes no pueden confirmar el mismo recurso y horario.
- Los slots no aparecen durante cierres, descansos, excepciones o reservas vigentes.
- La opcion "cualquiera disponible" asigna solo recursos compatibles libres.

## Fase 5: Reservas Publicas Y Verificacion

1. Completada, Fase 5.1: crear la pagina publica del comercio con slug, publicación explícita y selección de servicio, sucursal y fecha. Los recursos no se exponen y el visitante consulta "cualquiera disponible".
2. Completada, Fase 5.2: crear clientes y contactos asociados a un tenant, con correo normalizado, telefono E.164, consentimiento y baja de WhatsApp. Los datos personales no se copian a auditoria.
3. Completada, Fase 5.2: crear bloqueos públicos transaccionales en `pending_verification`, asociados a cliente y con vencimiento fijo de 15 minutos.
4. Completada, Fase 5.3: integrar tokens hasheados de un solo uso para WhatsApp y correo de respaldo mediante Resend.
5. Ajuste MVP: no integrar SMS todavia. WhatsApp es el canal principal y el correo se envia automaticamente si WhatsApp falla.
6. Guardar consentimiento de WhatsApp, el canal de confirmacion por reserva y cada entrega del proveedor. Abrir un enlace no lo consume; una activacion explicita confirma una reserva `automatic` o mueve una `manual` a `pending_approval`.
7. Adelantar el bloque minimo de Fase 6: permitir que `owner` y `admin` confirmen o rechacen una reserva `pending_approval` desde la agenda, con auditoria. `staff` solo consulta.
8. Diferir SMS, cancelacion y solicitud de reprogramacion hasta validar reservas reales y costos de mensajeria.

Criterios de aceptacion:

- Toda reserva publica requiere que la persona active explícitamente un enlace de confirmacion. Las reservas de servicios `automatic` quedan `confirmed`; las de servicios `manual` requieren una accion de `owner` o `admin`.
- Los bloqueos vencidos liberan el horario.
- El flujo no requiere que el cliente cree contrasena ni inicie sesion.
- Los enlaces publicos no permiten acceder a reservas ajenas.

## Fase 6: Panel Operativo

1. Crear vistas de agenda por dia y semana para administradores y personal.
2. Mostrar detalle de reserva, historial del cliente y estado de verificacion.
3. Permitir confirmacion, rechazo, cancelacion, reprogramacion y marcado de no-show segun permisos.
4. Crear vistas de clientes, servicios, recursos y configuracion de disponibilidad.
5. Asegurar que la experiencia funciona en movil y escritorio.

Criterios de aceptacion:

- El personal solo ve y opera las reservas permitidas.
- Los cambios de estado validan transiciones y quedan auditados.
- La agenda se actualiza correctamente despues de cada accion.

## Fase 7: Notificaciones Y Tareas Asincronas

1. Definir una cola de tareas persistente o un patron outbox para mensajes y tareas de dominio.
2. Implementar adaptador de correo transaccional.
3. Implementar adaptador de WhatsApp para confirmaciones, recordatorios, cambios y cancelaciones, con consentimiento, baja voluntaria, plantillas aprobadas y registro de entrega.
4. Programar recordatorios, vencimiento de bloqueos, reintentos y limpieza de tokens caducados, respetando horarios silenciosos de la sucursal.
5. Añadir idempotencia para evitar mensajes duplicados ante reintentos.
6. Persistir proveedor, identificador externo y estados de entrega; usar correo como alternativa cuando falle WhatsApp o el contacto no tenga consentimiento.

Criterios de aceptacion:

- Un error temporal del proveedor se reintenta sin cambiar el estado de la reserva.
- Las confirmaciones, cambios, cancelaciones y recordatorios producen eventos auditables.
- Solo los clientes con consentimiento reciben WhatsApp.
- La verificacion de telefono no depende de WhatsApp y se completa por SMS.

## Fase 8: Calidad, Operacion Y Lanzamiento

1. Crear pruebas unitarias para calculo de slots, politicas y transiciones de estado.
2. Crear pruebas de integracion para RLS, concurrencia, restricciones anti-solapamiento y verificaciones.
3. Crear pruebas end-to-end para alta de comercio y reserva publica completa.
4. Configurar logs estructurados, seguimiento de errores y alertas basicas.
5. Documentar respaldo y restauracion de Supabase/PostgreSQL; probar una restauracion.
6. Desplegar a staging, ejecutar checklist de seguridad y publicar produccion.

Criterios de aceptacion:

- Las pruebas cubren doble reserva, aislamiento entre tenants y contacto no verificado.
- Existen alertas para fallos repetidos de tareas y proveedores.
- El proceso de restauracion de datos esta documentado y probado.

## Modelo De Datos Inicial

| Area          | Tablas iniciales                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| Identidad     | `profiles`, `organizations`, `organization_members`                                                      |
| Configuracion | `locations`, `resources`, `services`, `service_resources`                                                |
| Agenda        | `availability_rules`, `availability_exceptions`                                                          |
| Reservas      | `bookings`, `customers`, `customer_contacts` (canal preferido y consentimiento), `booking_verifications` |
| Operacion     | `notification_jobs`, `notification_deliveries`, `audit_logs`                                             |

## Dependencias Externas A Decidir Antes De Fase 5

- Proveedor de correo transaccional.
- Proveedor oficial de SMS para verificar telefonos en Guatemala.
- Proveedor de WhatsApp Business compatible con Guatemala, con plantillas transaccionales y estados de entrega.
- Servicio de observabilidad y seguimiento de errores.
- Plataforma de despliegue para Next.js y worker.

## Fuera De Este Plan

Pagos, senas, catalogo de productos, inventario, facturacion, directorio publico global, reseñas, aplicacion nativa, Google Calendar bidireccional y paquetes complejos de eventos se planificaran despues de validar el MVP.
