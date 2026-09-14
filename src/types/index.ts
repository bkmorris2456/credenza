import type { Timestamp } from 'firebase/firestore';

export interface Household {
  id: string;
  name: string;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Days before expiration an ingredient starts showing up in the expiry notification. Defaults to DEFAULT_EXPIRY_WARNING_DAYS when unset. */
  expiryWarningDays?: number;
  /** 8-digit code others use to join this household. Unset on auto-created solo "Personal" households, which aren't shareable. */
  joinCode?: string;
}

/** A user's own `users/{userId}/households/{householdId}` index entry — which households they belong to. */
export interface UserHouseholdMembership {
  id: string;
  name: string;
  joinedAt: Timestamp;
}

export const DEFAULT_EXPIRY_WARNING_DAYS = 3;

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
  addedByUserId: string;
  /** Short label (first name or email prefix) captured at creation time; never updated on edit. */
  addedByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RecipeIngredient {
  /** Empty for a custom, freeform ingredient with no link to tracked inventory. */
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
  /** Ordered list of step instructions, each rendered as Markdown. */
  steps: string[];
  writtenByUserId: string;
  /** Short label (first name or email prefix) captured at creation time; never updated on edit. */
  writtenByName: string;
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
