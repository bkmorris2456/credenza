# Credenza, Kitchen Inventory Management App

## Executive Summary

Credenza is a small-scale PWA which will be responsible for managing the inventory and items within my household's kitchen. It will track expiration dates, quantities remaining, and allow for sorting / filtering of specific items when needed. It will also allow for the capability to add recipes within it, so that it can scan all of the remaining ingredients, and produce a list of recipes that can be made based on what is in the kitchen

## Goals

- Prevents additional money from being spent due to being unsure of whether or not we have items
- Allow for maximum usage and increased efficiency in utilizing all groceries and ingredients
- Allows for better planning regarding meals throughout the week

## Target Users

- Immediate Family
- Myself

## Core Features

- Home / Landing Page
    - Notification toast at the top to indicate how many ingredients are low / ran out
    - Search Bar below the notification area, allowing users to search for specific items/ingredients to view item details
    - Item list below the search bar, showing a general collection of ingredients
        - Add table-like settings such as pagination, filtering, sorting, etc. to see different items
        - Each item is a clickable row that takes you to a template Details Screen
    - Ability to add/edit ingredients and kitchen items
- Template Detail Screen
    - Should be a simplistic screen showing relevant details regarding the specific item
        - Picture
        - Brand
        - Quantity currently owned
        - Which logged recipes are included in
- Recipe Screen
    - Same structure as the Home / Landing Page, but it should instead display and allow the searching of recipes instead
        - Should start with which recipes are available to be created first, depending on available ingredients
        - Recipes not possible to create with available ingredients should highlight what ingredients/quantities are missing
        Clicking on a recipe row should redirect to a Recipe Details Screen
    - Ability to add/edit recipes
- Recipe Details Screen
    - Should show a picture of the final result
    - Complete list of what ingredients are needed for the recipe
    - Display of time required and serving size

## User Stories

As a user,
I want to be able to see what ingredients I currently have, and what recipes I can make with them. I also want to be able to use this as a reliable way to rely on home cooking, instead of ordering out or wasting money buying more ingredients.

## Functional Requirements

1. Users can add unlimited ingredients or recipes
2. Ingredients should only be marked low or out of stock if the user added them into the app in the first place
3. Users should have the option to discontinue an ingredient or recipe, making it so that it does not become a notification when the ingredient or item is low stock
4. Ingredients can be applicable to multiple recipes
5. Search should update the viewable results in real-time
6. Users should be able to dictate measurement units when adding items and ingredients

## Non-Functional Requirements

- Performance
    1. App should move quickly and responsively
    2. Search results should update in real time
- Security
    1. Relatively lightweight
    2. Protect against data corruption or faulty input being added into the app
- Accessibility
    1. Mobile friendly
    2. Responsive
    3. Sufficient and easy to read color theme and design

## Tech Stack:

### Frontend
1. React + Vite
2. TypeScript
3. React Router
4. MUI
5. Vite PWA Plugin

### Backend / Database
1. Firebase Auth
2. Cloud Firestore
3. Firebase Cloud Messaging for push notifications

## Database Design (initial design, could be subject to change depending on what the product looks like as we progress)
### Sidenote: This is written under the knowledge of how MySQL works, please translate this accordingly to how Firestore would work
users/{userId}
  name
  email
  activeHouseholdId

households/{householdId}
  name
  createdByUserId
  createdAt
  updatedAt

households/{householdId}/members/{userId}
  role: "owner" | "admin" | "member"
  joinedAt
  displayName
  email

households/{householdId}/ingredients/{ingredientId}
  name
  category
  unit
  quantity
  status
  brand
  createdAt
  updatedAt

households/{householdId}/categories/{categoryName}
  name
  createdAt

households/{householdId}/units/{unitName}
  name
  createdAt

households/{householdId}/recipes/{recipeId}
  name
  description
  servings
  createdAt
  ingredients: [
    {
      ingredientId,
      name,
      quantity,
      unit
    }
  ]

households/{householdId}/userLogs/{userLogId}
  userId
  type
  message
  createdAt

households/{householdId}/recipeLogs/{recipeLogId}
  recipeId
  userId
  createdAt

households/{householdId}/ingredientLogs/{ingredientLogId}
  ingredientId
  userId
  createdAt

## UI / UX & Navigation Flow

- Landing Page (Ingredient Search Screen)
    - Option to click any of the displayed ingredient rows -> Ingredient Detail Screen
    - Bottom navigation to go to Recipe Search Screen, or to add an ingredient
- Ingredient Detail Screen
    - Option to edit ingredient details
    - back button/arrow to return to search screen
- Recipe Detail Screen
    - Option to edit recipe steps, details, etc.
    - back button/arrow to return to search screen
- Recipe Search Screen
    - Same functionality / flow as Landing Page

## Permissions

There is no user/admin exclusive privileges, access to add/edit ingredients or recipes will be the same

## Error Handling

- If add/edit fails:
    - Display a pop-up notification or toast stating the add/edit failed, and to try again
    - Have extensive checks on the information being passed in, so if we can narrow down on what caused the failure, we can display a user-friendly message explaining the issue, so that the input can be fixed by the user in real-time
- If offline
    - Queue any additions/edits/deletions
    - If it conflicts with changes made by other users, display a notification stating as such, and display the list of changes that differ

## Future Features

- Calorie/macro Tracking and calculating for ingredients and recipes
- AI Service Bot to recommend recipes based on what was already made earlier in the past, to help switch up what's being made/eaten
- Extending it to handle multiple "kitchen" collections
    - If users want to separate kitchens based off of "baking" and "dinner"

## Success Criteria

- Can successfully add/edit/delete recipes or ingredients
- Recipes can successfully reduce quantities on used ingredients when the recipe is selected as "using for today"
- Notifications work to inform the user when an item is running low or ran out
- Can successfully access the app away from home, and be able to make and submit changes from wherever they are

## Architecture Decisions

Record important choices made pertaining to the project's structure, flow and functionality, and write them down in docs/DECISIONS.md

## Coding Standards

Follow programming best practices, concise commenting to explain core functionalities and features. I require extensive but efficient testing of features, and proper and extensive error logging to identify any problems that may arise

## Project Constraints

- Keep the PWA as lightweight as possible
- Go for the most efficient solution possible
- Keep the project structure very organized and easy to understand