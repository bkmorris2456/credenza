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
