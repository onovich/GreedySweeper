# Phase 8A External Cutover Runbook

Status: **BLOCKED_PENDING_USER_ACTION**. This is a checklist, not authorization to perform the actions.

## Required user actions at round 8

1. Sign in to Cloudflare and authorize creation/connection of a Pages Free project for this repository.
2. If prompted, grant the Cloudflare GitHub App access only to `onovich/GreedySweeper`.
3. Confirm production branch `main`, build command `npm run build:cloudflare`, output directory `apps/web/dist`, and the non-secret `VITE_ONLINE_ENDPOINT=https://greedy-sweeper-room-preview.onovich1110.workers.dev` environment value.
4. Approve adding `greedysweeper.onovich.com` only after the domain-migration owner has supplied signed-off current DNS readiness.
5. Later, after Cloudflare HTTPS/public smoke/rollback observation succeeds, explicitly approve repository privatization and GitHub Pages disablement as separate actions.

## DNS, certificate, and rollback gates

- Record existing DNS record values and TTL before changing anything; do not alter Cargo apex, mail, DNSSEC, nameservers, or unrelated records.
- Do not accept the hostname until Cloudflare reports an active certificate and HTTPS returns the intended root-path artifact.
- Keep GitHub Pages enabled and testable throughout Cloudflare deployment, DNS propagation, and initial observation.
- Rollback before GitHub Pages disablement: remove or revert only the new hostname record, restore the previous record value, and use `https://blog.onovich.com/GreedySweeper/` as the public fallback. Do not delete Worker data or room state.
- After visibility becomes private, prove one new Cloudflare build from the private repository before disabling GitHub Pages.

## Evidence template

Record project name, commit SHA, branch, build/output settings, Pages deployment URL/id, DNS before/after, certificate state, HTTPS status, root-path asset result, Classic/Greed/reconnect smoke URLs, GitHub Pages observation, rollback rehearsal, and private-source rebuild. Never record tokens, room codes, seat tokens, seeds, salts, or personal data.
