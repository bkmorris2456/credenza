import type { Timestamp } from 'firebase/firestore';

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  /** 'discontinued' removes the item from low-stock notifications */
  status: 'in_stock' | 'low' | 'out_of_stock' | 'discontinued';
  brand: string;
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
  created: Timestamp;
  ingredients: RecipeIngredient[];
  imageUrl?: string;
  /** Minutes */
  prepTime?: number;
  /** Minutes */
  cookTime?: number;
}

export type IngredientStatus = Ingredient['status'];
