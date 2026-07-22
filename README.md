# Sistema de Reservas

SaaS multitenant para comercios y profesionales que gestionan servicios, recursos y reservas.

## Requisitos

- Node.js 20.9 o superior.
- Un proyecto de Supabase.
- Supabase CLI 2.101 o superior.

## Desarrollo Local

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` como `.env.local` y agrega los valores publicos de tu proyecto Supabase.
3. Ejecuta `supabase login` una vez en tu equipo y vincula el proyecto remoto cuando sea necesario.
4. Ejecuta la aplicacion con `npm run dev`.
5. Abre `http://localhost:3000`.

El proyecto usa Supabase remoto mediante MCP y migraciones SQL versionadas. No se usa Docker ni se inicia el stack local de Supabase.

## Comandos

- `npm run dev`: inicia el entorno local.
- `npm run lint`: ejecuta ESLint.
- `npm run format`: verifica formato con Prettier.
- `npm run build`: crea una compilacion de produccion.
- `npm run supabase:link`: vincula el directorio con el proyecto indicado por `SUPABASE_PROJECT_REF`.
- `npm run db:pull`: obtiene el esquema remoto como migracion baseline. Usar solo para reconciliar cambios remotos no versionados.
- `npm run db:migration:new -- <nombre>`: crea una migracion SQL versionada.
- `npm run db:reset`: reconstruye la base local aplicando todas las migraciones.
- `npm run db:push:dry` / `npm run db:push`: revisa o aplica las migraciones pendientes al proyecto vinculado.
- `npm run types:generate`: actualiza `src/lib/supabase/database.types.ts` desde el proyecto vinculado.

## Entornos Y Secretos

| Variable                               | Local                              | Staging                                   | Produccion                                | Uso                                           |
| -------------------------------------- | ---------------------------------- | ----------------------------------------- | ----------------------------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `.env.local`                       | configuracion del proveedor de despliegue | configuracion del proveedor de despliegue | URL publica de Supabase                       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local`                       | configuracion del proveedor de despliegue | configuracion del proveedor de despliegue | clave publica de Supabase                     |
| `NEXT_PUBLIC_SITE_URL`                 | `.env.local`                       | configuracion del proveedor de despliegue | configuracion del proveedor de despliegue | URL canonica de la aplicacion                 |
| `SUPABASE_PROJECT_REF`                 | entorno de la terminal             | configuracion de CI                       | configuracion de CI                       | enlace, migraciones y tipos mediante CLI      |
| `SUPABASE_ACCESS_TOKEN`                | gestor de secretos o sesion de CLI | secreto de CI                             | secreto de CI                             | autenticacion no interactiva del CLI          |
| `SUPABASE_DB_PASSWORD`                 | gestor de secretos                 | secreto de CI                             | secreto de CI                             | enlace y operaciones remotas de base de datos |
| `SUPABASE_SERVICE_ROLE_KEY`            | `.env.local`                       | secreto del proveedor de despliegue       | secreto del proveedor de despliegue       | emisión interna de tokens de reserva          |
| `RESEND_API_KEY`                       | `.env.local`                       | secreto del proveedor de despliegue       | secreto del proveedor de despliegue       | entrega de correos de verificación            |
| `RESEND_FROM_EMAIL`                    | `.env.local`                       | configuracion del proveedor de despliegue | configuracion del proveedor de despliegue | remitente verificado en Resend                |
| `TWILIO_ACCOUNT_SID`                   | `.env.local`                       | secreto del proveedor de despliegue       | secreto del proveedor de despliegue       | cuenta Twilio para WhatsApp                   |
| `TWILIO_AUTH_TOKEN`                    | `.env.local`                       | secreto del proveedor de despliegue       | secreto del proveedor de despliegue       | firma de webhooks y API Twilio                |
| `TWILIO_WHATSAPP_FROM`                 | `.env.local`                       | configuracion del proveedor de despliegue | configuracion del proveedor de despliegue | remitente `whatsapp:+...` habilitado          |
| `TWILIO_WHATSAPP_MODE`                 | `.env.local`                       | configuracion del proveedor de despliegue | configuracion del proveedor de despliegue | `sandbox` para pruebas o `production`         |
| `TWILIO_WHATSAPP_CONTENT_SID`          | `.env.local`                       | configuracion del proveedor de despliegue | configuracion del proveedor de despliegue | plantilla utility aprobada por Meta           |

No se deben guardar valores de tokens de acceso, contrasenas de base de datos ni claves `service_role` en el repositorio. `.env.example` solo contiene nombres y valores de ejemplo vacios; las claves con prefijo `NEXT_PUBLIC_` son visibles en el navegador.

## Confirmacion Por WhatsApp

WhatsApp es el canal principal para confirmar una reserva publica; Resend envia un correo de respaldo si Twilio falla al iniciar o reporta una entrega fallida. Abrir el enlace no lo consume: la persona debe pulsar **Confirmar reserva**. Esa activacion confirma la reserva si el servicio usa politica automatica o la envia a aprobacion manual si usa politica manual. Antes de activar el canal en produccion:

### Sandbox

1. Define `TWILIO_WHATSAPP_MODE=sandbox` y usa el remitente compartido que muestra Twilio Sandbox, normalmente `whatsapp:+14155238886`.
2. Usa el Account SID y Auth Token activos de Twilio, no las Test Account Credentials. Las credenciales de prueba no pueden enviar ni consultar mensajes reales de Sandbox.
3. Cada telefono de prueba debe enviar exactamente `join <codigo-del-sandbox>` al remitente Sandbox. Ese mensaje abre una ventana de 24 horas para enviar texto libre; la sesion Sandbox vence despues de tres dias y se debe unir de nuevo.
4. No configures `TWILIO_WHATSAPP_CONTENT_SID`: Sandbox no admite plantillas propias. La aplicacion envia el enlace mediante texto libre durante la ventana activa.
5. Configura el Status Callback Sandbox como `https://reservas.solucionesweb-2025.com/api/twilio/whatsapp-status`.

### Produccion

1. Define `TWILIO_WHATSAPP_MODE=production` y configura un remitente registrado en Twilio WhatsApp Business con prefijo `whatsapp:+`.
2. En Twilio Content Template Builder, crea una plantilla en espanol de categoria **Utility** con una variable para el enlace, por ejemplo: `Confirma tu solicitud de reserva aqui: {{1}}`.
3. Espera la aprobacion de Meta y copia el Content SID que comienza con `HX` a `TWILIO_WHATSAPP_CONTENT_SID`.
4. Configura `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` como secretos en el proveedor de despliegue.
5. Despliega la aplicacion. El servidor enviara a Twilio el Status Callback `https://reservas.solucionesweb-2025.com/api/twilio/whatsapp-status`; no agregues secretos ni firmas manualmente a esa URL.

El visitante debe consentir expresamente la confirmacion por WhatsApp. El correo se envía automaticamente solo como respaldo si falla la entrega de WhatsApp.

## Autenticacion Interna

Los comercios se registran directamente con correo y contrasena. La confirmacion de correo es obligatoria antes de crear una organizacion o acceder al panel.

En Supabase Dashboard, configura `NEXT_PUBLIC_SITE_URL` como **Site URL** y registra `https://tu-dominio/auth/callback` en las URLs de redireccion autorizadas. Para confirmar correo en SSR, personaliza la plantilla **Confirm signup** con este enlace:

```html
<a
  href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/onboarding"
>
  Confirmar mi correo
</a>
```

Agrega tambien las variantes exactas de staging y desarrollo local en la configuracion de Auth.

## Flujo De Migraciones

1. Redacta el SQL de la migracion y aplicalo al proyecto remoto mediante el MCP de Supabase.
2. Conserva una copia versionada del SQL en `supabase/migrations/` con la misma version asignada en remoto.
3. Ejecuta `npm run types:generate` para sincronizar el contrato TypeScript.
4. Verifica el historial con `supabase migration list --linked` y ejecuta formato, lint, tipos y build.
5. Nunca ejecutes `db reset --linked` contra staging o produccion.

## Documentacion

- `Sistema de Reservas.md`: reporte original de requerimientos.
- `docs/plans/2026-07-19-sistema-reservas-design.md`: diseno validado.
- `docs/plans/2026-07-19-mvp-implementation-plan.md`: plan de implementacion.
- `docs/2026-07-20-phase-3-handoff.md`: estado tecnico y punto de continuidad actual.
