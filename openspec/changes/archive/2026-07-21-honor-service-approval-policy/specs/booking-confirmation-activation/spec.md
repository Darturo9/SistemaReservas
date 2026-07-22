## MODIFIED Requirements

### Requirement: Activación explícita de la confirmación

El sistema MUST requerir una acción explícita de la persona para consumir un token de confirmación y MUST reutilizar la validación transaccional existente para decidir el resultado según la política de aprobación del servicio.

#### Scenario: Confirmación automática válida

- **WHEN** una persona activa el botón de confirmación con un token vigente de una reserva pendiente cuyo servicio tiene política `automatic`
- **THEN** el sistema verifica el contacto, mueve la reserva a `confirmed` y muestra que la reserva quedó confirmada

#### Scenario: Confirmación manual válida

- **WHEN** una persona activa el botón de confirmación con un token vigente de una reserva pendiente cuyo servicio tiene política `manual`
- **THEN** el sistema verifica el contacto, mueve la reserva a `pending_approval` y muestra que la solicitud fue enviada al negocio

#### Scenario: Token no disponible al activar

- **WHEN** una persona activa el botón con un token vencido, usado, inválido o asociado a una reserva no pendiente
- **THEN** el sistema muestra que el enlace ya no está disponible y no modifica la reserva
