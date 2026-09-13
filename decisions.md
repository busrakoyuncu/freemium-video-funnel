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

## Session navigation: client-side guard for the prototype

The landing page redirects users with an existing Supabase session to `/generate`. The generate
page redirects users without a session back to `/`. Sign out calls Supabase, clears the selected
file, and returns to the landing page. These guards are client-side for the prototype; protected
server routes and cookie-based sessions remain part of the production backend work.

## Supabase client and credentials

The browser client is created once in `lib/supabase/browser-client.ts` and uses only the public
Supabase URL and publishable key. Credentials live in the ignored `.env.local` file and are never
committed to the public repository. No service-role or secret key is exposed to the browser.
