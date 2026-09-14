# Testing

How the test suite is built and how to extend it. The reasoning behind the scope is in [../decisions.md](../decisions.md).

## Running

```bash
npm test          # run once, the form CI uses
npx vitest        # watch mode while working
```

Vitest is configured in `vitest.config.mts`: plain Node environment, `@/` alias mapped to the project root, any `*.test.ts` file is picked up. Tests sit next to the code they cover.

## Unit tests for `lib/`

`lib/audio-file.test.ts` and `lib/jobs.test.ts` test pure functions. They need no mocks. Time-based logic uses Vitest's fake clock (`vi.useFakeTimers` and `vi.setSystemTime`) so boundaries like "done after 15 seconds" are exact. Environment flags use `vi.stubEnv`, reset in `afterEach`.

## Route tests

Each API route exports a plain handler, so a test calls it directly with a `Request` and inspects the `Response`. No server runs. Files: `app/api/jobs/route.test.ts`, `app/api/jobs/[id]/route.test.ts`, `app/api/convert/route.test.ts`. Next ignores them because only files named `route.ts` are routes.

Three modules are replaced with fakes through `vi.mock` at the top of each file:

- `@/lib/supabase/server-client`: the cookie-backed user client. The fake exposes `auth.getUser`, `rpc`, and a `from().select().eq().maybeSingle()` chain, which is all the routes use.
- `@/lib/supabase/admin-client`: the service-role client. Returning `null` from the mock simulates a missing key.
- `@/lib/analytics-server`: PostHog. Tests assert `trackServer` was called with the right user, event, and job id, and that it was not called on failure paths.

In the status route test, job reads come from a queue (`maybeSingle.mockResolvedValueOnce` per read), so a test scripts what the database returns before and after the route writes. That is how the advance and refund paths are checked without a database.

`console.error` is silenced with a spy in `beforeEach` so expected failure paths do not clutter the output. `vi.restoreAllMocks` in `afterEach` puts it back.

## Adding a test for a new route

1. Create `route.test.ts` beside the route.
2. Mock the same three modules if the route uses them, then import the handler.
3. Build the request with `new NextRequest(url, { method, body })` for JSON, or a `FormData` body for uploads.
4. Cover each status code the route can return, and assert on side effects (which `rpc` was called, which event was sent), not only on the response.

## Not covered

The SQL functions (`reserve_generation`, `settle_job`, `fail_job`) are verified by hand in the Supabase SQL editor. Components and CSS are not tested. A single Playwright smoke test is planned for after deploy: sign in with a seeded account, generate, see done, credits read 40.
