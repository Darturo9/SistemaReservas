## Why

La selección pública muestra todos los horarios disponibles como tarjetas altas y repetitivas. En un teléfono, una jornada con intervalos de 15 minutos se convierte en una lista larga que dificulta comparar opciones y llegar a una decisión.

## What Changes

- Agrupar los horarios disponibles por franja del día para reducir la carga visual inicial.
- Presentar las horas como controles compactos y táctiles, sin repetir por cada opción la duración, hora de fin y disponibilidad ya comunicadas por el servicio seleccionado.
- Permitir expandir horarios adicionales dentro de una franja sin ocultar ni alterar la disponibilidad real.
- Mantener accesible el cambio de fecha, sucursal y servicio, y conservar el comportamiento actual al seleccionar un horario.

## Capabilities

### New Capabilities

- `public-time-selection`: selección pública, compacta y mobile-first de horarios disponibles por franja del día.

### Modified Capabilities

- Ninguna.

## Impact

- Afecta la ruta pública `/reservar/[slug]`, sus componentes de filtros y resultados de horarios, y los estilos globales de reserva pública.
- No cambia las RPC de Supabase, la asignación transaccional de recursos, los estados de reserva ni el flujo de validación por WhatsApp.
