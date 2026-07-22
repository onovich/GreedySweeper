# Frontend Delivery Workflow

Status: accepted implementation workflow. This document authorizes no implementation by itself; the architect must advance the project after the planning CheckAndGoal gate.

## Roles

| Role                      | Responsibility                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| Visual Owner / frontend   | tokens, shared components, responsive behavior, accessibility presentation, fixtures, visual baselines |
| application adapter owner | local/online controller-to-View-Model mapping and Presentation Effects                                 |
| game-core / online owner  | rules, protocol, Worker/Durable Object authority, persistence, verified outcomes                       |
| architect                 | dependency boundary, Visual Exception, baseline governance, production cutover acceptance              |

One person may fill more than one role, but a baseline-changing author cannot be the only approver.

## Non-negotiable order

The sequence is fixture-first and controller-last:

| Slice | Deliverable                                                                                | Exit gate                                                             |
| ----- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| A     | Freeze evidence, precedence, reference environment, and glossary                           | Source-of-truth and ADRs accepted                                     |
| B     | Implement tokens, local fonts, primitive surfaces, and component contracts                 | Token audit, font readiness, contrast/focus checks                    |
| C     | Build static AppShell and primary desktop composition from deterministic fixtures          | `desktop-1920` and `desktop-1440` reference fixtures accepted         |
| D     | Complete component state matrix and responsive reflow using fixtures only                  | All wide/medium/compact states and 44px touch behavior accepted       |
| E     | Establish screenshot harness, fixture catalog, geometry assertions, and approved baselines | Chromium matrix plus Firefox/WebKit key states green                  |
| F     | Add the local presentation adapter and connect the existing local controller               | Local behavior parity, replay, AI, Greed, storage-degrade tests green |
| G     | Add the online presentation adapter and reuse the same shared components                   | Pending/reject/reconnect/pause/terminal authority tests green         |
| H     | Run the complete matrix and replace the production composition in one cutover              | Architecture, functional, accessibility, and visual approval complete |

No real controller is connected in slices B–E. No production UI is replaced before H.

## Slice rules

Each slice is the smallest coherent vertical change that can be reviewed without hidden follow-up work:

1. name the contract clauses and fixtures in scope;
2. change only the owning visual/application paths;
3. add or update deterministic fixtures before component branches;
4. add focused component/adapter tests with the change;
5. run the relevant architecture, accessibility, functional, and screenshot gates;
6. compare the result to written contracts first and `V-01` second;
7. record approved exceptions before updating baselines;
8. commit the slice independently with a concise conventional message.

Do not combine token redesign, backend functionality, adapter mapping, responsive rewrite, and baseline replacement in one commit.

## Self-check for every implementation slice

### Architecture

- Visual components import only UI contracts, other visual components, icons, and styles.
- Local and online controllers remain separate.
- Rules, scoring, turns, Bank legality, mine counts, and hidden information are not recomputed in UI code.
- Worker, Durable Object, protocol, storage, and transport concerns do not enter DOM/CSS files.
- Shared states use the shared component; no online/local or desktop/mobile copy is introduced.
- No inline style, arbitrary-value utility, raw palette value, or unreviewed dependency is added.

### Visual and accessibility

- Required fixtures cover normal, empty, waiting, pending, error, reconnect, and terminal consequences.
- Board remains the primary region at every band.
- Focus order and DOM order agree; focus rings are visible and not clipped.
- Text contrast, color-independent state cues, reduced motion, 200% zoom, and 44px targets pass.
- Screenshot and geometry diffs are reviewed, not blindly refreshed.

### Functional integration

- Local engine results or authoritative online snapshots own every displayed value.
- Online intents do not optimistically mutate board, score, POT, multiplier, or turn.
- A confirmed Bank produces one Presentation Effect; reject/retry/reconnect cannot duplicate it.
- Replay, storage failure, room setup, seat replacement, abandonment, and verification failure retain existing semantics.
- Existing architecture/security/online authority gates are not weakened.

## Functional change intake

When backend or product behavior changes:

1. the owning layer changes and tests its contract first;
2. the application controller exposes stable state/status, not styling;
3. the adapter extends UI View Model v1 or proposes a version bump;
4. fixtures demonstrate every new visible state independently of a live backend;
5. existing components consume the new state when possible;
6. a component/token/layout change requires visual review, never an incidental backend edit;
7. baselines change only through the separate approval workflow.

“Make the UI fit the payload” is not a reason to alter component anatomy. The adapter normalizes payloads into the presentation contract.

## Visual Exception workflow

A request lives beside the frontend reconstruction docs or in the implementing PR/commit record and includes:

```text
ID: VE-YYYY-NNN
Requester / owner:
Contract clause or token:
Affected components and viewports:
Reason and user impact:
Alternatives considered:
Temporary or permanent:
Expiry/removal condition, if temporary:
Fixture and baseline impact:
Required reviewers:
```

The Visual Owner reviews local consistency. The architect must approve any exception that changes source precedence, a shared token, responsive behavior, cross-component anatomy, masking, or baseline policy. A backend owner also reviews changes that touch View Model semantics. Emergency fixes still receive an exception ID before baseline replacement; “temporary” inline styles are not allowed.

## Baseline ownership and regression responsibility

- The implementation author reproduces and classifies a failure.
- The Visual Owner decides whether it violates the written visual contract.
- The adapter/backend owner decides whether displayed semantics are wrong.
- The architect approves intentional contract/baseline exceptions.
- Environment drift is owned by the visual-test harness maintainer and is never solved by accepting all screenshots.

Baseline updates should be isolated from unrelated functional changes whenever practical, and their commit message must name the intended visual change.

## Commit and validation gate

During implementation, run the repository workflow plus the slice-specific checks. At minimum:

- formatting and lint;
- focused component/adapter tests, then the full required repository suite before functional commit;
- workspace and architecture checks;
- production build;
- applicable visual matrix and accessibility checks;
- `git diff --check`;
- explicit staged-path review.

Stage selected paths only. Concurrent work, generated diff output, temporary image evidence, credentials, and unrelated docs are excluded.

The current documentation-only planning repair uses only documentation formatting/link validation and `git diff --check`, as explicitly routed by the architect; it does not run implementation tests.

## Cutover and rollback

- Keep the current production composition intact while slices B–G are exercised through deterministic fixture/test harnesses and scoped integration entry points.
- Do not maintain two permanent UI implementations or duplicate visual components.
- Make production replacement a dedicated slice-H composition-switch commit after every gate passes.
- If cutover fails, revert that composition-switch commit. Adapter, token, fixture, and component commits remain reviewable and reusable without changing game-core/protocol state.
- If an earlier slice regresses, revert the smallest slice commit and its directly coupled baselines; never reset or discard unrelated work.
- The visual reconstruction does not require a data migration, protocol rollback, Worker rollback, or authoritative state rewrite.

## Definition of implementation-ready

Planning is ready to enter slice B only when:

- every document in the reconstruction index is accepted;
- evidence precedence and integration ADRs are accepted;
- all required states have deterministic fixture definitions;
- responsive and visual-regression matrices are frozen;
- residual risks have named owners and validation points;
- the architect's CheckAndGoal returns pass.
