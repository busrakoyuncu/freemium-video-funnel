# Experiments

How A/B tests are run in this project, and the log of every test. The funnel in [PRD.md](PRD.md) is what experiments are meant to move. PostHog Experiments is the tool.

## 1. Why experiments here

The product is a funnel: free tool, signup gate, paid render. Every step has a conversion rate, and an experiment is the only honest way to learn whether a change moves one of them. Opinions about button copy are free; data about button copy costs a week of traffic. This doc is the process for spending that week well.

## 2. The loop

Every experiment goes through the same twelve steps. Skipping one is how teams ship noise.

### 2.1 Pick the step and measure the baseline
Choose one funnel step. Read its current conversion and weekly volume from the matching PostHog funnel. Write both down. Without a baseline there is no way to know what "better" means or how long the test must run.

### 2.2 Write the hypothesis
One sentence in this shape: "If we [change], then [metric] will [rise or fall by about X] because [reason]." The reason matters: it is what you learn even when the test loses. A hypothesis without an expected size cannot be planned.

### 2.3 Choose the metrics
- **Primary**: exactly one. The event the hypothesis is about. The decision is made on this and nothing else.
- **Secondary**: one or two events further down the funnel, to check the gain is real and not just curiosity clicks.
- **Guardrails**: things that must not get worse. For this product: signup rate, `job_failed` rate, and credits spent. A variant that wins the primary but hurts a guardrail does not ship.

### 2.4 Size the test
Decide the minimum lift worth acting on (the minimum detectable effect). PostHog's experiment page estimates how many visitors per variant that needs at your baseline. Divide by weekly traffic to get the duration. Rules:
- Run at least one full week, so weekday and weekend traffic are both included.
- Set the end date before launch and do not stop early because it "looks significant". Peeking inflates false positives.
- If the estimate is longer than four weeks, the effect you are chasing is too small for the traffic you have. Test something bolder.

### 2.5 Design the variants
One change per experiment. If the variant differs in two ways, a win teaches nothing. Control is the current experience, untouched. Name variants `control` and `test`; if there are more, name them by what they are (`short-copy`, `price-first`), never `a` and `b`.

**Split and rollout.** Default to a 50/50 split with 100% of traffic in the experiment. Equal groups reach a conclusion fastest, and a demo cannot afford to exclude visitors. Use an uneven split or a partial rollout only when the variant could hurt (pricing, credits, a redesign): start with 10 to 20% in the variant, watch the guardrails for a day, then widen. Assignment is per browser and sticky for the whole experiment, so a visitor never sees the variant flip.

### 2.6 Implement behind a feature flag
The experiment creates a PostHog feature flag with the variants. Code reads the flag and renders the matching variant. Conventions for this project:
- Flag keys are kebab-case, `surface-what`: `landing-cta-copy`, `free-tool-upgrade-copy`.
- Read the flag through `hooks/use-experiment.ts`, which returns `control` until PostHog has answered, so users never see a variant flicker into another.
- Read the flag only where the variant is visible. PostHog records an exposure event (`$feature_flag_called`) the moment the flag is read, and exposures on pages where the change is not shown dilute the result.
- Keep the flag in one component. Spreading a flag across files is how it never gets removed.
- Never put an experiment on anything that moves credits or money without a guardrail on refunds and failures.

### 2.7 QA both variants
Before launch, force each variant in your own browser and walk the funnel. Use the PostHog toolbar (Settings, Project, Authorized URLs must include the site) or `posthog.featureFlags.overrideFeatureFlags({ 'landing-cta-copy': 'test' })` in the console. Confirm the exposure event and the metric events arrive under the right variant in Activity.

### 2.8 Launch in the right order
Deploy the code first. Then start the experiment in PostHog. If the experiment starts first, the flag is evaluated by code that does not know it yet, and the first exposures are wasted.

### 2.9 Monitor the first day
Check three things: exposures split close to 50/50, no new errors in the Vercel logs, and guardrails flat. A lopsided split usually means the flag is read on a page only some users reach.

### 2.10 Analyze once the sample is reached
PostHog reports the lift and the probability that the variant is better. Read the primary first. Then secondary and guardrails. Then, and only then, segments such as source or device, and treat those as hints for the next test, not as results of this one. A segment that "wins" inside a losing test is almost always noise.

### 2.11 Decide and write it down
Three outcomes:
- **Ship**: the variant becomes the default in code and the flag is deleted.
- **Kill**: control stays, the flag is deleted, the learning goes in the log.
- **Iterate**: the reason in the hypothesis held but the change was too small; design the next test.
Every outcome gets a row in the log below, including the losses. Losses are the cheapest learning the team has.

### 2.12 Clean up
Remove the flag from code within a week of the decision. A flag that outlives its experiment is dead code with a network call attached.

## 3. What not to test yet
With the traffic a demo gets, most tests will not reach significance. That is fine: the first experiment exists to prove the mechanics work end to end, from flag to exposure to result. Do not run more than one experiment on the same page at a time, and do not test the signup modal until the landing test is done, because both feed the same funnel.

## 4. Experiment log

| # | Name | Flag | Primary metric | Status | Result | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Landing CTA copy | `landing-cta-copy` | tool_opened, source = landing | running since 2026-09-14 | | |

## 5. Experiment 1: Landing CTA copy

**Step and baseline.** Landing page hero button. Baseline conversion from landing pageview to `tool_opened` (source = landing): read from the "Free tool to render" funnel before launch. Weekly traffic: read from Web analytics.

**Hypothesis.** If the hero button says "Try it free" instead of "Start creating video", then `tool_opened` will rise by about 15%, because naming the free part lowers the fear of being asked to pay before seeing anything.

**Variants.** `control`: "Start creating video". `test`: "Try it free". Nothing else changes. The label after the panel opens stays the same in both.

**Metrics.** Primary: `tool_opened` with `source = landing`. Secondary: `cta_clicked` with `cta = generate` and `source = landing`. Guardrails: `signup_completed` count, `job_failed` rate.

**Size and duration.** Minimum detectable effect 15% relative. PostHog's estimate at launch decides the visitors needed; run for at least one full week regardless.

**Implementation.** `UploadPanel` reads `landing-cta-copy` through `useExperiment`. Exposure happens on landing pageview, where the button is visible.

**QA.** Force `test` in the toolbar, confirm the label, open the panel, check Activity shows `$feature_flag_called` with `landing-cta-copy = test` and then `tool_opened`.

**Decision rule.** Ship if the primary lift is positive with at least 90% probability and no guardrail drops. Otherwise kill and log.
