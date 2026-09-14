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

Working: landing upload, signup gate, cookie auth, credit reservation, mock render with stage polling, refund on failure, free tool in mock mode.

Not yet: audio upload storage, Shotstack rendering, the PostHog funnel insight, the out-of-credits modal, tests. See [TODO.md](TODO.md).

## Notes

This project is a demo for product and funnel validation. It keeps the scope narrow and intentionally omits broader SaaS features such as OAuth, password reset, payments, and profile management.

The official product requirements live in [PRD.md](PRD.md).
