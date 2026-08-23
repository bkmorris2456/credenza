# Catchup Log

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
