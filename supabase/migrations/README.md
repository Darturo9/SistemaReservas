# Migraciones

Este directorio contiene los cambios versionados del esquema de negocio en el orden en que deben aplicarse.

Antes de crear la primera migracion funcional, vincula el proyecto remoto y ejecuta `npm run db:pull` para crear y revisar la migracion baseline. No modifiques migraciones que ya se hayan aplicado a staging o produccion; crea una nueva migracion correctiva.
