# Frontend Reconstruction Glossary

This glossary defines the reconstruction and delivery language. Product-domain terms such as **Bonus Pot**, **Bank**, and **Authoritative Confirmation** remain canonical in [`../../CONTEXT.md`](../../CONTEXT.md).

## Language

**Visual Master**:
The approved bitmap used to judge composition, hierarchy, silhouette, color relationships, and visual character. It is evidence, not executable game state.
_Avoid_: Pixel-perfect specification, production asset, background image

**Visual Token**:
A named, centrally owned value for color, typography, spacing, radius, border, shadow, layer, or motion that components consume instead of repeating raw values.
_Avoid_: Magic value, one-off CSS number

**Reward Circuit**:
The restrained 2px amber route that visualizes confirmed settlement from the multiplier columns through the Bonus Pot to the player's score. It stays subdued at rest and is not decorative always-on lighting.
_Avoid_: Neon trim, progress bar, network path

**UI View Model**:
A stable, presentation-ready projection of local or online state supplied to visual components through props. It exposes display states and allowed intents without exposing Worker, Durable Object, protocol, or rule-engine internals.
_Avoid_: Domain state clone, server payload passthrough, component-owned rules

**Style Ownership**:
The boundary under which visual components and their token layer own DOM structure, CSS, layout, accessibility presentation, and visual states; controllers and adapters provide state and intents only.
_Avoid_: Controller styling, backend-driven layout

**Visual Fixture**:
A deterministic UI View Model instance that reproduces one named visual state without requiring timing, randomness, storage, or a live network.
_Avoid_: Mock screenshot, ad hoc test data

**Visual Exception**:
A reviewed, documented deviation from the approved tokens, component anatomy, responsive contract, or baseline. An exception names its owner, scope, reason, expiry or permanence, and required baseline impact.
_Avoid_: Quick fix, temporary inline style, harmless tweak

**Visual Baseline**:
An approved reference screenshot produced from a named Visual Fixture under a frozen browser, viewport, DPR, font, and motion configuration.
_Avoid_: Design image, arbitrary local screenshot

**Baseline Update**:
The reviewed replacement of one or more Visual Baselines after an intentional visual change. It is not the automatic acceptance of current output.
_Avoid_: Snapshot refresh, approve all diffs

**Presentation Effect**:
A versioned, adapter-produced UI event that names a confirmed visual transition such as Bank settlement without exposing a raw domain or protocol event. A Presentation Effect never authorizes a state change by itself.
_Avoid_: Domain event, WebSocket message, inferred animation

**Interaction Lock**:
A View Model state that prevents gameplay intents for one explicit reason such as AI turn, command pending, reconnect, replay, or terminal state while preserving readable context and keyboard focus behavior.
_Avoid_: Generic disabled screen, hidden error, optimistic wait

**Visual Owner**:
The frontend maintainer accountable for token, component, responsive, fixture, and baseline consistency. The Visual Owner cannot redefine game behavior or authoritative protocol state.
_Avoid_: Backend stylist, screenshot approver by default
