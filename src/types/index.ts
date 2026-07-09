import type { Timestamp } from 'firebase/firestore';

export interface Household {
  id: string;
  name: string;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type HouseholdRole = 'owner' | 'admin' | 'member';

export interface HouseholdMember {
  /** Document id matches the member's auth uid. */
  id: string;
  role: HouseholdRole;
  joinedAt: Timestamp;
  displayName: string;
  email: string;
}

export interface UserProfile {
  /** Document id matches the auth uid. */
  id: string;
  name: string;
  email: string;
  activeHouseholdId: string | null;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  /** 'discontinued' removes the item from low-stock notifications */
  status: 'in_stock' | 'low' | 'out_of_stock' | 'discontinued';
  brand: string;
  /** Null when no expiration date has been set. */
  expirationDate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RecipeIngredient {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  createdAt: Timestamp;
  ingredients: RecipeIngredient[];
  imageUrl?: string;
  /** Minutes */
  prepTime?: number;
  /** Minutes */
  cookTime?: number;
}

export type IngredientStatus = Ingredient['status'];

/** Household-scoped, user-defined ingredient categories. Doc id === name. */
export interface Category {
  id: string;
  name: string;
}

/** Household-scoped, user-defined measurement units. Doc id === name. */
export interface Unit {
  id: string;
  name: string;
}
