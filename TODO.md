# Project Todo

## Phase 1: Product flow and app foundation
- [x] Read the product requirements in [PRD.md](PRD.md)
- [x] Review the frontend and backend architecture docs
- [x] Set up the Next.js app shell and base styling
- [x] Build the landing page and upload entry flow
- [ ] Build the signed-out generate experience
  - [x] keep the uploaded audio available when auth opens
  - [x] show a clear signup gate before generation starts
  - [ ] keep the top navigation and hero layout visually stable during the gate
  - [ ] add a mock signed-out generate state for validation
- [ ] Add the signup-before-generation gate
  - [x] unify all entry triggers to a single auth modal
  - [x] make the modal the conversion layer for uploads and CTA actions
  - [x] prevent file loss while the auth flow is active
- [ ] Create the post-signup redirect and user onboarding flow
  - [ ] resume the selected upload after sign in
  - [ ] continue into the generation flow without resetting the draft
  - [ ] show a follow-up onboarding or profile step if needed

## Phase 2: Core generation flow
- [ ] Add upload state and file handling
- [ ] Create the generation request flow
- [x] Add credit checks and decrement logic
- [ ] Implement a mock or queued generation state
- [ ] Build the result page and final asset view
- [ ] Add basic loading and success/error UI states

## Phase 3: Supabase setup
- [ ] Create Supabase project
- [ ] Set up auth providers and session handling
- [ ] Create the minimal user table
- [ ] Create the credits table and credit rules
- [ ] Connect app auth to Supabase
- [ ] Store and read user state in the app
- [ ] Verify signup and session persistence

## Phase 4: PostHog analytics
- [ ] Add PostHog to the app
- [ ] Track landing and upload events
- [ ] Track signup flow events
- [ ] Track generation attempts and credit usage
- [ ] Track completion and result events
- [ ] Review event data in PostHog

## Phase 5: QA and polish
- [ ] Test the full funnel end-to-end
- [ ] Confirm credit rules and gating work correctly
- [ ] Check auth and session edge cases
- [ ] Fix UX issues and polish the flow
- [ ] Prepare deployment configuration
- [ ] Validate production environment variables

## First milestone target
- [ ] Anonymous user can upload
- [x] User hits generate and sees signup gate
- [ ] User signs up successfully
- [x] Credits are checked and reduced
- [ ] Generation completes in mock or queued flow
