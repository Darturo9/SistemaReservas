## Context

La ruta publica `/reservar/[slug]` consulta todos los slots disponibles a traves de `list_public_available_slots` con intervalos de 15 minutos y los muestra como tarjetas. Para un dia de trabajo completo, el resultado puede contener decenas de tarjetas. En movil, el ancho disponible despues de los margenes y el panel de resultados solo permite una tarjeta por fila, por lo que la pagina se vuelve innecesariamente extensa.

El cambio solo reorganiza la presentacion cliente de los slots existentes. La fecha, sucursal, servicio, zona horaria y el enlace que incluye `startsAt` continúan siendo la fuente de verdad para elegir una cita.

## Goals / Non-Goals

**Goals:**

- Hacer que una persona pueda comparar y elegir horarios sin recorrer una lista larga de tarjetas.
- Mantener visibles y seleccionables todos los slots entregados por la API.
- Conservar intervalos de 15 minutos y la navegacion actual al formulario de datos.
- Garantizar controles legibles, navegables y tactiles en movil.

**Non-Goals:**

- Cambiar el algoritmo de disponibilidad, las RPC de Supabase o la asignacion de recursos.
- Modificar la duracion del servicio o imponer intervalos de 30 minutos.
- Cambiar los tres pasos de reserva, la retencion de horario o la validacion por WhatsApp.
- Agregar calendario semanal, lista de espera o recomendacion automatica de horarios.

## Decisions

### Agrupar por franja local del dia

Los slots se agruparan segun su hora local en la zona horaria de la sucursal: `Madrugada` (00:00-05:59), `Manana` (06:00-11:59), `Tarde` (12:00-17:59) y `Noche` (18:00-23:59). Solo se mostraran las franjas que contengan slots, con un contador de opciones.

Esto permite reducir el conjunto visible sin cambiar la disponibilidad. Se prefiere frente a un selector de hora nativo porque el usuario conserva una vista directa de las opciones reales y su distribucion durante el dia.

### Usar una sola franja activa y revelacion progresiva

La primera franja con disponibilidad sera la activa al cargar o al cambiar fecha, sucursal o servicio. Cada franja mostrara inicialmente hasta doce horas y un control explicito para revelar el resto. Al cambiar de franja, esa nueva franja inicia contraida de la misma forma.

Esta decision evita ocultar slots y limita la altura inicial. Mostrar todas las franjas expandida mantendria el problema actual, mientras que paginar contra el servidor complicaria la seleccion sin aportar valor para el volumen esperado del MVP.

### Reemplazar tarjetas por botones compactos de hora

Cada slot se representara por su hora de inicio en un enlace o boton con area tactil minima de 44 px. La duracion se mantendra una vez en el resumen del servicio; la hora de fin se mostrara como informacion contextual al enfocar, seleccionar o activar un horario, no en cada opcion. Cuando hay mas de un recurso disponible, el control puede exponer el total mediante una etiqueta accesible sin convertirlo en una tarjeta alta.

Se prefiere una cuadricula compacta a un `select`: la cuadricula permite comparar rapidamente los horarios y conserva objetivos tactiles claros. El enlace debe seguir generando la misma URL con `startsAt` para no cambiar el flujo del servidor.

### Mantener la edicion de criterios fuera de la lista de horas

Sucursal, servicio y fecha seguiran controlandose desde los filtros existentes. El encabezado de resultados resumira el servicio, su duracion y la fecha elegida, y los filtros continuaran disponibles para cambiar esos criterios.

Separar filtros de seleccion evita mezclar dos decisiones distintas: primero la disponibilidad que se quiere consultar y luego la hora que se desea reservar.

## Risks / Trade-offs

- [Una franja contraida puede ocultar una hora que el cliente esperaba ver] -> El control de expansion indicara cuantos horarios adicionales hay y nunca se descartaran slots.
- [Los nombres de franjas pueden no coincidir con la preferencia de todos los negocios] -> Se usan rangos horarios universales y se limita el cambio a la capa publica; una configuracion por negocio queda fuera de este MVP.
- [Una cuadricula densa puede reducir la claridad] -> Cada objetivo tendra altura tactil minima, contraste suficiente y una sola informacion primaria: la hora de inicio.
- [La hora local puede clasificarse incorrectamente si se usa UTC] -> La agrupacion utilizara la zona horaria de la sucursal ya recibida en el catalogo publico.

## Migration Plan

1. Implementar la agrupacion y la interfaz compacta sin modificar datos ni contratos de API.
2. Ejecutar las comprobaciones existentes de formato, tipos y lint.
3. Validar manualmente en movil una fecha con multiples franjas, una franja con mas de doce slots, y una fecha sin disponibilidad.
4. Desplegar como cambio de interfaz. El rollback consiste en restaurar el componente de lista de slots anterior; no requiere migracion de base de datos.

## Open Questions

- Ninguna para el alcance inicial. La conveniencia de usar intervalos de 30 minutos por servicio se evaluara separadamente, porque cambia las opciones reales de agenda y no solo su presentacion.
