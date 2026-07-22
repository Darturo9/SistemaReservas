## 1. Preferencia Activa Y Autorización

- [x] 1.1 Crear y aplicar una migración versionada para `profiles.active_organization_id`, su clave foránea nullable, las políticas necesarias y la preferencia inicial al crear una organización.
- [x] 1.2 Regenerar `database.types.ts` y crear un resolvedor server-only que autentique, valide la membresía vigente y resuelva el espacio activo o el destino de recuperación.
- [x] 1.3 Implementar la acción de selección de organización activa y el selector `/panel/organizaciones` para personas con varias membresías.

## 2. Rutas Canónicas Del Panel

- [x] 2.1 Convertir el dashboard a `/panel` y crear las rutas estáticas de sucursales, recursos, servicios, disponibilidad, agenda y reservas públicas.
- [x] 2.2 Migrar los enlaces internos, formularios y acciones de servidor para que obtengan la organización activa desde el resolvedor y revaliden rutas sin UUID.
- [x] 2.3 Conservar adaptadores para `/panel/[organizationId]/...` que validen membresía y redirijan de forma segura a la ruta canónica equivalente sin mutar preferencias durante un `GET` prefetched.

## 3. Documentación Y Verificación

- [x] 3.1 Actualizar README, handoff y documentación de rutas con la navegación canónica, el selector de negocios y la garantía de que la preferencia no autoriza acceso.
- [x] 3.2 Ejecutar `npm run format`, `npm run lint`, `npm run build`, `npm run types:generate` y las validaciones OpenSpec correspondientes.
- [ ] 3.3 Validar manualmente una persona sin organización, una con una organización, una con varias organizaciones, una preferencia revocada y un enlace heredado autorizado y no autorizado.
