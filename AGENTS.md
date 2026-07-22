# SistemaReservas

## Stack and layout

- This is a single Next.js 16 App Router application. Routes and server actions live in `src/app/`; reusable client components live in `src/components/`; shared Supabase clients and generated DB types live in `src/lib/supabase/`.
- `src/proxy.ts` refreshes Supabase auth claims for nearly all routes. Preserve its matcher when changing auth behavior.
- Global UI styles are in `src/app/globals.css`. The project uses Tailwind v4 tooling, but most existing UI uses these global CSS classes.

## Verify changes

Run these before handing off application changes. There is no test script.

```bash
npm run format
npm run lint
npm run build
```

`npm run build` performs the TypeScript check. Use `npm run format:write` only when formatting changes are intentional because it formats the whole repository.

## Environment and Supabase

- Local runtime configuration is in `.env.local`; it is ignored by Git. At minimum, the app requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL`.
- Never expose or commit `SUPABASE_SERVICE_ROLE_KEY`, Resend keys, Twilio credentials, database passwords, or Supabase access tokens.
- `createPublicClient()` in `src/lib/supabase/public.ts` deliberately uses the anonymous role with no persisted session for the public booking flow. Do not replace it with the server client.
- `createAdminClient()` in `src/lib/supabase/admin.ts` uses `SUPABASE_SERVICE_ROLE_KEY` and is server-only.
- Schema changes require a versioned SQL migration in `supabase/migrations/`. Apply or inspect remote database work through the configured Supabase MCP/CLI, then run `npm run types:generate`; do not hand-edit `src/lib/supabase/database.types.ts`.
- Do not run `db reset --linked` against a remote environment. Local Supabase is not the normal workflow; this project uses the remote Supabase project.

## Change planning

- OpenSpec uses the `spec-driven` schema. For scoped product changes, keep proposal, design, specs, and tasks under `openspec/changes/<change-name>/`; use `openspec status --change <name>` to inspect progress.
- Do not mark a manual validation task complete unless it was actually exercised against the relevant booking flow and data.

## OpenCode

- `.opencode/opencode.json` configures the remote Supabase MCP. Keep it when changing OpenCode-specific setup.
