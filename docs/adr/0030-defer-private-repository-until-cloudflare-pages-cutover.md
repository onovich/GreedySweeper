# ADR 0030: Defer Private Repository Until Cloudflare Pages Cutover

Date: 2026-07-18
Status: Accepted

## Context

Greedy Sweeper currently uses GitHub Free and GitHub Pages. GitHub Free requires the Pages source repository to remain public. The project wants to make the repository private later without adding a fixed hosting subscription, while preserving the public game and avoiding downtime during the ongoing `onovich.com` registrar and DNS work.

Cloudflare Pages Free can deploy a public static site from a private GitHub repository or from prebuilt assets. Browser-delivered JavaScript, CSS, and media remain public artifacts even when the source repository is private; sensitive authority and anti-cheat behavior therefore remains in the Worker.

## Decision

1. Keep the GitHub repository public and keep GitHub Pages as the web host during the Workers Free public beta.
2. Do not enable Workers Paid merely to launch the beta. Use the existing `workers.dev` Worker and Free limits, with `ONLINE_ENABLED=false` as the new-room kill switch.
3. Do not change repository visibility while GitHub Pages is the production web host.
4. After the domain-migration task signs off registrar and Cloudflare DNS readiness, create and validate a Cloudflare Pages Free deployment before changing web DNS.
5. Cut the public web domain over to Cloudflare Pages with a tested rollback path.
6. Make the GitHub repository private only after the Cloudflare Pages deployment, custom domain, build automation, and rollback window are verified.
7. Workers Paid remains a separate future decision based on real usage and cost evidence.

## Consequences

- The source repository remains public during the beta.
- The beta can launch without a fixed Workers hosting charge.
- GitHub Pages remains the rollback target until Cloudflare Pages cutover is accepted.
- Cloudflare Pages migration and repository privatization are coupled release steps after domain readiness, not Phase 6C beta prerequisites.
- Public frontend bundles are not treated as secrets; authoritative rules, credentials, hidden state, and abuse controls remain server-side.
