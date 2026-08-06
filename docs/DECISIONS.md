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

## Expiry notifications are an in-app toast, not FCM push
The "notification system for expiring items" TODO item is satisfied with an `ExpiryToast` banner (same pattern as the existing `LowStockToast`) shown on the Ingredient Search page, rather than Firebase Cloud Messaging push notifications. FCM push (SDK is initialized in `firebase.ts` but otherwise unused) is a separately-tracked "Next up" item — it needs a background service worker, VAPID key, and token registration, which is a bigger lift than an in-app banner and wasn't asked for by this TODO item specifically. The lead-time setting (`Household.expiryWarningDays`, default `DEFAULT_EXPIRY_WARNING_DAYS` = 3) is stored on the household doc so it's shared by all members, editable via a gear icon on the Ingredient Search page (`NotificationSettingsDialog`).

## Firestore security rules keyed on household membership
`firestore.rules` gates every document under `households/{householdId}/...` behind an `isMember()` check (does a `members/{uid}` doc exist under that household). `users/{uid}` docs are only readable/writable by their own owner. The one deliberate hole: `households/{householdId}/members/{memberId}` allows `create` when `request.auth.uid == memberId`, i.e. anyone signed in can add *themself* as a member of any household id they know — this is what lets `ensureHousehold` bootstrap a brand-new household without a chicken-and-egg problem (you can't be "a member" yet when you're creating the household). It also means household ids aren't a security boundary on their own; that's acceptable for now since there's no invite/join-by-id flow yet, but revisit before adding one.

## Recipe steps are Markdown, rendered with `react-markdown`
Each recipe step is a plain-text-with-Markdown string in `Recipe.steps: string[]`, edited as a textarea per step and rendered with `react-markdown` (no GFM plugin — bold/italic/links/inline lists cover the "prep steps, then step by step cooking" use case without a heavier dependency). The form has an Edit/Preview toggle over the whole steps list rather than a live per-field preview, to keep the editing UI simple.

## Recipe ingredients: existing (tracked) vs custom (freeform) entries
Each `RecipeIngredient` row in the form can be sourced from the household's tracked ingredients (a select, as before) or typed freeform ("Custom" toggle — name/quantity/unit typed directly). A custom row is saved with `ingredientId: ''`; there's no new field for this because empty-string-means-custom is already how the type is documented. `canMake()` (Ready/Missing check on the Recipe Search page) only evaluates rows with a non-empty `ingredientId`, since custom ingredients have no linked stock to check against — a recipe with only custom ingredients is always "Ready" as far as that check is concerned. Per-ingredient red/green badges (a finer-grained check) are a separate TODO item.

## "Written By" on recipes follows the same pattern as ingredients' "Added By"
`Recipe.writtenByUserId`/`writtenByName` are captured once at creation from the signed-in user (`shortDisplayName` helper in `authService.ts`, shared with ingredients) and preserved as-is through edits. Same `ColumnFilterMenu` checkbox-list filter pattern as the ingredients table's "Added By" column.

## In-progress add/edit forms are drafted to `sessionStorage`, not `localStorage`
`draftStorage.ts` persists `IngredientFormPage`/`RecipeFormPage` form state under a key like `credenza:ingredient-draft:{id|'new'}`, written on every change and cleared on successful save. `sessionStorage` was chosen over `localStorage` because the ask was specifically "don't lose my progress on an accidental refresh," not "remember drafts indefinitely across days/devices" — sessionStorage clears itself when the tab closes, so there's no stale-draft cleanup to build. A saved draft always wins over freshly-fetched data when both exist (the draft represents more recent unsaved local edits than whatever's in Firestore). Fields that aren't part of the visible form (`addedBy`/`writtenBy`, the original creator) are deliberately excluded from the draft and always recomputed from the fetch/current user, so a stale draft can never reassign creator credit.
