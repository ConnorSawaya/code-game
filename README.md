# Relay

Relay is a production-ready multiplayer party game built with Next.js, TypeScript, Tailwind CSS, Framer Motion, and Supabase. Players pass ideas along in alternating code and description rounds, then watch the full chain reveal at the end.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase Auth, Postgres, Realtime, Storage, and SQL migrations
- Vercel deployment target

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the env template:

```bash
cp .env.example .env.local
```

3. Fill in the required values from your Supabase project and any optional services.

4. Apply the SQL migrations to your Supabase project.

5. Generate the prompt library if you change the prompt generator:

```bash
npm run prompts:generate
```

6. Start the app:

```bash
npm run dev
```

## Required environment variables

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RATE_LIMIT_SALT`

## Optional environment variables

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SUPABASE_REPLAY_BUCKET`
- `CRON_SECRET`

## Supabase notes

- SQL migrations live in [`supabase/migrations`](./supabase/migrations).
- Replays are stored in the `relay-replays` storage bucket by default.
- Anonymous auth should be enabled for guest-first onboarding.
- Email auth should be configured for passwordless magic links.
- Realtime should be enabled for the `public` schema tables used by room and game updates.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run load:test`
- `npm run prompts:generate`

## Testing

- Unit tests cover gameplay logic and prompt search.
- Integration tests validate the migration contract and RPC surface.
- Playwright smoke tests cover landing and play entry rendering.
- `scripts/load-test.ts` drives a seeded multi-client Supabase RPC simulation against a staging project.

## Deployment

### Supabase

1. Create a new Supabase project.
2. Enable anonymous auth and email auth.
3. Apply the migrations in order.
4. Confirm the `relay-replays` bucket exists.
5. Add the redirect URL for auth callbacks:

```text
https://your-app-domain.com/auth/callback
```

### Vercel

1. Import the repository into Vercel.
2. Add the environment variables from `.env.example`.
3. Set `CRON_SECRET` and add the same bearer token to the Vercel cron configuration if you customize it.
4. Deploy the project.

### Post-deploy checks

- Create a private room and join it from a second browser.
- Run Quick Play and verify public room discovery.
- Complete a full game and confirm the replay page loads.
- Try the account email upgrade flow.
- Check that Sentry only initializes when a DSN is configured.

## Project structure

- `src/app`: routes, API handlers, and page shells
- `src/components`: shared UI primitives and layout components
- `src/features`: domain logic for auth, rooms, prompts, replays, moderation, and Supabase integration
- `supabase/migrations`: schema, RLS, views, and RPC logic
- `tests`: unit, integration, and e2e coverage

## Notes

- Relay is intentionally text-only in v1. User code is never executed.
- Public rooms use rate limiting, Turnstile, reporting, and host moderation controls.
- Guest replays are pruned by cron unless a signed-in participant pins them.
