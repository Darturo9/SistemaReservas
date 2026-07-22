## Purpose

Definir la activacion explicita y de uso unico de enlaces de confirmacion de reserva.

## Requirements

### Requirement: Apertura no mutante del enlace de confirmación

El sistema MUST mostrar una pantalla de activación al recibir una solicitud `GET` a un enlace de confirmación de reserva y MUST NOT verificar tokens, actualizar contactos ni cambiar el estado de la reserva durante esa solicitud.

#### Scenario: Vista previa automática del enlace

- **WHEN** WhatsApp, un navegador o cualquier otro cliente solicita mediante `GET` un enlace de confirmación con token
- **THEN** el sistema muestra la pantalla de activación sin consumir, invalidar ni verificar el token

#### Scenario: Persona abre el enlace sin confirmar

- **WHEN** una persona abre el enlace de confirmación y abandona la pantalla sin activar la acción de confirmación
- **THEN** la reserva permanece en `pending_verification` y el token continúa disponible hasta su vencimiento

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

### Requirement: Uso único posterior a la activación

El sistema MUST mantener la propiedad de uso único del token después de una activación exitosa.

#### Scenario: Segundo intento de confirmación

- **WHEN** una persona vuelve a abrir y activa un enlace que ya fue confirmado
- **THEN** el sistema rechaza el token y muestra que el enlace ya no está disponible
