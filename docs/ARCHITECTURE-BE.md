This is the backend implementation view of [PRD.md](PRD.md). It describes what is built and marks what is still planned.

## 1. API ROUTES
| Method | Path | Auth | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | /api/convert | No | multipart form with `file` | `{ videoUrl }` | 400 bad body, 422 bad file, 501 rendering not connected |
| POST | /api/jobs | Yes | JSON `{ file: { name, size, type } }` | `{ jobId, status }` 201 | 401, 402 insufficient credits, 422 bad file, 501 rendering not connected |
| GET | /api/jobs/[id] | Yes | job id in the path | `{ id, status, videoUrl }` | 401, 404 not found or not the owner |
| POST | /api/credits/share | Yes | none | `{ credits }` new balance | 401, 409 no finished video, 429 already claimed today |

Routes validate input, call one database function, and return the minimum the UI needs. Audio bytes are not sent to /api/jobs yet, only metadata. Upload storage is planned (see section 4).

## 2. AUTH
`@supabase/ssr` with cookie sessions. `lib/supabase/server-client.ts` builds a per-request client from the cookies. `proxy.ts` refreshes the session and redirects signed-out visitors away from /generate. Every protected route calls `supabase.auth.getUser()` and uses the returned id. The client never sends a user id.

Signup requires email confirmation. `signUp` passes `emailRedirectTo` pointing at `GET /auth/confirm`, so the default Supabase email lands there with a one-time `code`. The route exchanges it for a session cookie and redirects to `next`. It also accepts `token_hash` and `type` for a custom template. A bad or expired link redirects home with `?auth=confirm-failed`. Site URL and Redirect URLs must be set in the dashboard (see the README).

## 3. DATABASE
Two tables, both with row-level security. Users can read their own rows only. All writes go through functions.

- `profiles`: user_id, email, credits (default 50), share_reward_claimed_at, created_at. A trigger creates the row on signup and keeps email in sync.
- `jobs`: id, user_id, status, video_url, created_at. Status is one of queued, rendering, voice_added, done, failed.

Functions, all `security definer`:

- `reserve_generation()`: callable by authenticated users. Deducts 10 credits when the balance allows it and inserts a queued job in one statement, so two clicks cannot overspend.
- `settle_job(job_id, next_status, next_video_url)`: revoked from anon and authenticated, called only with the service-role key. Moves a non-terminal job forward and refunds 10 credits when the new status is failed. Terminal jobs are left alone.
- `claim_share_reward()`: callable by authenticated users. Adds 50 credits to the caller once per day, and only if they have at least one finished job. Records the claim in `profiles.share_reward_claimed_at`.
- `fail_job(job_id)`: callable by the owner. Marks their own non-terminal job failed and refunds 10 credits. The status route calls it when the render cannot be advanced (missing or rejected service key, or a settle error), so a broken render never keeps the credits.

Migrations live in `supabase/migrations/` and are applied by hand in the SQL editor.

## 4. JOB LIFECYCLE AND MOCK MODE
`MOCK_RENDER=true` is the only working mode today. With it off, both POST routes refuse with 501 before touching credits, because no renderer is connected.

In mock mode, `GET /api/jobs/[id]` derives the stage from the job age (queued under 4 s, rendering under 10 s, voice added under 15 s, then done with a sample video). When the derived stage differs from the stored one, the route calls `settle_job` with the admin client. There are no timers or workers, so this survives serverless cold starts. The free tool's mock conversion just waits 1.5 s and returns the sample video.

Planned real mode: the browser uploads audio to a public `songs` bucket (25 MB cap, audio only), the route sends the file URL to Shotstack, and status polling asks Shotstack and writes back through `settle_job`. The output stays on the Shotstack CDN and `jobs.video_url` stores the link.

## 5. ANALYTICS
Server events go through `trackServer()` in `lib/analytics-server.ts`. It creates a PostHog client per call, captures with the Supabase user id as the person id, and awaits the flush before returning so a serverless function cannot be frozen with the event still queued.

- `signup_completed`: `/auth/confirm`, after the code or token hash is exchanged for a session.
- `job_created`: `POST /api/jobs`, after `reserve_generation` succeeds, with `job_id`.
- `job_completed` and `job_failed`: `GET /api/jobs/[id]`, on the poll that moves the job to a terminal state, with `job_id`. The refund path emits `job_failed` too.
- `share_reward_claimed`: `POST /api/credits/share`, after the reward is granted, with the new `credits` balance.

## 6. ENV VARS
| Variable | Scope | Purpose | Status |
| --- | --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Public | Supabase project URL | Required |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public | Anonymous key, safe with RLS | Required |
| SUPABASE_SERVICE_ROLE_KEY | Server only | Calls `settle_job` | Required for the mock render |
| MOCK_RENDER | Server only | Enables the mock flow | Required, must be `true` |
| SHOTSTACK_API_KEY | Server only | Real rendering | Planned |
| NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST | Public | Analytics, also used by the server helper | Optional, events skipped without them |

`.env.example` lists them. The service role and Shotstack keys must never be prefixed with NEXT_PUBLIC_.
