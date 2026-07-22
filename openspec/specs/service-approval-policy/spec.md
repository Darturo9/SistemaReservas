## Purpose

Definir la aplicacion transaccional de la politica de aprobacion del servicio durante la confirmacion publica de una reserva.

## Requirements

### Requirement: Aplicación transaccional de la política del servicio

El sistema MUST consultar la política de aprobación del servicio de una reserva pública mientras consume una confirmación válida y MUST actualizar la reserva en la misma transacción a `confirmed` si la política es `automatic` o a `pending_approval` si la política es `manual`.

#### Scenario: Servicio con confirmación automática

- **WHEN** una persona activa un token vigente de una reserva `pending_verification` cuyo servicio tiene la política `automatic`
- **THEN** el sistema verifica el contacto, invalida los demás tokens pendientes y mueve la reserva a `confirmed`

#### Scenario: Servicio con aprobación manual

- **WHEN** una persona activa un token vigente de una reserva `pending_verification` cuyo servicio tiene la política `manual`
- **THEN** el sistema verifica el contacto, invalida los demás tokens pendientes y mueve la reserva a `pending_approval`

### Requirement: Comunicación del resultado de confirmación

El sistema MUST comunicar el resultado final de una confirmación pública exitosa sin revelar datos internos del servicio o de la organización.

#### Scenario: Reserva automática confirmada

- **WHEN** la confirmación válida deja una reserva en `confirmed`
- **THEN** el visitante ve que su reserva quedó confirmada

#### Scenario: Solicitud manual enviada

- **WHEN** la confirmación válida deja una reserva en `pending_approval`
- **THEN** el visitante ve que su solicitud fue enviada al negocio para aprobación manual

### Requirement: Auditoría de la transición determinada por política

El sistema MUST conservar la auditoría de la actualización de una reserva realizada al confirmar un token público válido.

#### Scenario: Transición automática auditada

- **WHEN** una confirmación válida mueve una reserva a `confirmed`
- **THEN** el sistema registra la actualización de la reserva con su estado anterior y posterior mediante el mecanismo de auditoría de reservas existente

#### Scenario: Transición manual auditada

- **WHEN** una confirmación válida mueve una reserva a `pending_approval`
- **THEN** el sistema registra la actualización de la reserva con su estado anterior y posterior mediante el mecanismo de auditoría de reservas existente
