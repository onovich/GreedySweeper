# Phase 6C Production Readiness Package

Status: **NOT AUTHORIZED — no production operation has been performed.**

## Current Free Beta release

The authorized Free beta is live through the existing GitHub Pages site and existing `workers.dev` Worker. Pages release and independent external smoke evidence are recorded in `phase-6c-validation-report.md`. This does not authorize Workers Paid, a production custom domain, DNS changes, Cloudflare Pages migration, or repository privatization.

## Accepted Free beta exception

The user has authorized a public Free beta through the existing GitHub Pages site and existing `workers.dev` Worker. This does not authorize Workers Paid, a production custom domain, DNS changes, Cloudflare Pages migration, or repository privatization. The focused release and rollback requirements are defined in `phase-6c-free-beta-release-addendum.md`.

The repository remains public while GitHub Free Pages is active. Cloudflare Pages Free migration and repository privatization are deferred until the domain task signs off Cloudflare DNS readiness and the replacement deployment has passed acceptance.

## Proven before production

- The isolated Preview Worker is `greedy-sweeper-room-preview` at `workers.dev`; the current deployed version is recorded in the Phase 6C validation report.
- Local authority, hibernation, reconnect, lifecycle, security, and capacity commands are repeatable through `npm run online:resilience`, `npm run online:security`, and `npm run online:load`.
- `ONLINE_ENABLED=false` rejects only new room creation. Existing rooms retain finish, reconnect, abandonment, and cleanup paths.
- The Worker may be rolled back to the immediately previous compatible Worker version in the Cloudflare dashboard or Wrangler deployment history. Do not delete a version until the compatibility smoke has passed.

## Required authorization and external readiness

Before any production deployment, custom-domain change, DNS operation, or Paid-plan activation, obtain a fresh explicit user authorization that names all of the following:

1. Workers Paid activation and its approved spend/alert threshold.
2. Production Worker deployment, including the Worker-first / Pages-second ordering.
3. Custom domain and DNS activation.
4. The dedicated domain-migration task's signed-off readiness result.

No Phase 6C task may infer any of these permissions from Preview access.

## Controlled release sequence after authorization

1. Record current production Worker version, Pages commit, protocol version, migration tag, route configuration, and rollback target.
2. Deploy the compatible Worker/migration first; do not release Pages yet.
3. Smoke current and previous supported protocol clients, then verify the new Worker health, two-client WSS, reconnect, lifecycle, security, and `ONLINE_ENABLED=false` behavior.
4. Release Pages second and repeat the smoke against the approved HTTPS/custom-domain endpoint.
5. Check Workers logs/alerts only for the approved privacy-safe event vocabulary and check the agreed cost dashboard threshold.
6. On any consistency, isolation, recovery, hidden-state, or smoke failure: set `ONLINE_ENABLED=false` for new rooms, roll back Worker then Pages, preserve existing room cleanup, and open an incident record without room credentials or hidden state.

## Cost and privacy controls

- Preview never enables Paid, production routes, custom domains, DNS, or billing.
- Optional Turnstile is disabled until a production secret is configured; missing or invalid configured verification fails the protected create path closed.
- Production event logs must never contain room code, token/digest, seed/salt, hidden board values, coordinates, IP, User-Agent, fingerprint, or progression fact data.
- Capacity evidence is not a cost approval: the local 100-room target must be complemented by authorized production alert thresholds before release.
