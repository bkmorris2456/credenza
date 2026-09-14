# Completed

## 2026-09-13 — Persistent logout button

- `AppLayout.tsx` now renders a sticky top `AppBar` ("Credenza" + a logout icon button) above every authenticated page, alongside the existing bottom nav — so logging out no longer requires hunting for it on a specific page. Calls the existing `logOut()`; `AuthContext`'s listener already redirects to `LoginPage` automatically once signed out.
- Verified with `npm run lint` (clean) and `npm run build` (succeeds). Ad hoc request, not from TODO.md.

## 2026-09-13 — Guest sign-in

- `authService.ts`: added `signInAsGuest()` using Firebase's `signInAnonymously`.
- `LoginPage.tsx`: added a "Continue as Guest" button below the sign-in/register form, with a caption warning that guest data is tied to the current browser/device and can't be recovered elsewhere.
- No other code changes needed: `ensureHousehold`/`HouseholdContext` already work unmodified for an anonymous user (falls back to a generic display name since `displayName`/`email` are both null), and `firestore.rules`'s `isSignedIn()` already covers anonymous auth (`request.auth` is populated the same way).
- Also added a `View Join Code` action (key icon) to each row on the Households page, so a created household's code can be looked up again later instead of only being shown once at creation time (`getHousehold(id)` fetched on demand; "Personal" households correctly show "no shareable code" since they never get one).
- Verified with `npm run lint` (clean) and `npm run build` (succeeds).
- **Requires a manual, one-time Firebase Console step**: Authentication → Sign-in method → enable "Anonymous". This isn't deployable via the CLI/`firebase.json` — until it's enabled in the console, the guest button will fail with `auth/operation-not-allowed`.
- Also fixed a real bug found while debugging the Households feature live: the `members/{memberId}` create rule's owner self-assignment check used `get()` instead of `getAfter()`, so it couldn't see the household doc being created in the same batch/transaction — this broke both `createHousehold` and first-ever-login household bootstrapping. Deployed the fix.

## 2026-09-13 — B1, C2, C3. Household round-trip, Households page, nav wiring

- **B1**: `ensureHousehold` now returns `{ householdId, household }` instead of just the id, so `HouseholdContext` no longer makes a second, separate `getHousehold` round trip right after — one less sequential network hop on every login. For the rare case where a household/membership doc has to be freshly repaired inline, `createdAt`/`updatedAt` on the returned object are approximated with a client-side `Timestamp.now()` (nothing in the UI reads those fields, so the millisecond-scale imprecision is invisible).
- **C2/C3**: New `src/pages/HouseholdsPage.tsx` — lists the households you belong to (via `listUserHouseholds`) with a switcher (highlights the active one, "Switch" button on the rest), a "Create Household" dialog (name → shows the generated 8-digit join code afterward, with a copy button), and a "Join Household" dialog (8-digit code entry + a radio choice for whether to copy your current household's ingredients/recipes into the joined one). Wired into `BottomNav` and `App.tsx` routing as `/households`, next to Ingredients and Recipes.
- `HouseholdContext` gained a `switchHousehold(householdId)` method so create/join/switch actions on the new page update the app's active household in place (no reload needed) — this also means `getHousehold` and `switchActiveHousehold` (previously unused outside `householdService.ts` itself) are now exercised by real callers.
- Verified with `npm run lint` (clean) and `npm run build` (succeeds).
- **Caught and fixed during review**: my first pass of `handleJoin` called `joinHouseholdByCode` (which updates `activeHouseholdId` in Firestore) but never called the new `switchHousehold` to sync local React state — the app would have kept showing the old household's data until a manual reload. Fixed by capturing the returned household id and calling `switchHousehold` with it.
- **Still not deployed**: same as the C1 note below — `firestore.rules` needs `firebase deploy --only firestore:rules` before join-by-code will actually work against production; the app itself needs `npm run deploy` to reach your phone. Nothing has been tested in a browser yet.

## 2026-09-13 — C1. Household data model, Firestore rules & service layer

- `types/index.ts`: added `joinCode?: string` to `Household`, and a new `UserHouseholdMembership` type for `users/{userId}/households/{householdId}` index entries.
- `firestore.rules`: added a `users/{userId}/households/{householdId}` subcollection (self-read/write only) so a user can belong to and list more than one household; added a top-level `joinCodes/{code}` collection (`get`/`create` only, no `list`/update/delete) so a non-member can resolve a shared 8-digit code to a household id without being able to enumerate/scan other households. Tightened the `members/{memberId}` create rule so a self-added member can only set `role: 'owner'` if they're the household's actual creator (checked via `createdByUserId`) — otherwise self-join is forced to `role: 'member'`. This closes a privilege-escalation path that the new shareable join codes would otherwise open up (previously nobody but the auto-bootstrap flow had a reason to know another household's id).
- `householdService.ts`:
  - `ensureHousehold` now names the auto-created starter household `Personal` (was `${displayName}'s Kitchen`), and backfills a `users/{userId}/households/{id}` index entry for it (once, without re-touching `joinedAt` on repeat logins).
  - Added `createHousehold(userId, name, displayName, email)` — generates a unique 8-digit join code (checked against `joinCodes` with a short retry loop), and atomically writes the household doc, the owner's membership doc, the `joinCodes` lookup entry, and the user's household-index entry in one batch.
  - Added `joinHouseholdByCode(userId, code, displayName, email, currentHouseholdId, migrateExistingData)` — resolves the code via `joinCodes`, self-adds as a `member`, updates `activeHouseholdId`, and — if requested — copies (not moves) the user's ingredients and recipes from their current household into the newly joined one, chunked into batches of 450 to stay under Firestore's 500-write batch limit. Declining migration leaves the old household's data untouched.
  - Added `listUserHouseholds(userId)` and `switchActiveHousehold(userId, householdId)`.
- Verified with `npm run lint` (clean) and `npm run build` (succeeds).
- **Not yet deployed**: `firestore.rules` changes only take effect once deployed (`firebase deploy --only firestore:rules`) — flagging since that's a live change to production security rules and I want your go-ahead before pushing it. No UI exists yet to exercise any of this, either.

## 2026-09-13 — A. Local cache per device

- `src/services/firebase.ts`: switched `getFirestore(app)` to `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`, giving each device its own IndexedDB-backed Firestore cache that persists across sessions, with multi-tab support.
- Added `subscribeIngredients` (`ingredientService.ts`), `subscribeRecipes` (`recipeService.ts`), and `subscribeCategories`/`subscribeUnits` (`lookupService.ts`) — `onSnapshot`-based equivalents of the existing one-shot `getX` reads, so list data paints instantly from the local cache and then patches in live server updates.
- Swapped the one-shot list fetches in `IngredientSearchPage`, `RecipeSearchPage`, `RecipeDetailPage` (ingredient stock map), `RecipeFormPage` (ingredient picker), and `IngredientFormPage` (category/unit dropdowns) over to the new subscriptions, with proper `unsubscribe` cleanup on unmount. Single-document reads (`getRecipe`, `getIngredient`) were left as one-shot fetches since a live listener isn't needed for populating a form once.
- Cache size: left at the SDK default (no `cacheSizeBytes` override) — appropriate for a household-scale inventory.
- Verified no conflict with the existing `vite-plugin-pwa` Workbox service worker — that only precaches static app-shell assets; the Firestore persistent cache is a separate IndexedDB-backed data layer.
- Platform note: iOS Safari (and installed iOS PWAs) can be more aggressive about evicting IndexedDB storage under pressure — not a bug if a cache occasionally clears itself.
- Verified with `npm run lint` (clean) and `npm run build` (succeeds). Not yet manually tested in a browser/phone — see CATCHUP.md for what to check.
