# Phase 8A - Cloudflare Pages Free Cutover and Repository Privacy Readiness

Date: 2026-07-23
Status: Goal-mode execution guide with an external-action hold point
Project: Greedy Sweeper
Round budget: 12 rounds; rounds 1-7 safe preparation, rounds 8-10 gated external cutover, round 11 repair buffer, round 12 final validation

## 0. Direct Goal Prompt

Prepare and, only after a fresh explicit action-time authorization, migrate the Greedy Sweeper web frontend from GitHub Pages to Cloudflare Pages Free at `greedysweeper.onovich.com`. Keep the existing Free Worker on its approved `workers.dev` origin. Preserve the existing GitHub Pages deployment as a rollback path until Cloudflare Pages production and public HTTPS/WSS smoke pass. Make the repository private only after the Cloudflare deployment, custom domain, Git integration, rollback, and post-cutover smoke are proven. Complete every safe local and repository preparation round now; stop before creating projects, changing DNS, disabling GitHub Pages, changing repository visibility, or granting GitHub App access when the user is unavailable.

## 1. Required Context

Read before changing files:

- `README.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, and `Role.md`
- `docs/phase-6c-validation-report.md` and `docs/phase-6c-production-readiness.md`
- `docs/phase-7-validation-report.md`
- accepted `docs/domain-migration/**` readiness evidence, read-only and never staged
- current Vite base-path configuration, Pages workflow, Free Beta smoke, Worker endpoint injection, and rollback scripts
- current official Cloudflare Pages Git integration, custom-domain, redirects, deployment, rollback, build, and limits documentation
- `$donextgoal` and `$project-git-workflow`

Accepted baseline: Phase 7 report commit `5e1d607`; deployed UI implementation `e1374a2`.

## 2. Fixed Product and Infrastructure Decisions

- Sequence: Phase 8A hosting/privacy migration first; Phase 8B online public-projection completeness second.
- Canonical web hostname: `greedysweeper.onovich.com`.
- `onovich.com/greedysweeper` is rejected because the apex remains owned by Cargo and a path cannot independently bind to Cloudflare Pages without an apex reverse proxy or Worker routing layer.
- The existing Worker remains at `https://greedy-sweeper-room-preview.onovich1110.workers.dev` during this phase.
- Cloudflare Pages uses the Free plan; no Workers Paid, paid add-on, or billing activation is authorized.
- GitHub Pages remains live during preparation and observation.
- Repository visibility changes from public to private only after Cloudflare Pages and custom-domain acceptance.
- `blog.onovich.com/GreedySweeper/` remains the rollback/legacy endpoint until a separately reviewed redirect is activated.

## 3. Phase Goal

- Make the Vite application host-neutral so both `/GreedySweeper/` and root-path Pages builds can be produced without source forks.
- Define a non-secret Cloudflare Pages production build using the existing public Free Worker endpoint.
- Add reusable Cloudflare Pages endpoint, asset, UI, Classic, Greed, and reconnect smoke commands.
- Add custom-domain, DNS, certificate, GitHub integration, rollback, and repository-privacy runbooks.
- Prove an isolated local/root-path build and Preview-equivalent artifact before any external side effect.
- After explicit authorization, create/connect the Pages project, deploy, bind the custom hostname, and run independent public smoke.
- Observe both hosts, then disable GitHub Pages and make the repository private only after rollback and Git integration are proven.

## 4. Explicit Non-Scope

- No Phase 8B protocol fields for online POT, multiplier, remaining mines, or flag ownership.
- No gameplay, UI redesign, AI, progression, replay, room lifecycle, protocol, Worker/Durable Object, or Worker deployment change.
- No apex-domain takeover, Cargo-site migration, email/MX change, DNSSEC activation, orange-cloud experiment, or Worker custom domain.
- No Workers Paid, billing method, analytics vendor, account system, or secret committed to the repository.
- Do not edit or stage `docs/domain-migration/**` or unrelated concurrent files.

## 5. External-Action Authorization Gate

Rounds 1-7 are safe preparation and may proceed immediately. Before round 8, stop and return `BLOCKED_PENDING_USER_ACTION` unless the planner provides fresh authorization that explicitly covers:

- Cloudflare Pages project creation and GitHub repository connection
- GitHub App access to the selected repository when required
- `greedysweeper.onovich.com` DNS/custom-domain creation
- production deployment and certificate validation
- later GitHub Pages disablement and repository privatization

Login, OAuth, 2FA, CAPTCHA, GitHub App installation, or account-security prompts must be left for the user. Never bypass them, request passwords, or persist session tokens.

## 6. Per-Round Fixed Workflow

Every round must report:

- round goal and migration value
- safe versus external-action classification
- files and infrastructure state changed
- Debug self-check
- architecture/security/rollback self-check
- validation commands and exact results
- commit hash and push result
- next round, authorization status, and buffer use

A failed validation, commit, push, deployment, certificate, smoke, or rollback check blocks progression. Every completed repository round is committed and pushed before the next round. Stage only phase-owned files.

## 7. Debug Self-Check

- Can the build be reproduced for GitHub subpath and Cloudflare root path without manual source edits?
- Can failures be localized to build base, asset URL, environment injection, Pages project, Git integration, DNS, certificate, redirect, smoke, or visibility?
- Are missing endpoint, stale asset, deployment failure, certificate pending, DNS mismatch, old cache, and private-repository rebuild states handled?
- Does every external change have a recorded previous value and exact rollback action?
- Do public smoke logs avoid room credentials, secrets, hidden board state, and personal data?

## 8. Architecture and Security Self-Check

- Does deployment configuration remain outside gameplay and presentation semantics?
- Is `VITE_ONLINE_ENDPOINT` still public, non-secret, and environment-injected?
- Are Cloudflare API tokens absent from source, artifacts, logs, and docs?
- Does the Worker origin and authority model remain unchanged?
- Are GitHub Pages and Cloudflare Pages artifacts built from the same accepted source commit?
- Does repository privatization occur only after private-repository integration and rebuild are proven?
- Are Cargo apex records, domain-migration files, DNSSEC, billing, and unrelated DNS records untouched?

## 9. Validation Matrix

Safe preparation must pass:

```text
npm run format:check
npm run lint
npm run test:run
npm run arch:check
npm run workspace:check
npm run build
npm run visual:test
npm run cutover:test
git diff --check
```

Add focused reusable commands for root-path Pages artifact validation and endpoint smoke. External acceptance must additionally prove:

- Cloudflare Pages production deployment is successful for the recorded commit.
- `https://greedysweeper.onovich.com/` returns HTTPS 200 with the expected Lunar Console artifact.
- Classic, Greed, and reconnect HTTPS/WSS public smoke pass against the unchanged Free Worker.
- A private-repository rebuild succeeds after visibility change.
- Rollback to GitHub Pages or the prior Cloudflare deployment is documented and rehearsed without data loss.

## 10. Round Plan

1. **Hosting contract and red gates**: freeze hostname, build paths, environment contract, external action list, current DNS/Pages evidence, rollback targets, and tests that fail on hard-coded GitHub paths.
2. **Host-neutral Vite build**: support explicit GitHub subpath and Cloudflare root-path builds from one source tree; retain offline local behavior when the endpoint is absent.
3. **Cloudflare artifact validation**: add a deterministic root-path production build, asset/link checks, Lunar Console marker check, and public Worker endpoint check without deploying.
4. **Reusable endpoint smoke**: parameterize UI, asset, Classic, Greed, reconnect, and terminal verification smoke for any public frontend origin without credentials.
5. **Pages configuration and Git integration plan**: add reviewed build/output/environment settings, branch policy, preview policy, secret policy, and private-repository GitHub App checklist without creating the project.
6. **DNS, certificate, redirect, and rollback runbook**: record current values, target records, TTL/propagation checks, certificate gates, legacy URL treatment, disable/restore steps, and evidence templates.
7. **Safe-preparation validation**: run the full safe matrix, build both hosting variants, audit secrets and scope, commit/push the readiness report, and return `BLOCKED_PENDING_USER_ACTION` if authorization or login interaction is unavailable.
8. **Gated Pages project and first deployment**: after authorization, create/connect Cloudflare Pages Free, configure production branch/build/output/public endpoint, deploy the accepted commit, and verify the `pages.dev` origin before DNS.
9. **Gated custom-domain cutover**: bind `greedysweeper.onovich.com`, make only the approved DNS change, verify certificate and HTTPS, then run independent UI plus Classic/Greed/reconnect smoke while GitHub Pages remains live.
10. **Gated privacy transition**: after observation and rollback checks, verify GitHub App private-repository access, make the repository private, prove a new private-source deployment, then disable GitHub Pages only after both Cloudflare production and rollback evidence are accepted.
11. **Repair buffer**: repair only Phase 8A failures; no Phase 8B or unrelated scope.
12. **Final validation**: verify builds, private-source deployment, custom domain, public game smoke, DNS/certificate state, rollback, repository visibility, Free-plan boundaries, and write `docs/phase-8a-validation-report.md`.

## 11. PASS Criteria

- Cloudflare and GitHub build variants are reproducible from one source without visual or gameplay forks.
- Cloudflare Pages serves the accepted Lunar Console at `greedysweeper.onovich.com` over valid HTTPS.
- Public Classic, Greed, reconnect, and terminal smoke pass against the unchanged Free Worker.
- GitHub Pages stays available until Cloudflare acceptance and rollback are proven.
- The private repository triggers a successful Cloudflare deployment before GitHub Pages is disabled.
- No secrets, paid activation, Worker deployment, protocol change, apex/Cargo change, or unrelated DNS change occurs.
- Every repository change is validated, committed, and pushed; every external change has evidence and rollback.

## 12. Final Report Template

```text
Phase: Phase 8A - Cloudflare Pages Free Cutover and Repository Privacy Readiness
Status: PASS | BLOCKED_PENDING_USER_ACTION | FAIL
Rounds used: <safe>/<external>/<buffer>/<final>
Build variants: <GitHub subpath and Cloudflare root evidence>
Cloudflare project: <project, branch, build, deployment id>
Custom domain: <DNS, certificate, HTTPS evidence>
Public smoke: <UI, Classic, Greed, reconnect, terminal>
Repository privacy: <visibility and private-source rebuild evidence>
GitHub Pages: <parallel observation, disablement, rollback>
Free-plan boundary: <no paid activation evidence>
Validation: <commands and exact results>
Commits: <round -> hash>
Concurrent exclusions: <domain-migration and unrelated evidence>
External actions: <exact authorized changes only>
Residual risks: <explicit list>
Return to planner: 019f6768-2328-76f2-a6e4-da752c6eb85c
```
