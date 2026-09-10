This is the frontend implementation view of [../PRD.md](../PRD.md). It keeps the product intent, and strips away extra design work. The app should stay simple, fast, and easy to reason about.

## 1. ROUTING
The App Router pages are the product flow from [../PRD.md](../PRD.md). Server components are the default. A page is a client component only when it needs hooks, browser events, or direct DOM behavior.

- / : server component. It is mostly static marketing. It links to the free tool and auth flows.
- /mp3-to-mp4 : client component. It needs file upload, drag and drop, processing state, and button handlers.
- /signup and /login : client components. They need auth form state and browser submit handlers.
- /generate : client component. It needs polling, job status updates, and credit display updates.

This keeps page data loading safe and simple. The server handles data access where possible. The client handles only the behavior that needs the browser.

## 2. COMPONENTS
Anything used on two or more pages belongs in components/. Pages should stay as thin composition layers and hold page logic only.

| Name | Used on which pages | Key props |
| --- | --- | --- |
| PageShell | /, /mp3-to-mp4, /signup, /login, /generate | title, children, showCredits |
| UploadZone | /mp3-to-mp4 | onFileSelect, accept, loading |
| ProcessingStatus | /mp3-to-mp4, /generate | status, message |
| ResultCard | /mp3-to-mp4, /generate | title, src, actions |
| CtaButton | /, /mp3-to-mp4, /generate | variant, label, onClick |
| AuthForm | /signup, /login | mode, onSubmit |
| CreditsBadge | /generate | credits |

The rest of the UI can stay page-local if it is used once. This keeps the codebase lean and avoids a component library that is too large for a demo app.

## 3. STATE AND DATA
Local state stays in React with useState. The app does not need Redux, Zustand, or a global store. This keeps the state easy to trace and fits the small product size.

Server data is fetched from our API routes. In the generate flow, the page polls GET /api/jobs/[id] every two seconds with a useEffect-based hook in lib/. The hook stops when the status is done or failed. The job id is read from the URL so refreshes keep the current render state.

This is enough for the demo. A global state library would add complexity without meaningful value.

## 4. UI CONVENTIONS
Use Mantine for all shared UI. Do not add Tailwind. Do not add custom CSS unless Mantine cannot handle the need.

The app should configure theme settings once in the root layout. This keeps visual decisions consistent and removes repeated style hacks. Every async view needs a loading state, an empty state, and an error state. That includes file upload, conversion, and job polling.

The design should be clear and direct. The main goal is to help users understand the conversion steps, not to impress with heavy visual layering.

## 5. ANALYTICS TOUCHPOINTS
Client-side PostHog events should be fired in handlers, not in render. This keeps the events tied to actual user actions.

- PageShell or landing hero: tool_opened, when the tool page is opened or the user reaches the main CTA area.
- UploadZone: file_uploaded, when a valid MP3 is selected.
- ProcessingStatus: processing_done, when the free conversion finishes successfully.
- CtaButton: cta_clicked, when the user taps the upgrade or generate CTA.

Server-side events come from the API layer and are not part of the frontend component contract. The frontend should be small and responsible only for user actions and UI state.
