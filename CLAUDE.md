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
    - pages
        - IngredientDetailPage.tsx
        - IngredientSearchPage.tsx
        - RecipeDetailPage.tsx
        - RecipeSearchPage.tsx
    - services
        - authService.ts
        - firebase.ts
        - IngredientService.ts
        - recipeService.ts
    - types
        - index.ts
    - App.css
    - App.tsx
    - index.css
    - main.tsx
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

For immediate tasks to work on, see docs/TODO.md