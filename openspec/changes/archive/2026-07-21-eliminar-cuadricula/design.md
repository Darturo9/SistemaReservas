## Context

La identidad visual se concentra en `src/app/globals.css`. Actualmente, las superficies de la página principal, autenticación, onboarding, panel interno y reserva pública superponen gradientes lineales repetidos para simular una cuadrícula o líneas decorativas sobre su color base. La solicitud es retirar ese patrón de todo el producto sin alterar la jerarquía, los colores de marca ni la disposición de las páginas.

## Goals / Non-Goals

**Goals:**

- Eliminar todos los fondos de cuadrícula y líneas repetidas de las superficies compartidas.
- Mantener el color base asignado a cada superficie y conservar los fondos decorativos que no son cuadrículas.
- Limitar el cambio a estilos globales para que todas las rutas afectadas queden cubiertas de forma consistente.

**Non-Goals:**

- Rediseñar la paleta, tipografía, sombras, componentes o maquetación con CSS Grid.
- Modificar datos, rutas, APIs, dependencias o componentes React.
- Eliminar degradados radiales que no formen un patrón de cuadrícula.

## Decisions

### Centralizar la eliminación en las reglas de superficie existentes

Se actualizarán las reglas de `.hero`, `.auth-intro`, `.onboarding-page`, `.panel-selector-page`, `.workspace-page` y `.public-booking-page` en `globals.css`. Cada una conservará únicamente su fondo base, salvo `.public-booking-page`, que conservará su degradado radial no repetitivo sobre `--paper`.

Esto cubre cada ruta que consume las clases compartidas sin añadir clases, condicionales ni cambios de marcado. La alternativa de sobrescribir el patrón desde cada página duplicaría reglas y podría dejar rutas internas sin actualizar.

### Diferenciar patrón visual de layout CSS

Solo se eliminarán capas de `linear-gradient` usadas como fondo repetitivo. Las declaraciones `display: grid` y sus columnas o filas se mantienen porque controlan la estructura responsiva, no el fondo visual.

### Preservar los colores de superficie actuales

Los fondos resultantes serán `--forest` para landing, autenticación y onboarding; `--moss` para el panel; y `--paper` para la reserva pública. Mantener estos valores evita cambios de contraste y conserva la identidad actual. La alternativa de introducir colores o degradados nuevos amplía innecesariamente el alcance.

## Risks / Trade-offs

- [Las superficies pueden percibirse como más planas] → Se conservan la paleta, las sombras, bordes y el degradado radial de la reserva pública para mantener profundidad visual.
- [Podría confundirse una cuadrícula de fondo con una maquetación CSS] → La revisión se limitará a propiedades `background` que contienen gradientes lineales repetidos; no se tocarán reglas de layout.
- [Una ruta podría quedar fuera por reutilizar estilos compartidos] → Se verificará visualmente al menos una ruta representativa de cada superficie afectada, en escritorio y móvil.

## Migration Plan

1. Sustituir los fondos con patrón por sus fondos base en la hoja global.
2. Ejecutar las verificaciones de formato, lint y build disponibles.
3. Revisar las rutas representativas de landing, autenticación, onboarding, panel y reserva pública en escritorio y móvil.
4. Desplegar como cambio puramente visual.

No requiere migración de datos. Para revertir, se restaura el commit de estilos que contiene las capas de gradiente.

## Open Questions

- Ninguna. El degradado radial de las páginas de mensaje y de la reserva pública se conserva porque no representa una cuadrícula.
