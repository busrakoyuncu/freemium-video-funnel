# Project Todo

## Phase 1: Product flow and app foundation
- [x] Read the product requirements in [PRD.md](PRD.md)
- [x] Review the frontend and backend architecture docs
- [x] Set up the Next.js app shell and base styling
- [x] Build the landing page and upload entry flow
- [x] Build the signed-out generate experience
  - [x] keep the uploaded audio available when auth opens
  - [x] show a clear signup gate before generation starts
  - [ ] keep the top navigation and hero layout visually stable during the gate
- [x] Add the signup-before-generation gate
  - [x] unify all entry triggers to a single auth modal
  - [x] make the modal the conversion layer for uploads and CTA actions
  - [x] prevent file loss while the auth flow is active
- [x] Create the post-signup redirect
  - [x] resume the selected upload after sign in
  - [x] continue into the generation flow without resetting the draft

## Phase 2: Core generation flow
- [x] Add upload state and file handling
- [x] Create the generation request flow
- [x] Add credit checks and decrement logic
- [x] Implement the mock render state machine
- [x] Build the result view with the finished video
- [x] Add loading, success, and error UI states
- [x] Refund credits when a job fails
- [x] Show the out-of-credits modal with the share-to-earn offer
- [x] Grant the share reward through claim_share_reward, once a day, finished video required

## Phase 3: Supabase setup
- [x] Create Supabase project
- [x] Set up email and password auth with cookie sessions
- [x] Create the profiles and jobs tables
- [x] Add the reserve_generation and settle_job functions
- [x] Connect app auth to Supabase
- [x] Protect /generate server-side
- [x] Add the /auth/confirm route for the confirmation email
- [ ] Set the Site URL and Redirect URLs in the Supabase dashboard
- [x] Verify signup, email confirmation, and session persistence with a real account

## Phase 4: Free tool
- [x] Build the /mp3-to-mp4 page
- [x] Add POST /api/convert in mock mode
- [x] Gate the full render behind signup from the free tool

## Phase 5: Real rendering
- [ ] Create the public songs bucket in Supabase Storage with a 25 MB cap
- [ ] Upload audio from the browser and keep the file URL on the job
- [ ] Call Shotstack from /api/convert when MOCK_RENDER is off
- [ ] Call Shotstack from /api/jobs and write status back through settle_job
- [ ] Pick the static cover image for the free conversion

## Phase 6: PostHog analytics
- [x] Add PostHog to the app with pageviews and user identification
- [x] Track landing and upload events
- [x] Track signup flow events
- [x] Track generation attempts and credit usage
- [x] Track completion and result events
- [x] Build the funnel insights in PostHog (free tool to render, free conversion, workspace render, signup to render)

## Phase 7: Experiments
- [x] Create the "Landing CTA copy" experiment in PostHog with flag key landing-cta-copy
- [x] Add useExperiment and read the flag in UploadPanel
- [x] QA both variants, deploy, then launch the experiment (launched 2026-09-14)
- [ ] Log the result in docs/EXPERIMENTS.md and remove the flag

## Phase 8: Tests
- [x] Add Vitest with an `npm test` script
- [x] Unit tests for `lib/audio-file.ts` and `lib/jobs.ts`
- [x] Route tests for /api/jobs, /api/jobs/[id], and /api/convert with the Supabase client mocked
- [ ] One Playwright smoke test at deploy time: seeded account, generate, done, credits 40

## Phase 9: Deploy
- [x] Deploy to Vercel (https://freemium-video-funnel.vercel.app, auto-deploys from main)
- [x] Set production env vars (NEXT_PUBLIC_ ones as type Config, not Secret)
- [x] Add the production URL to Supabase Site URL and Redirect URLs
- [x] Test the full funnel end-to-end by hand on the live site
- [ ] Add your own emails to PostHog's internal and test users filter
- [ ] Connect custom SMTP in Supabase to lift the confirmation email rate limit
- [ ] Check auth and session edge cases
- [ ] Fix UX issues and polish the flow

## First milestone target
- [x] Anonymous user can upload
- [x] User hits generate and sees signup gate
- [x] User signs up successfully
- [x] Credits are checked and reduced
- [x] Generation completes in the mock flow
