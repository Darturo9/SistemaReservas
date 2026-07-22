## 1. Agrupacion y estado de seleccion

- [x] 1.1 Crear el componente cliente que agrupe los slots por su hora local y zona horaria de sucursal en Madrugada, Manana, Tarde y Noche.
- [x] 1.2 Implementar el selector de franja activa, su contador de opciones y el reinicio de estado al recibir nuevos criterios de busqueda.
- [x] 1.3 Limitar inicialmente cada franja a doce slots e implementar el control para revelar todos los horarios restantes.

## 2. Interfaz publica compacta

- [x] 2.1 Reemplazar las tarjetas altas de horarios en `/reservar/[slug]` por enlaces compactos que preserven los parametros de seleccion, incluido `startsAt`.
- [x] 2.2 Ajustar el resumen de resultados para comunicar servicio, duracion y fecha una sola vez antes de la cuadricula de horas.
- [x] 2.3 Crear los estilos mobile-first para la cuadricula, franjas, estados activo y de foco, con objetivos tactiles de al menos 44 px.

## 3. Verificacion

- [x] 3.1 Validar manualmente en movil la primera franja, cambio de franja, revelacion de horarios adicionales y navegacion al paso de datos.
- [x] 3.2 Validar una fecha sin horarios y una fecha con disponibilidad en varias franjas sin perder los filtros seleccionados.
- [x] 3.3 Ejecutar Prettier, TypeScript y ESLint.
