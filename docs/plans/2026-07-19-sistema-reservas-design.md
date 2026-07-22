# Diseno Validado: Sistema de Reservas

## Objetivo

Construir un SaaS multitenant para comercios y profesionales que reservan servicios, tiempo o recursos. La primera version atiende negocios como salones, clinicas, entrenadores, canchas, salas y talleres sin depender de una vertical especifica.

Cada comercio dispone de un espacio aislado con su configuracion y una pagina publica de reservas. Un directorio global filtrable por categoria, ubicacion y servicio se evaluara cuando la plataforma tenga suficiente oferta.

## Alcance del MVP

- Servicios, recursos reservables, disponibilidad y reservas.
- Multiples sucursales por comercio.
- Pagina publica de reserva y panel operativo responsive.
- Reservas sin cuenta ni contrasena para el cliente final.
- Verificacion obligatoria de correo y telefono antes de confirmar la reserva.
- Confirmacion automatica o aprobacion manual, configurable por comercio o servicio.
- Notificaciones por correo y WhatsApp.
- Auditoria de cambios relevantes.
- Idioma inicial: espanol. Mercado inicial: Guatemala.
- Zona horaria inicial: `America/Guatemala`; el modelo queda preparado para otros paises.

La propuesta inicial prioriza una configuracion simple para comercios pequenos en espanol y comunicaciones transaccionales confiables para Guatemala. WhatsApp se utiliza para informar reservas una vez existe consentimiento; no forma parte del MVP como chatbot, canal de soporte entrante ni herramienta de marketing masivo.

## Exclusiones Del MVP

- Pagos, senas, facturacion e integracion con Stripe.
- Productos fisicos, inventario, envios y comercio electronico.
- Directorio global, reseñas y marketplace.
- Aplicaciones moviles nativas.
- Sincronizacion bidireccional con Google Calendar.
- Paquetes complejos de recursos, cotizaciones y flujos avanzados para eventos.

## Roles Internos

| Rol | Responsabilidad |
| --- | --- |
| Propietario | Acceso total al comercio, configuracion, miembros y futura facturacion. |
| Administrador | Gestiona agenda, servicios, recursos, clientes y reservas. |
| Personal | Consulta y opera las reservas que le correspondan, segun permisos. |

## Modelo Operativo

Un comercio puede tener una o varias sucursales. Cada sucursal contiene recursos reservables: personas, canchas, salas, equipos u otros activos. Los servicios determinan duracion, precio informativo, buffers y recursos compatibles.

El cliente puede elegir un recurso especifico o seleccionar "cualquiera disponible". En este ultimo caso, el sistema asigna un recurso compatible que este libre mediante una operacion transaccional.

La disponibilidad se expresa como reglas recurrentes, descansos, cierres y excepciones. No se materializan calendarios completos por adelantado. Los horarios disponibles se calculan desde estas reglas y las reservas activas.

## Flujo De Reserva

1. El cliente elige servicio, sucursal si aplica, recurso o "cualquiera disponible", fecha y horario.
2. El sistema crea un bloqueo temporal en estado `pendiente_verificacion`.
3. El cliente valida correo mediante enlace de un solo uso y telefono mediante codigo SMS de un solo uso, ambos con vencimiento.
4. Tras ambas validaciones, la reserva pasa a `confirmada` o `pendiente_aprobacion`, segun la politica del comercio o servicio.
5. Un bloqueo no verificado vence y libera el horario automaticamente.

Estados iniciales de reserva:

| Estado | Significado |
| --- | --- |
| `pendiente_verificacion` | Bloqueo temporal mientras se verifican correo y telefono. |
| `pendiente_aprobacion` | Datos validados; espera decision del comercio. |
| `confirmada` | Reserva vigente. |
| `cancelada` | Reserva anulada. |
| `reprogramada` | Reserva sustituida por otra fecha u horario. |
| `no_show` | El cliente no asistio. |

Las politicas de aprobacion, cancelacion, reprogramacion y vencimiento son configurables por comercio o servicio. Todo cambio relevante deja un registro de auditoria con actor, fecha, valores previos y nuevos.

## Comunicaciones

El correo valida la direccion de email y el SMS valida el telefono antes de confirmar una reserva. Se enviaran mensajes asincronos por correo y WhatsApp para confirmaciones, recordatorios, cambios y cancelaciones. Los mensajes de WhatsApp usan plantillas aprobadas por el proveedor, solo se envian a contactos con consentimiento explicito y pueden incluir enlaces seguros para cancelar o solicitar una reprogramacion.

Cada contacto guarda su canal preferido, consentimiento de WhatsApp, fecha de consentimiento y baja voluntaria. Las entregas registran el proveedor, identificador externo y estado de entrega. Un fallo de entrega no modifica el estado de una reserva; se registra para reintento o revision, respeta horarios silenciosos de la sucursal y usa correo como alternativa cuando corresponda.

## Arquitectura

Se implementa un monolito modular en un solo repositorio con Next.js y TypeScript. Los modulos iniciales son: identidad, organizaciones, sucursales, recursos, servicios, disponibilidad, reservas, clientes, notificaciones y auditoria.

La ejecucion se separa en cuatro responsabilidades:

- Aplicacion web y API: panel interno, pagina publica y operaciones transaccionales.
- PostgreSQL: fuente canonica de datos y proteccion contra solapamientos.
- Worker: envios, recordatorios, vencimientos, reintentos y tareas asincronas.
- Scheduler: programa trabajos recurrentes.

Supabase proporciona PostgreSQL, autenticacion, Row-Level Security y almacenamiento. Tailwind CSS se usara para la interfaz responsive. Todos los datos de negocio relevantes llevan `tenant_id`; la aplicacion y las politicas RLS actuan conjuntamente para aislar a cada comercio.

## Invariantes De Calidad

- No se permiten reservas solapadas para un mismo recurso.
- No existe lectura ni escritura de datos entre tenants.
- No se confirma una reserva sin correo y telefono verificados.
- Los cambios relevantes son auditables.
- Los errores de terceros no causan perdida ni alteracion silenciosa de reservas.
