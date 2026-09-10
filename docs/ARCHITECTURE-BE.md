This is the backend implementation view of [../PRD.md](../PRD.md). It keeps the product rules and avoids extra infrastructure. The design should be clear, small, and easy to debug.

## 1. API ROUTES
| Method | Path | Auth required | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | /api/convert | No | MP3 file and cover asset input | Converted MP4 result or processing status | 401 if session is required later, 422 bad file |
| POST | /api/jobs | Yes | signed-in user, audio source, render request | job id and status | 401, 402 insufficient credits, 422 bad file |
| GET | /api/jobs/[id] | Yes | valid job id from the session owner | current status, video_url when complete | 401, 404, 422 if request is malformed |

These routes are intentionally thin. They validate input, call the correct service, and return only the minimum needed for the UI. No large service layer is needed for a demo app.

## 2. AUTH
Use @supabase/ssr with cookie-based sessions. Middleware protects /generate and any route that needs a signed-in user. Each protected route must call supabase.auth.getUser() and use user.id from the server response.

Never accept a user id from the client. The client can send a request, but the server owns the trust boundary. This keeps the app aligned with the PRD and avoids a common security mistake.

## 3. JOB LIFECYCLE
Jobs live in the jobs table with status stored in jobs.status. The state machine is queued -> rendering -> done or failed. The app moves the state in one place and keeps the status updates explicit.

In mock mode, a timer advances the job through the stages. In real mode, the app uses Shotstack status polling or a similar render lifecycle check. The app reserves 10 credits when the job is created, commits them when the job reaches done, and refunds them when the job reaches failed. Every transition should also emit an analytics event because the product is built around measuring funnel health and conversion quality.

## 4. STORAGE
Uploads go to the public songs bucket in Supabase Storage. Keep the cap at 15 MB and allow mp3 files only. The app stores the file URL in the render request and sends that URL to Shotstack. The output video stays on the Shotstack CDN.

The Postgres jobs table stores only video_url. It does not store file bytes. The API routes do not proxy file streams. This keeps the database small, the app cheaper to operate, and the storage design easier to reason about.

## 5. MOCK MODE
When MOCK_RENDER=true, all Shotstack calls are skipped. The app advances the job with timers, writes real rows to the database, and returns a sample video url. The rest of the app should not know or care whether the render is mock or real.

This is the best way to build the full funnel quickly without blocking on external render behavior. It keeps the job API contract stable and makes local testing realistic.

## 6. ENV VARS
| Variable | Public or server only | Purpose |
| --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Public | App URL for Supabase client setup |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public | Anonymous client access for non-sensitive flows |
| SUPABASE_SERVICE_ROLE_KEY | Server only | Trusted server actions and admin reads/writes |
| NEXT_PUBLIC_POSTHOG_KEY | Public | Browser analytics key |
| NEXT_PUBLIC_POSTHOG_HOST | Public | PostHog host for browser tracking |
| SHOTSTACK_API_KEY | Server only | Render service key for backend job creation |
| MOCK_RENDER | Server only | Enables mock job flow for local testing |

The Shotstack key must never be NEXT_PUBLIC_ because that would expose it to the browser. The production app should keep all external render credentials on the server only. This is a basic security rule and a performance and maintenance win.
