# Phase 8A Hosting Contract

Status: Round 8 `pages.dev` deployment verified; custom domain, DNS,
repository visibility, GitHub Pages, billing, and Worker deployment remain
unchanged and gated.

## Build variants

| Target                     | Command                    | Base path         | Public endpoint               |
| -------------------------- | -------------------------- | ----------------- | ----------------------------- |
| GitHub Pages rollback      | `npm run build:github`     | `/GreedySweeper/` | existing public Worker origin |
| Cloudflare Pages candidate | `npm run build:cloudflare` | `/`               | existing public Worker origin |

`VITE_DEPLOY_BASE` is a build-only host-path input. `VITE_ONLINE_ENDPOINT` remains a public, non-secret endpoint input. Its absence leaves online rooms unavailable rather than guessing a host.

## Frozen targets and red gates

- Candidate canonical host: `greedysweeper.onovich.com`.
- Verified Cloudflare Pages Free origin: `https://greedysweeper.pages.dev`.
- Existing rollback host: `https://blog.onovich.com/GreedySweeper/` remains live until later acceptance.
- Existing Worker: `https://greedy-sweeper-room-preview.onovich1110.workers.dev` remains unchanged.
- Forbidden before the next action-time authorization: DNS or custom-domain change, GitHub Pages disablement, repository privacy, billing, Worker deployment, and `docs/domain-migration/**` modification.

## Artifact acceptance

`npm run cutover:artifact` validates a root-path artifact's root element, asset URLs, CSS/JS output, Lunar Console marker, and the approved public Worker endpoint. The same source commit must pass both build variants before any external action.
