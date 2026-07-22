## Context

El panel usa rutas bajo `/panel/[organizationId]` y cada página vuelve a resolver el usuario, su membresía y la organización. El UUID identifica una organización, no una persona ni una credencial, y RLS ya impide que una persona use una organización ajena. Sin embargo, el UUID está presente en enlaces, acciones enlazadas y rutas de revalidación, lo que hace que las URL operativas sean difíciles de leer.

El modelo admite que una persona pertenezca a varias organizaciones. El JWT actual solo aporta la identidad autenticada; no contiene una organización activa ni debe convertirse en la fuente de autorización para membresías o roles.

## Goals / Non-Goals

**Goals:**

- Ofrecer rutas canónicas sin UUID para el panel, como `/panel/agenda`.
- Recordar la última organización elegida por cada persona entre navegadores y dispositivos.
- Mantener un selector explícito para personas con varias organizaciones.
- Resolver una organización activa únicamente después de validar la membresía actual bajo la sesión autenticada.
- Conservar rutas heredadas temporalmente sin permitir acceso entre tenants.

**Non-Goals:**

- No sustituir Supabase Auth, JWT, RLS ni las validaciones de RPC.
- No convertir `active_organization_id` en una fuente de permisos.
- No cambiar las rutas públicas `/reservar/[slug]`.
- No añadir gestión de miembros, invitaciones, roles nuevos ni un perfil personal completo.
- No rediseñar las pantallas operativas.

## Decisions

### Persistir la preferencia en `profiles`

Se añadirá `profiles.active_organization_id` como UUID nullable con referencia a `organizations(id)` y `ON DELETE SET NULL`. La preferencia se establece mediante una acción de servidor que autentica a la persona y comprueba la membresía antes de actualizar su propio perfil.

Una preferencia inválida, eliminada o asociada a una membresía revocada nunca concede acceso. El resolvedor la descartará, limpiará o reemplazará al seleccionar otro contexto válido y dirigirá a onboarding o al selector cuando corresponda.

Alternativa descartada: cookie HttpOnly. Evita una migración, pero solo persiste por navegador y no satisface el requisito de recordar el negocio entre dispositivos.

### Mantener JWT como identidad y RLS como autorización

El resolvedor server-only obtendrá `claims.sub`, leerá la preferencia y consultará la membresía actual. Devolverá usuario, organización y rol únicamente cuando ambas referencias sean válidas. Todas las consultas, acciones y RPC existentes seguirán ejecutándose con el cliente de sesión y RLS.

Alternativa descartada: incluir organización y roles en claims JWT. Las membresías, removidos e invitaciones pueden cambiar antes de que la sesión se renueve; las claims solo serían una caché potencialmente obsoleta.

### Establecer rutas canónicas estáticas

Las rutas operativas canónicas serán `/panel`, `/panel/organizaciones`, `/panel/sucursales`, `/panel/recursos`, `/panel/servicios`, `/panel/disponibilidad`, `/panel/agenda` y `/panel/reservas-publicas`. El dashboard y las rutas hijas usarán el resolvedor común en lugar de recibir `organizationId` desde la URL.

`/panel` mostrará el dashboard de la organización activa. Cuando no exista una preferencia válida, dirigirá a `/panel/organizaciones` si hay varias membresías, a onboarding si no hay ninguna, o resolverá el único negocio disponible durante la transición.

### Migrar rutas heredadas sin mutar por GET

Las rutas `/panel/[organizationId]/...` se conservarán temporalmente como adaptadores. Validarán la membresía del UUID solicitado y llevarán a la ruta canónica mediante una acción de selección iniciada por navegación del cliente, no mediante una mutación de perfil durante un `GET` que puede ser prefetched. Una ruta heredada de organización ajena seguirá devolviendo `notFound`.

Alternativa descartada: actualizar `active_organization_id` directamente al recibir cualquier `GET` heredado. Una precarga del navegador podría cambiar silenciosamente el negocio activo.

### Centralizar la resolución del espacio de trabajo

Un módulo server-only reemplazará las comprobaciones repetidas de cada página. Las acciones de servidor también derivarán la organización activa desde ese módulo y no recibirán un tenant UUID confiable desde un formulario o un enlace.

## Risks / Trade-offs

- [Preferencia obsoleta tras una revocación] → Validar membresía en cada resolución, no solo al guardar la preferencia.
- [Rutas heredadas compartidas] → Validar el UUID contra la membresía antes de cualquier redirección o carga de datos.
- [Refactor amplio de enlaces y acciones] → Migrar por módulo, buscar todas las referencias a `/panel/${organizationId}`, revisar `revalidatePath` y mantener adaptadores temporales.
- [Una organización sin preferencia inicial] → Resolver el único negocio disponible como fallback y guardar la preferencia en los flujos de creación y selección posteriores.
- [Confusión entre cuenta personal y espacio de trabajo] → Reservar `/cuenta` para un futuro perfil personal y mantener el negocio activo bajo `/panel`.

## Migration Plan

1. Añadir la preferencia nullable, sus políticas necesarias y tipos generados.
2. Crear el resolvedor de espacio activo y el selector de organizaciones.
3. Introducir rutas canónicas sin UUID y migrar enlaces, acciones y revalidaciones.
4. Mantener adaptadores heredados validados durante la transición.
5. Verificar una persona con cero, una y varias organizaciones, además de una preferencia revocada y enlaces heredados ajenos.

Si se requiere revertir, las rutas heredadas continúan funcionales y `active_organization_id` puede permanecer como preferencia no utilizada. No se modifica la pertenencia ni los datos operativos.

## Open Questions

Ninguna. La preferencia activa se guardará por persona en `profiles` y se validará contra la membresía vigente en cada solicitud.
