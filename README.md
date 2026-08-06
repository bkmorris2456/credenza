# Credenza

Credenza is a small-scale, mobile-friendly Progressive Web App for managing a household's kitchen: what ingredients you have, how much of them, when they expire, and which recipes you can actually make with what's on hand. It's built for a single household (or a few) rather than as a multi-tenant SaaS product — the goal is to stop wasting money re-buying things you already own and to make it easier to plan meals around what's actually in the kitchen.

## Overview

Everything in Credenza revolves around two collections: **ingredients** (your inventory) and **recipes** (what you can cook with it). Ingredients and recipes are shared per household — every signed-in user belongs to a household, and all data (ingredients, recipes, categories, units) is scoped to that household so multiple family members see and edit the same inventory.

For the full original product spec, see [`docs/SPEC.md`](docs/SPEC.md). Architecture and design tradeoffs made along the way are logged in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Features

### Inventory management
- Add, edit, and view ingredients with name, brand, category, unit, quantity, status (`In Stock` / `Low` / `Out of Stock` / `Discontinued`), and an optional expiration date.
- Searchable, paginated inventory table with **per-column filters** (Brand, Category, Quantity range, Expiration window, Status, Added By), each rendered as a small filter popover on the column header, alongside a free-text search bar across name/brand/category.
- Categories and units are user-extensible household-scoped lookup lists (pick from existing options or add a new one inline) rather than hardcoded enums.
- Every ingredient records who added it (**Added By**, a short name captured at creation and never changed by later edits), shown on the table, the detail page, and filterable.
- `Discontinued` ingredients are excluded from low-stock notifications and counts, per the app's functional requirements.

### Notifications
- A low-stock/out-of-stock banner at the top of the inventory page, summarizing counts (excluding discontinued items).
- An expiration-warning banner showing counts of items already expired and items expiring within a configurable lead time.
- The lead time (`Household.expiryWarningDays`, default 3 days) is a per-household setting, editable from a gear icon next to the inventory heading — it's shared by every member of the household.

### Recipes
- Add, edit, and view recipes with name, description, image URL, servings, prep/cook time, ingredients, and step-by-step Markdown instructions.
- Each recipe ingredient can be sourced two ways: selected from the household's tracked inventory, or typed in freeform ("Custom") for a one-off ingredient that isn't part of your tracked stock.
- Steps are written and stored as Markdown (one entry per step, reorderable), with an Edit/Preview toggle in the form and rendered Markdown on the recipe detail page.
- **Ingredient availability check**: the recipe list sorts and badges recipes as "Ready" or "Missing" based on current stock (custom/untracked ingredients are skipped in this check), and the recipe detail page shows a per-ingredient green ("Available") / red ("Missing") / gray ("Not tracked") badge next to every line.
- The recipe list is searchable and filterable by Servings, Availability, and **Written By** (same short-name-at-creation pattern as ingredients' Added By), with Description dropped from the list view in favor of a combined Prep/Cook time column.

### Accounts & households
- Email/password authentication via Firebase Auth.
- Every new user is automatically provisioned a starter household on first sign-in (`{name}'s Kitchen`) — no manual setup required to start using the app. (Multi-member invite/role management is on the roadmap; today, household membership is bootstrapped automatically rather than through an invite flow.)
- Firestore security rules scope every document under `households/{householdId}/...` to that household's members.

### Reliability & UX details
- **In-progress form recovery**: filling out an add/edit form for an ingredient or recipe and accidentally refreshing the page won't lose your input — form state is drafted to `sessionStorage` as you type and restored automatically, then cleared once you save.
- Extensive `try/catch` + `console.error` logging around every Firestore read/write, surfaced to the user as friendly error messages rather than silent failures.
- Installable as a Progressive Web App (see [Installing on a phone](#installing-on-a-phone) below) — works offline-tolerant with a service worker and can be added to a phone's home screen like a native app.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite |
| Language | TypeScript |
| Routing | React Router |
| UI | Material UI (MUI) v9 |
| Markdown rendering | `react-markdown` |
| Backend | Firebase Auth + Cloud Firestore |
| Push notifications (initialized, not yet wired up) | Firebase Cloud Messaging |
| PWA | `vite-plugin-pwa` (auto-generated service worker, installable manifest) |

## Project structure

```
docs/                   Product spec, architecture decisions, TODO/backlog, session catchup log
src/
  assets/
  components/
    layout/              AppLayout, BottomNav
    ui/                  ItemRow, LowStockToast, ExpiryToast, SearchBar, SelectWithAdd,
                          ColumnFilterMenu, NotificationSettingsDialog
  contexts/
    AuthContext.tsx       Wraps Firebase Auth state
    HouseholdContext.tsx  Resolves/bootstraps the signed-in user's household
  pages/
    LoginPage.tsx
    IngredientSearchPage.tsx / IngredientDetailPage.tsx / IngredientFormPage.tsx
    RecipeSearchPage.tsx / RecipeDetailPage.tsx / RecipeFormPage.tsx
  services/                Firestore/Auth data-access layer (one file per collection/concern)
    authService.ts, firebase.ts, householdService.ts,
    ingredientService.ts, lookupService.ts, recipeService.ts, draftStorage.ts
  types/
    index.ts               Shared TypeScript types for every Firestore document shape
firestore.rules           Security rules (household-membership-gated access)
firebase.json / .firebaserc
```

## Getting started

### Prerequisites
- Node.js (v20+ recommended) and npm
- A [Firebase](https://console.firebase.google.com/) project with **Authentication** (Email/Password provider) and **Cloud Firestore** enabled

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Firebase
Copy `.env.example` to `.env` (or `.env.local`) and fill in your Firebase project's web app config, available from the Firebase console under Project Settings:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 3. Deploy Firestore security rules
```bash
firebase deploy --only firestore:rules
```
(Requires the [Firebase CLI](https://firebase.google.com/docs/cli) and `firebase use <your-project-id>` or a matching `.firebaserc`.)

### 4. Run the app
```bash
npm run dev
```
Sign up with an email/password on first launch — a starter household is created for you automatically.

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check (`tsc -b`) and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint over the project |

## Data model

Firestore documents are scoped under a household. Simplified shapes (see `src/types/index.ts` for the full source of truth):

```
users/{userId}                                 name, email, activeHouseholdId

households/{householdId}                       name, createdByUserId, expiryWarningDays
households/{householdId}/members/{userId}       role, displayName, email, joinedAt
households/{householdId}/categories/{name}      user-defined ingredient categories
households/{householdId}/units/{name}           user-defined measurement units

households/{householdId}/ingredients/{id}       name, brand, category, unit, quantity, status,
                                                 expirationDate, addedByUserId, addedByName

households/{householdId}/recipes/{id}           name, description, servings, prepTime, cookTime,
                                                 imageUrl, ingredients[], steps[] (Markdown),
                                                 writtenByUserId, writtenByName
```

## Security

`firestore.rules` gates every document under a household behind membership: a request must have a corresponding `households/{householdId}/members/{uid}` document to read or write that household's data. `users/{uid}` profile documents are only accessible to their own owner. See the "Firestore security rules keyed on household membership" entry in [`docs/DECISIONS.md`](docs/DECISIONS.md) for the one deliberate exception (self-adding as a member, which bootstraps new households).

## Installing on a phone

Credenza is a PWA, so no App Store is required:

1. Build and host it somewhere with HTTPS (e.g. `firebase deploy` once a Hosting target is configured, or any static host serving `npm run build`'s `dist/` output).
2. On an iPhone, open the site in **Safari**, tap the Share icon, and choose **Add to Home Screen**. On Android, Chrome will typically prompt to install automatically, or offer the same option from its menu.
3. The app launches full-screen from the home screen icon, using the manifest defined in `vite.config.ts`.

Native App Store distribution (via a wrapper like Capacitor) and iOS push notifications are bigger, separate efforts not currently set up — see the Roadmap below.

## Further reading

- [`docs/SPEC.md`](docs/SPEC.md) — original product spec: goals, user stories, functional/non-functional requirements
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — a running log of architecture and design decisions, with the reasoning behind each
- [`docs/TODO.md`](docs/TODO.md) — current backlog
