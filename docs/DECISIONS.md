# Architecture Decisions

## MUI v9 — sx prop required for all system props
MUI v9 removed shorthand system props (e.g. `<Box display="flex">`) from component types. All layout/spacing/typography values must be passed via the `sx` prop (e.g. `<Box sx={{ display: 'flex' }}`).

## Firebase config via environment variables
Firebase credentials are kept out of source control using `VITE_FIREBASE_*` env vars. Copy `.env.example` to `.env.local` and fill in values from the Firebase console before starting development.

## Ingredient "discontinued" status skips low-stock notifications
Per the spec (FR #3), items a user no longer tracks should not appear in the low-stock toast. The `discontinued` status is the mechanism for this — all notification counts exclude discontinued items.

## Recipe availability sort order
On the Recipe Search page, recipes the user *can* make with current stock appear before recipes they cannot. This surfaces actionable recipes first without hiding the full list.

## Vite PWA plugin — generateSW mode
Using `generateSW` (the default) so the service worker is auto-generated from the manifest. No hand-maintained SW file required at this stage.

## Household-scoped Firestore schema
Ingredients and recipes live under `households/{householdId}/...` rather than flat top-level collections, so multiple family members can share one inventory (per SPEC's household/members design). Every `ingredientService`/`recipeService` function now takes `householdId` as its first argument.

## Auto-provisioned starter household
There's no invite/onboarding flow yet. On first sign-in, `householdService.ensureHousehold` creates a `users/{uid}` profile and a starter household (naming it "`{displayName}`'s Kitchen"), and stores it as the user's `activeHouseholdId`. Returning users just reuse that id. This unblocks household-scoped data access without building full multi-user household management yet.

## Minimal auth gate ahead of household resolution
`AuthContext` wraps `authService.onAuthChange`; `HouseholdContext` (nested inside it) resolves the active household once a user is signed in. `App.tsx` shows `LoginPage` for signed-out users, a spinner while auth/household resolve, and the routed app once both are ready. `LoginPage` is intentionally bare (email/password + sign-in/register toggle) — just enough to exercise the household-scoped data layer.

## User-defined category/unit lookups, name as doc id
Ingredient `category` and `unit` are now chosen from a household-scoped select (`households/{householdId}/categories`, `.../units`) instead of freeform text, with an inline "Add new" option (`SelectWithAdd` component) so users can grow the list without leaving the form. Each lookup doc's id is its (trimmed) name — `setDoc(..., { merge: true })` on add — so re-adding an existing name is a harmless no-op instead of a duplicate. `Ingredient.category`/`.unit` remain plain strings (not foreign keys) to avoid a join just to render a row; the lookup collections only exist to drive the dropdown's options. Forms merge in the ingredient's current value if it predates the lookup collection, so old freeform data still displays correctly.

## Firestore security rules keyed on household membership
`firestore.rules` gates every document under `households/{householdId}/...` behind an `isMember()` check (does a `members/{uid}` doc exist under that household). `users/{uid}` docs are only readable/writable by their own owner. The one deliberate hole: `households/{householdId}/members/{memberId}` allows `create` when `request.auth.uid == memberId`, i.e. anyone signed in can add *themself* as a member of any household id they know — this is what lets `ensureHousehold` bootstrap a brand-new household without a chicken-and-egg problem (you can't be "a member" yet when you're creating the household). It also means household ids aren't a security boundary on their own; that's acceptable for now since there's no invite/join-by-id flow yet, but revisit before adding one.
