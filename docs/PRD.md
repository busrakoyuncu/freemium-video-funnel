# PRD: freemium-video-funnel

## 1. GOAL
This project is a demo of a freemium AI video product. The funnel is free tool, signup, then credit-based generation. It is built to show funnel instrumentation and async job handling. It is not a production app.

The main concept is simple. A user tries a free MP3-to-MP4 tool. Then they see a strong upgrade prompt. If they sign up, they can start a full video render with credits. This keeps the product easy to explain and easy to measure.

## 2. USER FLOW
The user starts as an anonymous visitor. They use the free MP3-to-MP4 tool. They upload an MP3 file and get a quick result. If the user is not signed in and they already added their song, the Generate video button leads to a signup prompt before they can start the paid render.

This means the funnel becomes free tool usage first, then a clear signup gate before generation. The user can still preview the free tool result, but they cannot start a full music video without an account. After signup, they go to /generate. They see their credits. They spend credits to start a render. The app shows job progress. When the render is done, the user gets a finished video.

Every important step fires an analytics event. This includes tool use, file upload, signup completion, job creation, and job completion.

## 3. PAGES
- / : landing page with a hero, an upload panel, and a link to the free tool. Signed-in users see a link to the workspace.
- /mp3-to-mp4 : free tool. It does not require login. It has a file picker, a converting state, and a result card. If a user is signed out and has a song ready, the Generate video button opens the signup modal instead of starting the paid render.
- Sign up and sign in happen in one shared modal, email and password only. There are no separate auth pages. Signup sends a confirmation email; the link signs the user in and opens /generate.
- /generate : protected server-side by proxy.ts. The page shows a start render button, job status stages, and the final result video. Credits are shown in the sidebar and header from the real balance. The job id is kept in the URL query string so refresh does not lose progress.

The flow is intentionally simple. The app does not need a full marketing site or dashboard. It only needs enough pages to show the funnel clearly.

## 4. BACKEND (Next.js API routes)
- POST /api/convert : Free conversion. It will turn audio and a static cover image into an MP4 through the Shotstack sandbox. Today it runs in mock mode only.
- POST /api/jobs : Requires a valid session. It reserves 10 credits and creates a job record, then returns the job id. The Shotstack render call is not connected yet.
- GET /api/jobs/[id] : Requires a valid session. It only returns data for the owner of the job. It returns the job status and the video url when complete.

Credits work as a deferred ledger. On create, the app reserves 10 credits. On success, the credits are committed. On failure, the credits are refunded. This keeps the balance consistent.

Auth is server-side only. Sessions are cookies. All routes read the Supabase session server-side and use user.id. The app never trusts a client-sent user id.

The app has a MOCK_RENDER=true flag. In that mode, it does not call Shotstack. It derives the render stage from the job age on each status poll. It still writes job records to the database so the full flow can be tested end-to-end. With the flag off, the routes refuse to start a render until Shotstack is connected.

If a user is out of credits, the action should not be disabled. Instead, the start button can proceed to a modal. The modal explains that they need more credits and offers a path to earn 50 credits by sharing previous videos on social media and tagging the brand.

If the user is not signed in and they have already added their song, the Generate video button should trigger the signup flow. The modal or sign-up prompt should appear before the user can start the render. This keeps the free experience useful while enforcing the paid step before generation.

## 5. DATA (Supabase Postgres)
The database has two tables only.

- profiles : user_id pk, email, references auth.users, credits int default 50, created_at
- jobs : id uuid pk, user_id, status text, video_url text nullable, created_at

The `profiles` row represents the app-level account state. It stores the user's email for
convenient visibility and the current credit balance. Authentication credentials remain managed
by Supabase Auth.

The `jobs` table represents one requested full video generation. A job is created when an
authenticated user clicks Generate. It stores the owner, the current lifecycle status, and the
finished video's URL when rendering completes. The job status moves through `queued`, `rendering`,
`voice_added`, `done`, or `failed`. The table stores metadata and status, not uploaded audio bytes.

There are no other tables. This keeps the demo narrow and makes each generation request traceable
without mixing render state into the user profile.

The default user balance is 50 credits after signup. This is a product choice for the demo and makes the funnel feel active from the start.

## 6. ANALYTICS (PostHog, added late in the build)
Client events:
- tool_opened
- file_uploaded
- processing_done
- cta_clicked

Server events:
- signup_completed (fires when the confirmation link is verified)
- job_created
- job_completed
- job_failed
- share_reward_claimed

The target funnel is:
tool_opened -> file_uploaded -> cta_clicked -> signup_completed -> job_created -> job_completed

This funnel is the centerpiece of the demo. It lets the team see whether the free tool is converting into paid behavior and whether the upgrade path is working. The key change is that the signup step happens before the paid generation action begins.

## 7. STACK
The app uses Next.js App Router with TypeScript. It uses CSS Modules with a small token set, no UI library and no Tailwind. A small Zustand store carries the upload draft across the signup gate. It uses Supabase for auth and database. It will use Shotstack sandbox for video rendering. It uses PostHog for analytics. It is deployed on Vercel.

The shared UI lives in components/. Each repeated element gets a single reusable component. This keeps the demo clean and easy to extend.

## 8. OUT OF SCOPE
The project does not include:
- OAuth
- password reset
- profile page
- payments
- tests beyond a few core checks
- any database table not listed above

This is a demo app. It should stay lean and focused on growth funnel behavior.

## 9. BUILD ORDER
Step 2: layout and landing page.
Step 3: Supabase auth and schema.
Step 4: jobs API in mock mode.
Step 5: /generate page with polling.
Step 6: real Shotstack behind the feature flag.
Step 7: PostHog.
Step 8: meta tags and Vercel deploy.

The order matters. The demo should prove the funnel step by step. The job flow should work in mock mode before the real render system is connected.

Job states should be simple and readable. A good status set is queued, rendering, voice added, done, and failed. This is clear for users and easy to track in analytics.

The product should treat signup as a hard gate for generation. The user may use the free tool without an account, but once they try to generate a full video, they must sign in first.
