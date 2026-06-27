import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Check if Gemini is configured
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

/**
 * PHASE 2: Generate Meal Plan
 * Fetches base meals from TheMealDB based on category and parses them with Gemini
  */
app.post("/api/mealplan/generate", async (req, res) => {
  try {
    const { budget, currency, mealTime, category, cuisine, usdBudget } = req.body;

    if (!budget || !currency || !mealTime || !category) {
      return res.status(400).json({ error: "Missing required preferences fields." });
    }

    // Pick a random category subset as fallback
    let themeCategories: string[] = [];
    if (category === "binge") {
      themeCategories = ["Pasta", "Dessert", "Beef", "Pork"];
    } else if (category === "healthy") {
      themeCategories = ["Vegetarian", "Vegan", "Seafood", "Chicken"];
    } else { // athlete
      themeCategories = ["Chicken", "Beef", "Seafood", "Lamb"];
    }
    const selectedCategory = themeCategories[Math.floor(Math.random() * themeCategories.length)];

    // 1. Fetch from Area (Cuisine) first if provided
    let dbMeals: any[] = [];
    if (cuisine && cuisine.trim().length > 0) {
      const formattedCuisine = cuisine.trim().charAt(0).toUpperCase() + cuisine.trim().slice(1).toLowerCase();
      try {
        const dbRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${formattedCuisine}`);
        const data = await dbRes.json();
        if (data && data.meals && data.meals.length > 0) {
          dbMeals = data.meals;
          console.log(`Successfully fetched ${dbMeals.length} meals for cuisine/area: ${formattedCuisine}`);
        }
      } catch (e) {
        console.error(`Failed to fetch for cuisine area: ${formattedCuisine}`, e);
      }
    }

    // 2. Fallback to category if no cuisine meals found
    if (dbMeals.length === 0) {
      try {
        const dbRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${selectedCategory}`);
        const data = await dbRes.json();
        if (data && data.meals) {
          dbMeals = data.meals;
        }
      } catch (e) {
        console.error("Failed to fetch from TheMealDB:", e);
      }
    }

    // If still empty, search for general fallback
    if (dbMeals.length === 0) {
      try {
        const dbRes = await fetch("https://www.themealdb.com/api/json/v1/1/search.php?s=chicken");
        const data = await dbRes.json();
        dbMeals = data?.meals || [];
      } catch (err) {
        console.error("Fallback search failed too:", err);
      }
    }

    // How many meals to generate?
    const mealsCount = mealTime === "fullday" ? 3 : 1;
    const selectedDbMeals: any[] = [];
    
    if (dbMeals.length > 0) {
      // Shuffle and pick
      const shuffled = [...dbMeals].sort(() => 0.5 - Math.random());
      for (let i = 0; i < Math.min(mealsCount, shuffled.length); i++) {
        selectedDbMeals.push(shuffled[i]);
      }
    }

    // Fetch full lookup data for each selected meal
    const fullMeals: any[] = [];
    for (const m of selectedDbMeals) {
      try {
        const lookupRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`);
        const lookupData = await lookupRes.json();
        if (lookupData && lookupData.meals && lookupData.meals[0]) {
          fullMeals.push(lookupData.meals[0]);
        }
      } catch (e) {
        console.error(`Failed lookup for meal ${m.idMeal}:`, e);
      }
    }

    // Fallback if lookup empty
    if (fullMeals.length === 0) {
      fullMeals.push({
        idMeal: "52772",
        strMeal: "Teriyaki Chicken Casserole",
        strMealThumb: "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg",
        strCategory: "Chicken",
        strArea: "Japanese",
        strInstructions: "Preheat oven to 350 degrees F. Soy sauce, brown sugar, ginger, garlic. Bake with chicken and rice.",
        strIngredient1: "soy sauce", strMeasure1: "3/4 cup",
        strIngredient2: "brown sugar", strMeasure2: "1/2 cup",
        strIngredient3: "garlic", strMeasure3: "2 cloves",
        strIngredient4: "chicken breast", strMeasure4: "1 lb",
        strIngredient5: "rice", strMeasure5: "2 cups",
      });
    }

    const ai = getGeminiClient();

    if (ai) {
      // Structure the prompt with real TheMealDB details
      const rawMealsInfo = fullMeals.map((m, idx) => {
        // Collect ingredients
        const ingredientsList: string[] = [];
        for (let j = 1; j <= 20; j++) {
          const ing = m[`strIngredient${j}`];
          const meas = m[`strMeasure${j}`];
          if (ing && ing.trim()) {
            ingredientsList.push(`${ing.trim()} (${meas ? meas.trim() : "to taste"})`);
          }
        }

        const mealTimeLabel = mealsCount === 3 
          ? (idx === 0 ? "Breakfast" : idx === 1 ? "Lunch" : "Dinner")
          : mealTime;

        return `
          Meal #${idx + 1}:
          Meal Time Assignment: ${mealTimeLabel}
          ID: ${m.idMeal}
          Name: ${m.strMeal}
          Thumbnail: ${m.strMealThumb}
          Category: ${m.strCategory || "General"}
          Area: ${m.strArea || "Global"}
          Instructions: ${m.strInstructions}
          Ingredients: ${ingredientsList.join(", ")}
        `;
      }).join("\n---\n");

      const limitInUSD = usdBudget || (budget / 83.5); // Fallback conversion

      const prompt = `
        You are an expert culinary AI nutritionist.
        Below are ${fullMeals.length} recipes fetched from a meal database.
        
        Your task is to:
        1. Calculate standard macronutrients (calories, protein in grams, carbs in grams, fats in grams) for each recipe.
        2. Assign realistic ingredient cost estimates strictly in USD ($) for each ingredient. Ensure the sums of estimated costs equal the "estimatedTotalCost" field.
        3. Check if the TOTAL cost for the meal(s) fits within the converted USD budget limit of "${limitInUSD.toFixed(2)} USD" (which corresponds to ${budget} INR).
        4. Provide a clear justification explanation for the budget check, referencing the converted USD limit and individual ingredient prices.
        5. Categorize each ingredient as either a core element ("isCore": true - such as chicken, steak, rice, fish, pasta, main vegetable) or minor garnish/spice/sauce ("isCore": false - such as salt, soy sauce, pepper, olive oil, garlic).
        
        User Preferences Context:
        - INR Budget: ${budget} INR (Approx ${limitInUSD.toFixed(2)} USD)
        - Selected Cuisine Preference: ${cuisine || "Any"}
        - Meal Category Requested: ${category} (binge, healthy, or athlete)
        - Meal Time: ${mealTime}

        Input Recipes Details:
        ${rawMealsInfo}

        Return the response strictly as a JSON object of the following format:
        {
          "meals": [
            {
              "id": "string (the input ID)",
              "name": "string (the input Name)",
              "thumbnail": "string (the input Thumbnail)",
              "instructions": ["Step 1 text", "Step 2 text", ... (split the raw instructions into short, logical sequence items)],
              "category": "string (the category name)",
              "area": "string",
              "macros": {
                "calories": number,
                "protein": number,
                "carbs": number,
                "fats": number
              },
              "ingredients": [
                {
                  "name": "string (clean ingredient name)",
                  "measure": "string (measure, e.g., 200g, 1 tbsp)",
                  "estimatedCost": number (realistic price in USD, e.g., 1.50),
                  "isCore": boolean (true for main proteins/carbs/base, false for spices/oils/sauces)
                }
              ],
              "estimatedTotalCost": number (sum of ingredient costs in USD),
              "budgetCheck": {
                "fitsBudget": boolean (whether estimatedTotalCost <= ${limitInUSD}),
                "justification": "string (friendly explanation of how this meal fits the budget limit, referencing ingredient prices in USD)"
              }
            }
          ]
        }
      `;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const textResult = response.text || "{}";
        const parsed = JSON.parse(textResult.trim());
        return res.json({ meals: parsed.meals, isMock: false });
      } catch (err) {
        console.error("Gemini processing error, falling back to rich mock data:", err);
      }
    }

    // --- FALLBACK MOCK AI GENERATOR ---
    const mockMeals = fullMeals.map((m, idx) => {
      const ingredients: any[] = [];
      let totalCostInUSD = 0;
      const mealCategory = m.strCategory || "General";

      for (let j = 1; j <= 20; j++) {
        const ing = m[`strIngredient${j}`];
        const meas = m[`strMeasure${j}`];
        if (ing && ing.trim()) {
          const isCore = /chicken|beef|pork|steak|fish|salmon|rice|pasta|tuna|turkey|cheese|lamb|shrimp|flour|bread|potato/i.test(ing);
          const costInUSD = isCore ? (Math.random() * 4 + 2) : (Math.random() * 0.8 + 0.2);
          const roundedCost = parseFloat(costInUSD.toFixed(2));
          totalCostInUSD += roundedCost;

          ingredients.push({
            name: ing.trim(),
            measure: meas ? meas.trim() : "to taste",
            estimatedCost: roundedCost, // in USD
            isCore
          });
        }
      }

      totalCostInUSD = parseFloat(totalCostInUSD.toFixed(2));

      let calories = 550;
      let protein = 25;
      let carbs = 60;
      let fats = 15;

      if (category === "athlete") {
        protein = Math.floor(Math.random() * 20 + 40);
        fats = Math.floor(Math.random() * 10 + 12);
        carbs = Math.floor(Math.random() * 30 + 50);
        calories = (protein * 4) + (carbs * 4) + (fats * 9);
      } else if (category === "healthy") {
        protein = Math.floor(Math.random() * 10 + 20);
        fats = Math.floor(Math.random() * 8 + 8);
        carbs = Math.floor(Math.random() * 20 + 40);
        calories = (protein * 4) + (carbs * 4) + (fats * 9);
      } else {
        protein = Math.floor(Math.random() * 15 + 20);
        fats = Math.floor(Math.random() * 20 + 25);
        carbs = Math.floor(Math.random() * 40 + 80);
        calories = (protein * 4) + (carbs * 4) + (fats * 9);
      }

      const limitInUSD = usdBudget || (budget / 83.5);
      const fitsBudget = totalCostInUSD <= limitInUSD;
      const budgetGap = Math.abs(limitInUSD - totalCostInUSD).toFixed(2);
      const justification = fitsBudget
        ? `This meal is within limits! The estimated cost is $${totalCostInUSD.toFixed(2)} USD, leaving a comfortable cushion of $${budgetGap} USD from your converted $${limitInUSD.toFixed(2)} USD limit (budget limit: ${budget} INR).`
        : `This meal costs about $${totalCostInUSD.toFixed(2)} USD, which slightly exceeds your converted limit of $${limitInUSD.toFixed(2)} USD. Try substituting high cost items to keep the total within budget.`;

      const rawInst = m.strInstructions || "Cook and mix well.";
      const instructions = rawInst
        .split(/(?:\r?\n)+|\.\s+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 5);

      return {
        id: m.idMeal || String(10000 + idx),
        name: m.strMeal,
        thumbnail: m.strMealThumb,
        instructions: instructions.length > 0 ? instructions : [rawInst],
        category: mealCategory,
        area: m.strArea || "Global",
        macros: { calories, protein, carbs, fats },
        ingredients,
        estimatedTotalCost: totalCostInUSD, // USD
        budgetCheck: { fitsBudget, justification }
      };
    });

    res.json({ meals: mockMeals, isMock: true });

  } catch (err: any) {
    console.error("Global generation route error:", err);
    res.status(500).json({ error: err.message || "Failed to generate meal plan" });
  }
});

/**
 * PHASE 4: Pantry Check & Substitution/Alternative suggestions
 * Accepts current meal details, the currency, and the checked state of ingredients
 */
app.post("/api/mealplan/substitutions", async (req, res) => {
  try {
    const { meal, pantryState, currency } = req.body;

    if (!meal || !pantryState) {
      return res.status(400).json({ error: "Missing meal or pantryState data." });
    }

    const ingredients: any[] = meal.ingredients || [];
    
    // Determine missing ingredients
    const missingIngredients = ingredients.filter(ing => !pantryState[ing.name]);

    if (missingIngredients.length === 0) {
      return res.json({
        isMinorMissingOnly: true,
        substitutions: [],
        message: "You have all the ingredients! Happy cooking!"
      });
    }

    // Check if any missing ingredient is a "core" ingredient
    const missingCoreIngredients = missingIngredients.filter(ing => ing.isCore);
    const hasCoreMissing = missingCoreIngredients.length > 0;

    const ai = getGeminiClient();

    if (ai) {
      const prompt = `
        You are a highly resourceful AI sous-chef.
        The user is preparing the meal: "${meal.name}" (${meal.category}, ${meal.area}).
        
        Total ingredients in recipe:
        ${ingredients.map(i => `- ${i.name} (Measure: ${i.measure}, Is Core Ingredient: ${i.isCore})`).join("\n")}

        The user has checked their pantry and is MISSING the following ingredients:
        ${missingIngredients.map(i => `- ${i.name} (Is Core: ${i.isCore})`).join("\n")}

        Analyze the situation:
        - Are there major core ingredients missing? (Core missing = ${hasCoreMissing})
        - If Core ingredients (like main meats, major grains, pasta bases, main seafood) are missing, we MUST alert them and suggest 2 alternative meals that can be cooked using their available pantry items (or items they already have plus very minor extras).
        - If only minor ingredients (sauces, spices, herbs, oils, small garnishes) are missing, generate clever substitutes (e.g. "Use white vinegar or lemon juice instead of rice wine vinegar").

        User's chosen currency: ${currency}

        Return the response strictly as a JSON object of this format:
        {
          "isMinorMissingOnly": ${!hasCoreMissing},
          "substitutions": [
            {
              "missingIngredient": "string (name of missing ingredient)",
              "suggestedSubstitute": "string (clever substitute suggestion)",
              "explanation": "string (brief culinary reasoning for this substitution)"
            }
          ],
          "majorAlert": ${hasCoreMissing ? `{
            "message": "You are missing core ingredients like ${missingCoreIngredients.map(i => i.name).join(", ")}. Here are 2 great alternative meals that match your ingredients!",
            "alternativeMeals": [
              {
                "name": "string (creative, delicious alternative food name that fits the category)",
                "thumbnail": "string (a search-friendly food placeholder image or standard url)",
                "description": "string (why this meal is perfect given their current pantry ingredients)",
                "matchingIngredientsCount": number (how many ingredients they already have for this)
              }
            ]
          }` : "null"}
        }
      `;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const textResult = response.text || "{}";
        const parsed = JSON.parse(textResult.trim());
        return res.json({ ...parsed, isMock: false });
      } catch (err) {
        console.error("Gemini substitutions error, using smart fallback:", err);
      }
    }

    // --- FALLBACK MOCK AI SUBSTITUTION LAYER ---
    const substitutions = missingIngredients.map(ing => {
      // Create some fun clever culinary substitution recommendations
      let substitute = "cooking oil/butter";
      let explanation = "Adjust seasoning to balance flavours.";

      const name = ing.name.toLowerCase();
      if (name.includes("garlic")) {
        substitute = "Garlic powder or shallots";
        explanation = "Provides a similar aromatic profile to fresh garlic cloves.";
      } else if (name.includes("onion")) {
        substitute = "Shallots, leeks, or onion powder";
        explanation = "Will deliver that savory, sweet base note.";
      } else if (name.includes("soy sauce")) {
        substitute = "Tamari, coconut aminos, or a pinch of salt with Worcestershire sauce";
        explanation = "Maintains the rich umami taste and dark coloring.";
      } else if (name.includes("ginger")) {
        substitute = "Ground ginger (1/4 tsp per tbsp) or galangal";
        explanation = "Gives a warm, spicy flavor, although slightly less zesty than fresh ginger.";
      } else if (name.includes("lemon") || name.includes("lime")) {
        substitute = "Apple cider vinegar or white wine vinegar";
        explanation = "Provides the necessary acidity to cut through fats.";
      } else if (name.includes("milk") || name.includes("cream")) {
        substitute = "Coconut milk, almond milk, or a dollop of yogurt";
        explanation = "Keeps the creaminess intact with a subtle flavor twist.";
      } else if (name.includes("sugar") || name.includes("honey")) {
        substitute = "Maple syrup, brown sugar, or agave nectar";
        explanation = "Mimics the sweetness and viscosity perfectly.";
      } else if (name.includes("butter")) {
        substitute = "Olive oil, coconut oil, or margarine";
        explanation = "Provides grease and moisture, though olive oil changes the flavor slightly.";
      } else if (ing.isCore) {
        substitute = `Alternative meat/protein or tofu`;
        explanation = `Since this is a core ingredient, a direct substitution might alter the main texture, but standard proteins can swap!`;
      }

      return {
        missingIngredient: ing.name,
        suggestedSubstitute: substitute,
        explanation
      };
    });

    let majorAlert = undefined;
    if (hasCoreMissing) {
      // Build 2 intelligent alternative recommendations
      const missingCoreNames = missingCoreIngredients.map(i => i.name).join(", ");
      
      let alt1Name = "Quick Garlic Herb Pasta";
      let alt1Desc = "Since you are missing core ingredients, this pasta utilizes basic dry pantry bases (spaghetti, olive oil, garlic, and standard spices) which you likely have on hand!";
      let alt2Name = "One-Pan Protein Scramble";
      let alt2Desc = "A nutritious scramble using eggs, onions, and any remaining vegetables. Fast, high protein, and extremely budget-friendly.";

      if (meal.category === "athlete") {
        alt1Name = "High-Protein Egg and Rice Bowl";
        alt1Desc = "A quick performance meal leveraging basic white rice and scrambled eggs, seasoned with whatever sauces/spices you have left.";
        alt2Name = "Pantry Tuna Salad Boat";
        alt2Desc = "Using canned tuna, mayo/oil, and onion. Rich in protein, zero-cook, and uses common staples.";
      } else if (meal.category === "healthy") {
        alt1Name = "Mediterranean Chickpea Salad";
        alt1Desc = "A light, raw bowl using canned chickpeas, diced onions, lemon juice, and olive oil. Healthy and no-cook.";
        alt2Name = "Stir-Fried Vegetable Medley";
        alt2Desc = "A healthy stir-fry using any vegetables you have, soy sauce, and a dash of garlic or onion.";
      }

      majorAlert = {
        message: `You are missing major core ingredients (${missingCoreNames}). We highly recommend checking out these 2 delicious alternative meals that better utilize your available pantry staples!`,
        alternativeMeals: [
          {
            name: alt1Name,
            thumbnail: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop",
            description: alt1Desc,
            matchingIngredientsCount: ingredients.length - missingIngredients.length
          },
          {
            name: alt2Name,
            thumbnail: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=600&auto=format&fit=crop",
            description: alt2Desc,
            matchingIngredientsCount: Math.max(1, ingredients.length - missingIngredients.length + 1)
          }
        ]
      };
    }

    res.json({
      isMinorMissingOnly: !hasCoreMissing,
      substitutions,
      majorAlert,
      isMock: true
    });

  } catch (err: any) {
    console.error("Global substitutions route error:", err);
    res.status(500).json({ error: err.message || "Failed to analyze ingredients." });
  }
});

// Configure Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
