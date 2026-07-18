# Phase 6C Free Beta Release Addendum

Date: 2026-07-18
Status: Accepted scope adjustment for the existing Phase 6C executor

## Goal

Release the accepted local and Preview online implementation as a public Free beta through the existing GitHub Pages site and existing `workers.dev` Worker. Do not activate Workers Paid, migrate DNS, configure a production custom domain, move to Cloudflare Pages, or make the repository private in this release.

## Required Release Shape

- Web: existing `https://blog.onovich.com/GreedySweeper/` GitHub Pages deployment.
- API/WSS: existing `https://greedy-sweeper-room-preview.onovich1110.workers.dev` Worker on the Free plan.
- Build: inject the explicit online endpoint into the Pages artifact without credentials or room data.
- Safety: retain `ONLINE_ENABLED`, rate limits, reconnect/lifecycle behavior, privacy-safe output, and external Preview smoke.
- Rollback: disable new rooms first, then restore the previous Pages artifact if public integration fails.

## Focused Execution Steps

1. Update the GitHub Pages build to inject the public Free-beta Worker origin through a non-secret repository variable or workflow environment value.
2. Preserve a safe local-only fallback when the value is absent.
3. Scan the artifact for credentials, tokens, room identifiers, hidden state, and production-only configuration.
4. Deploy Pages through the existing workflow.
5. Run independent public UI/two-client smoke through HTTPS/WSS for Classic, Greed, reconnect, and terminal verification.
6. Verify `ONLINE_ENABLED=false` blocks new rooms without breaking existing-room recovery/cleanup, then restore the approved beta state.
7. Record Pages run, web commit, Worker version, smoke evidence, rollback target, and Free-plan risks in the Phase 6C report.

## Hard Boundaries

- No Workers Paid or billing action.
- No production Worker/custom-domain deployment.
- No DNS, Nameserver, DNSSEC, Cargo, GoDaddy, or Cloudflare zone change.
- No Cloudflare Pages project yet.
- No repository visibility change.
- Do not touch or stage `docs/domain-migration/**` or unrelated concurrent `Role.md` changes.

## Acceptance

Phase 6C may close as `FREE_BETA_PASS` when the public GitHub Pages UI and Free Worker pass end-to-end smoke and rollback evidence. Paid production, Cloudflare Pages cutover, custom-domain activation, and repository privatization remain deferred until domain readiness and fresh user authorization.
