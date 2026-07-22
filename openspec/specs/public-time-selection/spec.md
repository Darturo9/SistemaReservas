## Purpose

Define the public booking time-selection experience.

## Requirements

### Requirement: Horarios agrupados por franja local

El sistema SHALL organizar los slots publicos disponibles en franjas basadas en la hora local de la sucursal: Madrugada (00:00-05:59), Manana (06:00-11:59), Tarde (12:00-17:59) y Noche (18:00-23:59). El sistema MUST mostrar solamente las franjas que contengan al menos un slot y MUST indicar la cantidad de opciones de cada franja.

#### Scenario: Slots disponibles en varias franjas

- **WHEN** la fecha seleccionada contiene slots a las 09:00, 13:00 y 18:00 en la zona horaria de la sucursal
- **THEN** el sistema muestra las franjas Manana, Tarde y Noche con sus respectivos conteos

#### Scenario: Sin slots disponibles

- **WHEN** la fecha seleccionada no contiene slots disponibles
- **THEN** el sistema muestra el estado vacio existente y no muestra controles de franjas horarias

### Requirement: Revelacion progresiva de horarios

El sistema SHALL activar inicialmente la primera franja cronologica que tenga disponibilidad. Cada franja activa MUST mostrar como maximo doce slots antes de que el visitante solicite ver mas, y MUST proporcionar un control que revele todos los slots restantes de esa franja cuando existan.

#### Scenario: Franja con mas de doce horarios

- **WHEN** la franja activa contiene trece o mas slots
- **THEN** el sistema muestra los primeros doce slots y un control que indica que existen horarios adicionales

#### Scenario: Expansion de una franja

- **WHEN** el visitante activa el control para ver mas horarios de la franja activa
- **THEN** el sistema muestra todos los slots restantes de esa franja sin eliminar los slots ya visibles

#### Scenario: Cambio de franja

- **WHEN** el visitante selecciona una franja distinta con disponibilidad
- **THEN** el sistema muestra esa franja como activa y presenta inicialmente hasta doce de sus slots

### Requirement: Controles compactos y accesibles de hora

El sistema SHALL presentar cada slot como un control compacto con su hora de inicio local y un objetivo tactil de al menos 44 por 44 pixeles. El sistema MUST mostrar la duracion del servicio una vez en el contexto de los resultados y MUST NOT repetir en cada slot la hora de fin ni el texto de disponibilidad de un unico recurso.

#### Scenario: Servicio con un recurso disponible

- **WHEN** un slot tiene exactamente un recurso disponible
- **THEN** el control muestra la hora de inicio local sin repetir la hora de fin ni el texto "1 espacio disponible"

#### Scenario: Seleccion de un horario

- **WHEN** el visitante activa un control de hora
- **THEN** el sistema navega al flujo de datos personales con los mismos parametros de fecha, sucursal, servicio y `startsAt` que el slot seleccionado

#### Scenario: Navegacion mediante teclado

- **WHEN** una persona navega hasta un control de hora con teclado
- **THEN** el control recibe un indicador de foco visible y puede activarse sin usar un puntero

### Requirement: Reagrupacion al cambiar criterios

El sistema SHALL recalcular la franja activa y el estado de revelacion cuando el visitante cambie fecha, sucursal o servicio. La primera franja cronologica que tenga slots en los nuevos resultados MUST ser la franja activa.

#### Scenario: Cambio de fecha con disponibilidad distinta

- **WHEN** el visitante cambia a una fecha cuya primera disponibilidad es por la tarde
- **THEN** el sistema muestra Tarde como franja activa y aplica nuevamente el limite inicial de doce slots
