## Purpose

Definir la preferencia de organización activa y el enrutamiento canónico del panel sin UUID en la URL, preservando la autorización basada en membresías y RLS.

## Requirements

### Requirement: Preferencia persistente de espacio de trabajo activo

El sistema MUST permitir que una persona autenticada conserve una organización activa como preferencia de perfil y MUST validar una membresía vigente antes de usar esa preferencia para cargar datos operativos.

#### Scenario: Selección válida de organización

- **WHEN** una persona autenticada selecciona una organización de la que es miembro
- **THEN** el sistema guarda esa organización como activa para la persona y carga las rutas canónicas del panel dentro de ese contexto

#### Scenario: Preferencia revocada o inválida

- **WHEN** la organización guardada ya no existe o la persona ya no pertenece a ella
- **THEN** el sistema no carga datos de esa organización y dirige a la persona al selector de negocios o al onboarding según sus membresías vigentes

### Requirement: Rutas canónicas de panel sin UUID

El sistema MUST servir las áreas operativas mediante rutas estáticas bajo `/panel` y MUST resolver la organización activa en el servidor sin exigir un UUID de organización en la URL.

#### Scenario: Agenda con organización activa válida

- **WHEN** una persona autenticada visita `/panel/agenda` con una organización activa válida
- **THEN** el sistema muestra la agenda de esa organización y aplica los permisos de su rol vigente

#### Scenario: Ruta operativa sin sesión

- **WHEN** una persona sin sesión visita una ruta bajo `/panel`
- **THEN** el sistema la dirige a `/iniciar-sesion` sin exponer datos de organizaciones

### Requirement: Selector para múltiples organizaciones

El sistema MUST ofrecer una ruta para que una persona con varias membresías elija o cambie su organización activa.

#### Scenario: Persona con varias organizaciones sin preferencia válida

- **WHEN** una persona con varias membresías visita `/panel` sin una organización activa válida
- **THEN** el sistema dirige a `/panel/organizaciones` y muestra solamente las organizaciones de las que esa persona es miembro

#### Scenario: Cambio de negocio activo

- **WHEN** una persona selecciona otra organización desde `/panel/organizaciones`
- **THEN** el sistema actualiza la preferencia activa y las rutas posteriores de `/panel` usan la nueva organización

### Requirement: Compatibilidad transitoria de rutas heredadas

El sistema MUST conservar temporalmente rutas internas con UUID como adaptadores y MUST validar la membresía antes de redirigirlas a una ruta canónica.

#### Scenario: Enlace heredado autorizado

- **WHEN** una persona autenticada abre una ruta heredada que contiene el UUID de una organización de la que es miembro
- **THEN** el sistema conserva o solicita la selección de ese contexto de forma segura y dirige a la ruta canónica equivalente sin UUID

#### Scenario: Enlace heredado no autorizado

- **WHEN** una persona abre una ruta heredada que contiene el UUID de una organización de la que no es miembro
- **THEN** el sistema no revela datos ni cambia su espacio de trabajo activo y responde como recurso no encontrado

### Requirement: La preferencia no autoriza acceso

El sistema MUST tratar la organización activa como preferencia de navegación y MUST conservar RLS, las validaciones de membresía y las comprobaciones de RPC como barreras de autorización.

#### Scenario: Preferencia manipulada

- **WHEN** una persona intenta usar como activa una organización sin membresía vigente
- **THEN** el sistema deniega el contexto y las políticas de datos no devuelven registros de esa organización
