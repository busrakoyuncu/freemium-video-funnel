# Decisions

## Auth flow: one shared modal

We use one top-layer modal for all sign up / sign in actions.

- header button opens the same modal
- main CTA opens the same modal
- generate button opens the same modal
- no extra inline sign-up card is shown

Why: fewer competing actions, cleaner hierarchy, and a more premium flow. The user stays in context and the conversion moment is clearer.

## Generate action: authenticate before generation

The Generate button opens the shared auth modal on the Sign up tab after an audio file is selected.
The selected file remains in Zustand while the modal is open. Header authentication remains
sign-in-first, while Generate is signup-first because it is the conversion gate before generation.

## Post-auth destination: local generation workspace

Successful sign-in redirects to the local `/generate` route. The external reference artifact is
used only for visual direction. The generation workspace supports uploading or changing audio,
shows the selected file, and provides the first mock render action.

## Upload state: preserve the draft across the auth gate

The selected `File` is kept in the Zustand store so an audio file uploaded on the landing page
appears on `/generate` after sign-in. The generate page also owns an upload control for users who
arrive without a selected file. This state is intentionally session-memory only until persistent
upload storage is implemented.

## Sessions: cookies and a server-side guard

Sessions live in cookies through `@supabase/ssr`. `proxy.ts` refreshes the cookie on every
request and redirects signed-out visitors away from `/generate` before anything renders. Pages
are server components that read the user once and pass what the client needs as props. Sign out
calls Supabase, clears the selected file, and refreshes the router so server-rendered headers
update.

The landing page does not redirect signed-in users. It shows a workspace link instead. An
earlier client-side redirect caused a loop with the workspace's link back home.

## Supabase clients and credentials

Three clients, one per trust level. `browser-client.ts` uses the public key in the browser.
`server-client.ts` builds a per-request cookie-backed client for pages and route handlers.
`admin-client.ts` uses the service-role key and is only imported by route handlers that must
write job state. Credentials live in the ignored `.env.local` file. No secret key reaches the
browser.

## Styling: CSS Modules and tokens, no UI library

The original plan named Mantine. The UI was built with CSS Modules and a small palette of CSS
variables in `app/globals.css` before Mantine was added, and it matches the design doc. Adding a
UI library now would be a rewrite for no product gain, so CSS Modules stay. Module files use
tokens only, never hex values, and each component owns its stylesheet.

## Database scope: profiles and jobs only

The first Supabase migration defines only `profiles` and `jobs`. New users receive 50 credits
through the auth trigger. Row-level security lets authenticated users read only their own rows;
credit changes and job creation remain server-side operations so the browser cannot award credits
or create jobs for another user.

The `profiles.email` field mirrors `auth.users.email` for convenient profile-table visibility.
Credentials remain managed only by Supabase Auth, and an Auth email update synchronizes the
profile value.

## Generation requests: reserve credits server-side

The Generate workspace sends validated audio metadata to `POST /api/jobs`. The route reads the
user from the session cookie, then calls the protected `reserve_generation()` function. That
function atomically reserves 10 credits and inserts a `queued` job, preventing the browser from
changing a user's balance or identity. Audio upload storage and Shotstack rendering remain
follow-up steps.

## Mock render: derived from job age, settled server-side

There is no worker. On each status poll the route computes the stage from `created_at` and, if
it changed, calls `settle_job()` with the service-role client. `settle_job` only moves
non-terminal jobs and refunds credits on failure, and it is revoked from the anon and
authenticated roles so a browser cannot mark its own job done. This keeps the mock honest about
the real flow and survives serverless cold starts.

## Rendering gate: refuse before reserving credits

Shotstack is not connected. With `MOCK_RENDER` off, `POST /api/jobs` and `POST /api/convert`
return 501 before any credit is reserved, rather than creating jobs that can never finish.

## Free tool: its own page, same gate

`/mp3-to-mp4` is a separate public page rather than a mode of the landing upload panel, because
the PRD treats the free tool as a measurable funnel step and a search entry point. It shares the
Zustand store, so the file picked there survives the signup modal and appears in the workspace.
The landing panel remains the hero conversion path. If one entry point is enough later, the
landing panel is the one to drop.

## Email confirmation stays on

The PRD listed confirmation as out of scope, but it is kept as a product choice. Signup sets
`emailRedirectTo` to `/auth/confirm`, a route handler that exchanges the one-time code for a
session cookie server-side and redirects to the workspace. Supabase only allows custom email
templates with custom SMTP, so the default template is used, which means the link must be
opened in the browser that signed up. The route also accepts a `token_hash` so a custom template
can be adopted later without code changes. Supabase returns a session directly from signup only
when confirmation is off; the modal handles both cases.
