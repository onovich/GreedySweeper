# Phase 8A External Cutover Runbook

Status: **ROUND 8 COMPLETE; HOLD BEFORE ROUND 9**. The Pages Free project and
first `pages.dev` deployment were completed manually by the user. This remains a
checklist, not authorization for later external actions.

## Completed user actions at round 8

1. The user connected Cloudflare Pages Free project `greedysweeper` to the GitHub repository.
2. The first production deployment became available at `https://greedysweeper.pages.dev`.
3. User screenshots and independent non-browser probes verified the root-path Lunar Console assets and online endpoint injection.

## Remaining gated user actions

1. Approve adding `greedysweeper.onovich.com` only after the domain-migration owner has supplied signed-off current DNS readiness.
2. Later, after custom-domain HTTPS/public smoke/rollback observation succeeds, explicitly approve repository privatization and GitHub Pages disablement as separate actions.

## DNS, certificate, and rollback gates

- Record existing DNS record values and TTL before changing anything; do not alter Cargo apex, mail, DNSSEC, nameservers, or unrelated records.
- Do not accept the hostname until Cloudflare reports an active certificate and HTTPS returns the intended root-path artifact.
- Keep GitHub Pages enabled and testable throughout Cloudflare deployment, DNS propagation, and initial observation.
- Rollback before GitHub Pages disablement: remove or revert only the new hostname record, restore the previous record value, and use `https://blog.onovich.com/GreedySweeper/` as the public fallback. Do not delete Worker data or room state.
- After visibility becomes private, prove one new Cloudflare build from the private repository before disabling GitHub Pages.

## Evidence template

Record project name, commit SHA, branch, build/output settings, Pages deployment URL/id, DNS before/after, certificate state, HTTPS status, root-path asset result, Classic/Greed/reconnect smoke URLs, GitHub Pages observation, rollback rehearsal, and private-source rebuild. Never record tokens, room codes, seat tokens, seeds, salts, or personal data.
