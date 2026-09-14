This is the frontend implementation view of [../PRD.md](../PRD.md). It describes what is built, not a plan.

## 1. ROUTING
Pages are server components by default. They read the session with the cookie-backed Supabase client and hand the result to a client component that owns the browser behavior.

- / : server component. Renders the hero, the upload panel, and the auth modal. Shows a workspace link instead of the sign in button when the user is signed in.
- /mp3-to-mp4 : server component wrapping the client `FreeTool`. Public. Converts audio to a video in mock mode and offers the paid render behind the signup gate.
- /generate : server component. Redirects home without a session, reads the credit balance from `profiles`, and renders the client `GenerateWorkspace`. The job id lives in the `job` query string so a refresh keeps the progress view.

There are no /signup or /login pages. All auth happens in one modal that any page can open. After signup the modal asks the user to open the confirmation email; that link lands on the server route `/auth/confirm` and then in the workspace. The selected file does not survive that hop, since the link opens a fresh tab, so the workspace offers its own file picker.

`proxy.ts` (Next 16's middleware) refreshes the session cookie on every request and redirects signed-out visitors away from /generate before the page renders.

## 2. COMPONENTS
| Name | File | Used on | Purpose |
| --- | --- | --- | --- |
| AuthModal | components/auth/auth-modal.tsx | /, /mp3-to-mp4 | Sign in and sign up tabs, password rules, Escape to close |
| AuthButton | components/auth/auth-button.tsx | / | Opens the modal from a server component |
| UploadPanel | components/features/upload-panel.tsx | / | Expanding upload area under the hero CTA, Generate gate |
| FreeTool | components/features/free-tool.tsx | /mp3-to-mp4 | Pick audio, convert, result card, upgrade CTA |
| GenerateWorkspace | components/features/generate-workspace.tsx | /generate | Sidebar with credits, new render form, stage list, result video |

Each component owns its CSS module. Nothing imports another page's stylesheet.

## 3. STATE AND DATA
Local UI state stays in `useState`. One small Zustand store in `store/use-app-store.ts` holds the state that must survive navigation and the auth gate: the selected `File`, the modal open state and tab, and the landing upload panel state. The file is memory only, so a hard refresh drops it. That is accepted until audio upload storage exists.

Server data comes from our API routes. `lib/use-job-status.ts` polls `GET /api/jobs/[id]` every two seconds and stops on `done` or `failed`. Credits are read on the server in the page, and the workspace calls `router.refresh()` when a job settles so a refund shows up.

## 4. UI CONVENTIONS
CSS Modules only. No Mantine, no Tailwind. The palette is a set of CSS variables in `app/globals.css` and module files reference tokens, never hex values. See [DESIGN-ARCHITECTURE.md](DESIGN-ARCHITECTURE.md) for the token table.

Shared file validation lives in `lib/audio-file.ts` and is used by the browser and the API routes. Every async view has a loading, error, and result state.

## 5. ANALYTICS TOUCHPOINTS
PostHog is not added yet. When it is, client events fire in handlers, not in render:

- FreeTool mount: tool_opened
- UploadPanel and FreeTool file change: file_uploaded
- FreeTool convert success: processing_done
- Generate buttons (UploadPanel, FreeTool, GenerateWorkspace): cta_clicked

Server events come from the API routes.
