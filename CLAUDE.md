# Credenza, Kitchen Inventory App

Read docs/SPEC.md to understand project expectations, goals, and tech stack

### Folder Structure
- docs
    - DECISIONS.md
    - SPEC.md
    - SUGGESTIONS.md
    - TODO.md
- src
    - assets
    - components
        - layout
            - AppLayout.tsx
            - BottomNav.tsx
        - ui
            - ItemRow.tsx
            - LowStockToast.tsx
            - SearchBar.tsx
            - SelectWithAdd.tsx
    - contexts
        - AuthContext.tsx
        - HouseholdContext.tsx
    - pages
        - IngredientDetailPage.tsx
        - IngredientFormPage.tsx
        - IngredientSearchPage.tsx
        - LoginPage.tsx
        - RecipeDetailPage.tsx
        - RecipeFormPage.tsx
        - RecipeSearchPage.tsx
    - services
        - authService.ts
        - firebase.ts
        - householdService.ts
        - ingredientService.ts
        - lookupService.ts
        - recipeService.ts
    - types
        - index.ts
    - App.css
    - App.tsx
    - index.css
    - main.tsx
- firestore.rules
- .env
- .env.example
- .gitignore
- eslint.config.js
- index.html

### Coding Standards

- Always:
    - Use functional components
    - Keep solutions as concise as possible
    - Use proper try catch's and extensive logging in the event of running into a bug or error

### Build/test commands

- Start development server
    - npm run dev
- Build
    - Create production build
        - npm run build
- Preview
    - Preview the production build locally
        - npm run preview
- Lint
    - Run ESLint
        - npm run lint

### Design Decisions

- The app is using React + Vite, but is mobile-friendly
- Firestore is the database
- Inventory updates happen immediately after recipes are confirmed

### CATCHUP.md

If I write the phrase "catch me up", I want you to access docs/CATCHUP.md and recite a summary of what was worked on and developed during our last session. To add information into CATCHUP.md, I will say "we are starting" and then follow with my first question of our session.

### TODO.md

docs/TODO.md is your go-to on where to go to understand what features and fixes need to be developed next. Finish each task one at a time, and once it's finished, stop and report that the task is done, add any relevant summary data into docs/CATCHUP.md, and wait until I say to move forward onto the next task

### Regarding Testing

Before you ask for permissions on testing, tell me what you are testing, and I will decide whether I will test it myself or I will let you test it

### COMPLETED.md

Any completed items from TODO.md should be recorded here in COMPLETED, to have some record of what items have been assigned and accomplished