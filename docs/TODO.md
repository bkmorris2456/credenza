# Today's TODO

1. Switch to Category to a select instead of a type, and if they want to add a category at that moment
	1. add button at the bottom of the selection to create a category and add it on the spot
	2. Same for the Unit too
    3. Fix the addition of new categories or units. Right now, they say failed to add
2. Clean up the structure of the item overview screen when confirming the addition of an ingredient
	1. Better pathing, like a button to return to the list overview
3. Filter System for each column for ingredients and recipes
4. Notification System for when items are about to expire
	1. Setting to determine the time in advance a notification appears
5. Add a new column called Added By that shows which user (short username) added the item
6. Recipe Functionality Overhaul
	1. Change it so that you have the option between choosing ingredients you added already, or just a general list of ingredients
	2. Add a section where you list the steps
		1. Markdown style?
		2. Make it so that you write the prep steps here, the step by step for cooking, etc.
	3. Add a Written By column for recipes, and filtering for this column as well
	4. Remove Description from viewing in the table row, replace with an ingredient check that simply tells you whether you have all of the ingredients or not
7. Ingredient Check Functionality
	1. When viewing a recipe, it should run a check on all recorded ingredients, and give a visual indicator on what ingredients are available or missing
		1. I'm thinking that we do an additional green or red badge next to each ingredient. Red stating missing, green stating available

## Next up

2. Build a real household management UI (invite members, switch households, edit roles) — right now every new user silently gets a solo starter household via `ensureHousehold`
3. Wire up `userLogs` / `recipeLogs` / `ingredientLogs` writes (schema exists in SPEC, nothing writes to them yet)
4. "Use this recipe" action to decrement ingredient quantities per the Design Decision that inventory updates happen immediately after a recipe is confirmed
5. Low-stock push notifications via Firebase Cloud Messaging (SDK is initialized in `firebase.ts` but unused)