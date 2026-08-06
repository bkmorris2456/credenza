# Today's TODO

## Next up

2. Build a real household management UI (invite members, switch households, edit roles) — right now every new user silently gets a solo starter household via `ensureHousehold`
3. Wire up `userLogs` / `recipeLogs` / `ingredientLogs` writes (schema exists in SPEC, nothing writes to them yet)
4. "Use this recipe" action to decrement ingredient quantities per the Design Decision that inventory updates happen immediately after a recipe is confirmed
5. Low-stock push notifications via Firebase Cloud Messaging (SDK is initialized in `firebase.ts` but unused)