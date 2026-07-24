# Phase 8A Validation Report

Phase: Phase 8A - Cloudflare Pages Free Cutover and Repository Privacy Readiness

Status: **READY_FOR_CHECK — ROUND 8 COMPLETE; HOLD BEFORE ROUND 9**

## Safe rounds 1-7 complete

- Hosting is source-neutral: `npm run build:github` produces `/GreedySweeper/`; `npm run build:cloudflare` produces `/`.
- The root-path artifact check verifies root, assets, Lunar Console marker, and the public non-secret Worker endpoint without deploying.
- The public Free beta, GitHub Pages rollback host, and existing `workers.dev` Worker were not changed.
- The runbook records the exact Cloudflare Pages/GitHub App/DNS/certificate/privacy actions and rollback sequence required after authorization.

## Validation

- `format:check`, `lint`, `test:run` (37 files / 126 tests), `arch:check`, `workspace:check`, both build variants, and both artifact checks: PASS.
- Visual contract: Chromium and WebKit completed successfully. Firefox could not initialize its local Playwright context (`browserContext.newPage` internal `_page` error), an environment limitation independent of the changed host-build code. No visual regression is claimed from that unavailable engine.

## Round 8 — Pages project and first deployment

- The user manually completed the Cloudflare Pages Free GitHub connection and first deployment for project `greedysweeper`.
- User-supplied screenshots show the production origin `https://greedysweeper.pages.dev`, the Lunar Console UI and root-path assets loading, and the online room panel in standby with Classic and Greed controls.
- A non-browser HTTPS probe returned `200 OK` from `https://greedysweeper.pages.dev/` with Cloudflare response headers.
- `npm run online:free-beta-smoke` verified the public HTML root, JavaScript asset, Lunar Console marker, online room entry, and injected `https://greedy-sweeper-room-preview.onovich1110.workers.dev` origin before the local environment timed out connecting to `workers.dev`.
- The unchanged Worker was therefore verified from an independent GitHub-hosted network. [Preview Worker Smoke 30130822124](https://github.com/onovich/GreedySweeper/actions/runs/30130822124), at source `4579fdc`, completed successfully and passed HTTPS health, WSS disconnect/reconnect, two-client Classic and Greed completion, and matching terminal proofs. It used the existing public endpoint, no Cloudflare credentials, and performed no deployment.
- A planner-side read-only Wrangler query identified the first manual production deployment as id `fd2243e0-5398-44d6-9264-0367b4d9d3e8`, branch `main`, source `4579fdc`, at `https://fd2243e0.greedysweeper.pages.dev`.
- The same read-only query identified the latest automatic production deployment as id `5304c425-ff50-4f30-9911-f6b502ab6651`, branch `main`, source `c62679f`, at `https://5304c425.greedysweeper.pages.dev`. This successful post-commit deployment proves the configured Git repository integration is automatically building production from `main`.
- Read-only probes confirmed both the canonical Pages origin `https://greedysweeper.pages.dev/` and the retained rollback origin `https://blog.onovich.com/GreedySweeper/` return HTTP `200`.

## Hold before round 9

Round 9 remains blocked pending signed domain readiness and fresh authorization for only the approved `greedysweeper.onovich.com` custom-domain/DNS change. Repository privacy and GitHub Pages disablement remain separate later gates after custom-domain HTTPS, smoke, observation, and rollback evidence.

During this executor round, no Cloudflare/GitHub console was opened or automated, and no Pages setting, DNS/custom domain, repository visibility, billing, GitHub Pages, Worker deployment, `Role.md`, or `docs/domain-migration/**` file was changed.
