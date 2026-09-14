# freemium-video-funnel

A demo app for a freemium AI video product. The goal is to show a simple funnel: free tool usage, signup, and credit-based generation. This is not a production app. It is a proof of concept for funnel instrumentation and async render jobs.

## Product idea

A visitor can use a free MP3-to-MP4 tool without signing in. Once they add a song and try to start a full music video render, they are asked to sign up before generation continues. After signup, they land on the generation page, spend credits, and watch the render progress until they receive a video.

The app is meant to demonstrate:

- funnel behavior from anonymous tool use to signup
- credit reservation and redemption logic
- async job handling with polling
- PostHog analytics around the funnel
- server-side auth and ownership checks

## Core flow

1. User visits the landing page.
2. User opens the free MP3-to-MP4 tool.
3. User uploads an MP3 and sees a result.
4. User clicks Generate video.
5. If signed out, the app prompts signup before generation starts.
6. User signs up and lands on the generate page.
7. User pays 10 credits to start a render.
8. The app polls job status and shows queued, rendering, voice added, done, or failed states.
9. When complete, the user sees the final video.

## Pages

- / : landing page with the upload panel, a link to the free tool, and the auth modal
- /mp3-to-mp4 : free tool experience, no login required
- /generate : protected page for render creation and progress tracking

Sign up and sign in use one shared modal. There are no separate auth pages.

## Backend behavior

The app uses Next.js API routes for the job flow:

- POST /api/convert : free tool conversion
- POST /api/jobs : create a render job and reserve credits
- GET /api/jobs/[id] : fetch status and final video when complete

Important rules:

- session is required for job creation and lookup
- user ownership is enforced server-side through row-level security
- user.id is read from the Supabase session cookie only
- credits are reserved on start and refunded on failure, inside database functions
- sharing a finished video earns 50 credits, once a day, through POST /api/credits/share
- MOCK_RENDER=true simulates render stages without calling Shotstack

Real rendering is not connected yet. With MOCK_RENDER off, both POST routes refuse with 501 before touching credits. See [docs/ARCHITECTURE-BE.md](docs/ARCHITECTURE-BE.md) for the planned Shotstack flow.

## Data model

The database is intentionally small. Only these tables are in scope:

- profiles
  - user_id pk
  - email (mirrors auth.users.email)
  - credits int default 50
  - created_at
- jobs
  - id uuid pk
  - user_id
  - status text
  - video_url text nullable
  - created_at

## Analytics

PostHog is wired in. Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` (EU projects use `https://eu.i.posthog.com`) and events appear under Activity. Browser events fire from handlers through `lib/analytics.ts`; server events fire from the API routes through `lib/analytics-server.ts`. Both use the Supabase user id as the person id, so one user's events line up across browser and server.

Five funnel insights exist in the PostHog project: "Free tool to render" (the main one below), "Free conversion", "Workspace render", "Signup to render", and "Share to earn". They are built from the events listed here and need no code to change.

The analytics layer is centered on the funnel:

tool_opened -> file_uploaded -> cta_clicked -> signup_completed -> job_created -> job_completed

Client events include:

- tool_opened
- file_uploaded
- processing_done
- cta_clicked

Server events include:

- signup_completed
- job_created
- job_completed
- job_failed
- share_reward_claimed

## Stack

- Next.js App Router
- TypeScript
- CSS Modules with design tokens
- Zustand for the upload draft and modal state
- Supabase Auth (cookie sessions via @supabase/ssr) and Postgres
- Shotstack sandbox (planned)
- PostHog for funnel analytics
- Vercel deployment

## Local setup

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Open http://localhost:3000 in the browser.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the Supabase values from Project Settings, API. Keep `MOCK_RENDER=true` until Shotstack is connected. The service role key is needed for the mock render to move jobs forward.

## Supabase setup

1. Run the files in `supabase/migrations/` in order in the SQL editor.
2. Under Authentication, URL Configuration, set the Site URL to your app URL (http://localhost:3000 in development) and add `http://localhost:3000/**` to Redirect URLs. Add the production URL the same way at deploy time.
3. Under Authentication, Sign In / Providers, Email, keep "Confirm email" on.

Signup asks Supabase to send the user back to `/auth/confirm`, which exchanges the one-time code for a session cookie and opens the workspace. With the default email template the link must be opened in the browser that signed up. Supabase only allows editing the template with custom SMTP; if that is set up later, point the template at `/auth/confirm?token_hash={{ .TokenHash }}&type=email` and the same route works from any device.

## Current status

Live at https://freemium-video-funnel.vercel.app, deployed from `main` by Vercel.

Working: landing upload, signup gate, cookie auth, credit reservation, mock render with stage polling, refund on failure, free tool in mock mode, share-to-earn credits, PostHog funnels, one running A/B test.

Not yet: audio upload storage, Shotstack rendering, the Playwright smoke test, custom SMTP for Supabase emails. See [docs/TODO.md](docs/TODO.md).

## A/B testing

Experiments run through PostHog. The process, the conventions, and the log of every test are in [docs/EXPERIMENTS.md](docs/EXPERIMENTS.md). In short:

1. An experiment in PostHog creates a feature flag with two variants, `control` and `test`, and assigns each visitor to one at random. The assignment is stored in the browser, so a visitor always sees the same variant.
2. The code asks PostHog for the visitor's variant through `hooks/use-experiment.ts` and renders the matching version. Until PostHog answers, it renders `control`, so nothing flickers. Asking for the flag also records the exposure that results are counted against.
3. PostHog compares the primary metric between the two groups and reports the lift and how confident it is.

### The running experiment: `landing-cta-copy`

The only thing that changes is the text of the big button under the landing page headline:

| Group | Button text | Share of visitors |
| --- | --- | --- |
| `control` | Start creating video (the original) | 50% |
| `test` | Try it free | 50% |

Everything else is the same for both groups: the page, the upload panel that opens, the label the button shows after the panel is open, the signup gate, and the workspace. The switch lives in one place, `components/features/upload-panel.tsx`, where the button label is picked from the variant that `useExperiment('landing-cta-copy')` returns.

What is measured: how many visitors in each group open the upload panel (`tool_opened` from the landing page). Secondary: how many go on to click Generate. Running since 2026-09-14. When it ends, the winning text becomes the only one, the flag is removed from the code, and the result is written in the experiment log.

## Deploying

Vercel builds every push to `main`. Two things that are easy to get wrong:

- Environment variables whose name starts with `NEXT_PUBLIC_` must be created as type **Config** in Vercel. A **Secret** is kept out of the browser bundle even with the public prefix, which silently disables PostHog.
- After changing the production URL, update Supabase (Authentication, URL Configuration: Site URL and a `/**` entry in Redirect URLs), or confirmation links stop landing on `/auth/confirm`.

Supabase's built-in email sender allows only a few confirmation emails per hour. Connect custom SMTP (Authentication, Emails, SMTP Settings) before showing the demo to a group.

## Testing

Scope, kept small on purpose:

- Vitest unit tests for the pure logic in `lib/` (file validation, mock stage timing).
- Vitest route tests that call the exported handlers directly with the Supabase client mocked, covering 401, 422, 501, 402, the happy path, and the refund fallback.
- One Playwright smoke test after deploy (planned): a seeded account renders a video and ends at 40 credits.

The SQL functions are not tested automatically. They are small, were verified live, and testing them needs a local Supabase stack. No component or snapshot tests.

Run with `npm test`. See [docs/TESTING.md](docs/TESTING.md) for how the mocks work and how to add a test.

## Docs

- [docs/PRD.md](docs/PRD.md): product requirements, the source of truth for scope
- [docs/TODO.md](docs/TODO.md): what is done and what is next
- [docs/decisions.md](docs/decisions.md): why things are the way they are
- [docs/ARCHITECTURE-FE.md](docs/ARCHITECTURE-FE.md) and [docs/ARCHITECTURE-BE.md](docs/ARCHITECTURE-BE.md): how the app is built
- [docs/DESIGN-ARCHITECTURE.md](docs/DESIGN-ARCHITECTURE.md): visual direction and tokens
- [docs/TESTING.md](docs/TESTING.md): how the tests work
- [docs/EXPERIMENTS.md](docs/EXPERIMENTS.md): how A/B tests are run, and the experiment log

## Notes

This project is a demo for product and funnel validation. It keeps the scope narrow and intentionally omits broader SaaS features such as OAuth, password reset, payments, and profile management.
