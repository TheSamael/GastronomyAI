export interface UserPreferences {
  budget: number;
  currency: string;
  mealTime: 'breakfast' | 'lunch' | 'dinner' | 'fullday';
  category: 'binge' | 'healthy' | 'athlete';
  cuisine: string;
}

export interface MacroNutrients {
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fats: number;    // grams
}

export interface Ingredient {
  name: string;
  measure: string;
  estimatedCost: number; // in chosen currency
  isCore: boolean;       // true if core protein/base, false if minor garnish/spice
}

export interface Meal {
  id: string;
  name: string;
  thumbnail: string;
  instructions: string[];
  category: string;
  area: string;
  macros: MacroNutrients;
  ingredients: Ingredient[];
  estimatedTotalCost: number;
  budgetCheck: {
    fitsBudget: boolean;
    justification: string;
  };
}

export interface PantryState {
  [ingredientName: string]: boolean; // true if already have
}

export interface SubstitutionResult {
  isMinorMissingOnly: boolean;
  substitutions: {
    missingIngredient: string;
    suggestedSubstitute: string;
    explanation: string;
  }[];
  majorAlert?: {
    message: string;
    alternativeMeals: {
      name: string;
      thumbnail: string;
      description: string;
      matchingIngredientsCount: number;
    }[];
  };
}
