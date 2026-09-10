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

- / : landing page with links to the tool and auth flows
- /mp3-to-mp4 : free tool experience, no login required
- /signup : email and password signup
- /login : email and password login
- /generate : protected page for render creation and progress tracking

## Backend behavior

The app uses Next.js API routes for the job flow:

- POST /api/convert : free tool conversion
- POST /api/jobs : create a render job and reserve credits
- GET /api/jobs/[id] : fetch status and final video when complete

Important rules:

- session is required for job creation and lookup
- user ownership is enforced server-side
- user.id is read from the Supabase session only
- credits are reserved on start, committed on success, and refunded on failure
- MOCK_RENDER=true simulates render stages without calling Shotstack

## Data model

The database is intentionally small. Only these tables are in scope:

- profiles
  - user_id pk
  - credits int default 50
  - created_at
- jobs
  - id uuid pk
  - user_id
  - status text
  - video_url text nullable
  - created_at

## Analytics

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
- Mantine UI
- Supabase Auth and Postgres
- Shotstack sandbox
- PostHog
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

This project expects environment variables for Supabase, Shotstack, and PostHog. The exact values depend on your local setup. The app should include a mock render mode for local testing.

Example keys to configure:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SHOTSTACK_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
MOCK_RENDER=true
```

## Notes

This project is a demo for product and funnel validation. It keeps the scope narrow and intentionally omits broader SaaS features such as OAuth, password reset, payments, and profile management.

The official product requirements live in [PRD.md](PRD.md).
