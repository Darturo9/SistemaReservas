## Why

Los fondos en cuadrícula compiten visualmente con el contenido en las pantallas públicas, de autenticación y de gestión. El producto debe conservar su paleta actual sin ese patrón decorativo repetitivo.

## What Changes

- Eliminar las capas de gradientes lineales que dibujan cuadrículas o líneas de fondo en todas las superficies de la aplicación.
- Conservar los colores base, los degradados radiales que no forman cuadrícula, la estructura y el comportamiento de cada página.
- Aplicar fondos planos coherentes en la página principal, autenticación, onboarding, panel interno y reserva pública.

## Capabilities

### New Capabilities

- `grid-background-removal`: Garantiza que las superficies principales de la aplicación se rendericen sin fondos en cuadrícula ni líneas decorativas repetidas.

### Modified Capabilities

- Ninguna.

## Impact

- Afecta `src/app/globals.css` y las clases compartidas de superficie: `.hero`, `.auth-intro`, `.onboarding-page`, `.panel-selector-page`, `.workspace-page` y `.public-booking-page`.
- No modifica rutas, APIs, base de datos, dependencias ni estructura de componentes.
