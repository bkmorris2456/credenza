# Catchup Log

## 2026-09-13 — Household round-trip, Households page, nav wiring (TODO Sections B & C finished)

Finished the rest of `docs/TODO.md`: the household network round-trip cut, and the Households page UI + nav wiring.

- `ensureHousehold` now returns household data directly, so `HouseholdContext` no longer does a second `getHousehold` call after every login.
- New `HouseholdsPage` (route `/households`, nav entry between Recipes and... well, after Recipes) — switch between households you're in, create a new one (get a shareable 8-digit code back), or join one by code with the choice to copy your current ingredients/recipes over or leave them in Personal.
- `HouseholdContext` gained `switchHousehold()` so the UI updates immediately after create/join/switch, no reload needed.
- While building this I caught a real bug in my own first draft: `handleJoin` wasn't syncing local context state after joining, which would've left the app showing stale household data post-join. Fixed before it shipped.
- `npm run lint` and `npm run build` both pass. **Nothing has been manually tested in a browser/phone yet.**
- **`firestore.rules` still isn't deployed** (needs `firebase deploy --only firestore:rules`) — join-by-code won't actually work end-to-end until that's pushed. Same for the app itself needing `npm run deploy` to reach your phone.
- `docs/TODO.md` is now empty — everything is in `docs/COMPLETED.md`.
- Next: you wanted to walk through what's been built together — worth deciding on deploying the rules + app for a real test pass, and covering the two open notes from earlier (missing PWA icons, and the SPEC's conflict-notification requirement which still isn't implemented).

## 2026-09-13 — Household data model & service layer (TODO Section C, item 1)

Translated `docs/SUGGESTIONS.md`'s "Household Implementations" notes into TODO Section C (3 items) and implemented the first: the data model, Firestore rules, and service functions needed for multi-household support (create/join-by-code/switch), with no UI yet.

- `Household` gained an optional `joinCode`; new `UserHouseholdMembership` type backs a `users/{userId}/households/{householdId}` index subcollection (a user can now belong to more than one household).
- `firestore.rules`: new `users/{userId}/households` subcollection rule, new `joinCodes/{code}` lookup collection (get/create only — deliberately not listable, so codes can't be scanned/enumerated), and a tightened `members` create rule so only a household's actual creator can self-assign `role: 'owner'` (closes a privilege-escalation gap that the new shareable join codes would otherwise open).
- `ensureHousehold`'s auto-created starter household is now named `Personal` (was `"<name>'s Kitchen"`), matching the spec's "Default is 'Personal'", and backfills the new household-index entry for existing accounts.
- New `householdService` functions: `createHousehold` (generates a unique 8-digit join code, atomic batch write), `joinHouseholdByCode` (resolves code → household, self-joins as `member`, optionally copies — not moves — the user's ingredients/recipes from their prior active household into the new one, batched to respect Firestore's 500-write limit), `listUserHouseholds`, `switchActiveHousehold`.
- Verified with `npm run lint` (clean) and `npm run build` (succeeds).
- **`firestore.rules` has NOT been deployed** — changes only take effect via `firebase deploy --only firestore:rules`, which I'm holding off on since it's a live change to production security rules. Flag when you want that pushed.
- Logged in `docs/COMPLETED.md`. `docs/TODO.md` Section C now has items 2 (Households page UI) and 3 (nav wiring) left.
- Next: build the Households page (create/join forms, switcher, migrate-data confirmation dialog), then wire it into `BottomNav`/routing.

## 2026-09-13 — Local cache per device (TODO Section A)

Implemented TODO Section A: give each device its own persistent Firestore cache and move list reads to live listeners so pages load fast on repeat visits.

- `firebase.ts` now calls `initializeFirestore` with `persistentLocalCache` (+ `persistentMultipleTabManager`) instead of plain `getFirestore` — each device keeps an IndexedDB-backed copy of Firestore data between sessions.
- Added `subscribeIngredients`/`subscribeRecipes`/`subscribeCategories`/`subscribeUnits` (`onSnapshot`-based) alongside the existing one-shot `getX` functions, and switched all list-consuming pages (`IngredientSearchPage`, `RecipeSearchPage`, `RecipeDetailPage`, `RecipeFormPage`, `IngredientFormPage`) to use them, with proper unsubscribe-on-unmount cleanup.
- Confirmed TODO Section B item 2 (parallelize independent fetches) was already done throughout the codebase via `Promise.all` — no changes needed there.
- Verified with `npm run lint` (clean) and `npm run build` (succeeds).
- **Not yet manually tested in a browser.** Per the testing policy, before I do that: what's worth checking is (1) ingredient/recipe tables still load and update correctly, (2) editing an ingredient/recipe from another tab/device reflects live in the search pages, (3) repeat page visits feel noticeably faster than before, (4) offline behavior — data should still display from cache with network off. Let me know if you want to test this yourself or have me drive it.
- Logged in `docs/COMPLETED.md`. `docs/TODO.md` now only has Section B (household round-trip + retrieval algorithm notes) left, with item 2 struck through as already satisfied.
- Next: Section B item 1 (collapse the `ensureHousehold` + `getHousehold` double round-trip), pending your go-ahead — then the Household functionality spec in `docs/SUGGESTIONS.md`.

## 2026-08-22 — Multi-select delete for ingredients and recipes

Implemented the TODO item: "select multiple ingredients/items or recipes, and have the ability to delete them."

- `src/services/ingredientService.ts` / `recipeService.ts`: added `deleteIngredients`/`deleteRecipes`, each taking an array of ids and committing a single Firestore `writeBatch` delete (one round trip instead of N).
- `src/components/ui/ItemRow.tsx`: gained optional `selectable`/`selected`/`onToggleSelect` props that render a leading checkbox cell; when `selectable` is set, clicking the row toggles selection instead of navigating to the detail page.
- `IngredientSearchPage` and `RecipeSearchPage`: added a "select mode" toggle (checklist icon next to the page title/settings icon). In select mode, a checkbox column appears (with a header checkbox that selects/deselects everything on the current page, indeterminate when partially selected), plus a small action bar showing the selection count and a Delete button. Selection persists across pagination via a `Set<string>` of ids.
- Deleting asks for confirmation first via an MUI `Dialog` ("Delete N ingredients/recipes? This action cannot be undone."). On confirm, it calls the batch delete, prunes the deleted rows out of local state, clears selection, and exits select mode. Errors surface through the existing page-level error `Typography`.
- `RecipeSearchPage`'s rows aren't a shared component (unlike ingredients' `ItemRow`), so the same checkbox/select-row logic was added inline to its `TableRow`.
- Verified with `npm run lint` (clean) and `npm run build` (succeeds). UI behavior itself has not been manually tested in a browser — flagging per the testing policy in CLAUDE.md.

`docs/TODO.md` is cleared — this was the only item in it.

## 2026-08-05 — Session memory for add/edit forms

Implemented TODO item 8: "Implementation of session memory" — refreshing mid-fill on the add/edit ingredient or recipe form no longer loses your input.

- New `src/services/draftStorage.ts`: thin `sessionStorage` wrapper (`loadDraft`/`saveDraft`/`clearDraft`), shared by both form pages.
- `IngredientFormPage` and `RecipeFormPage` each key their draft as `credenza:{ingredient|recipe}-draft:{id|'new'}`. The form state is written to the draft on every change (skipped while the edit-mode fetch is still in flight, so a saved draft can't get clobbered by the transient pre-fetch empty state), and the draft always wins over freshly-fetched Firestore data when restoring (it represents more recent unsaved work). The draft is cleared on successful save.
- Fields the user doesn't directly edit — `addedBy`/`writtenBy` (the original creator) — are intentionally left out of the draft and always recomputed from the fetch or the signed-in user, so a stale draft can never reassign creator credit.
- `sessionStorage` (not `localStorage`) was the deliberate choice — see `docs/DECISIONS.md`. It matches "don't lose progress on refresh" without needing to build stale-draft cleanup, since it clears itself when the tab closes.
- Verified with `npm run lint` (clean) and `npm run build` (succeeds).

This clears the "Today's TODO" list — everything in it is now done. `docs/TODO.md`'s "Next up" section still has un-scheduled items (household management UI, activity logs, "use this recipe" inventory decrement, FCM push notifications) for whenever you want to pull the next batch of work.
