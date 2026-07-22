## Why

Las rutas internas exponen UUIDs de organización y obligan a cada enlace del panel a transportar el contexto del negocio. Aunque el UUID no es una credencial y RLS protege el acceso, la navegación es difícil de leer, compartir y mantener.

## What Changes

- Añadir una preferencia persistente de organización activa por persona autenticada.
- Reemplazar las rutas operativas con UUID por rutas canónicas estáticas bajo `/panel`.
- Ofrecer un selector de negocios para elegir o cambiar el espacio de trabajo activo.
- Resolver el contexto activo y el rol en el servidor, manteniendo RLS y las validaciones SQL como autorización definitiva.
- Redirigir temporalmente rutas internas heredadas con UUID después de comprobar que la persona pertenece a esa organización.

## Capabilities

### New Capabilities

- `active-workspace-routing`: Gestiona la selección persistente y validada de una organización activa y las rutas internas sin UUID.

### Modified Capabilities

Ninguna.

## Impact

- Afecta `profiles`, rutas bajo `src/app/panel/`, enlaces internos, acciones de servidor y rutas de revalidación.
- Requiere una migración SQL, regeneración de tipos de Supabase y migración gradual de enlaces internos.
- No modifica la autenticación Supabase, los JWT existentes, RLS ni la estructura multitenant de `organization_members`.
