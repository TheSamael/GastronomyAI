import React, { useState } from "react";
import { motion } from "motion/react";
import { UserPreferences } from "../types";
import { Coins, Flame, Dumbbell, Heart, ArrowRight, Sparkles, ChefHat, Globe } from "lucide-react";

interface OnboardingFormProps {
  onSubmit: (prefs: UserPreferences) => void;
  initialPreferences?: UserPreferences;
}

const PRESET_CUISINES = [
  { name: "Indian", icon: "🍛" },
  { name: "Italian", icon: "🍝" },
  { name: "Mexican", icon: "🌮" },
  { name: "Chinese", icon: "🥢" },
  { name: "Japanese", icon: "🍣" },
  { name: "American", icon: "🍔" },
  { name: "Thai", icon: "🍜" },
  { name: "Mediterranean", icon: "🥗" },
  { name: "Custom", icon: "🍽️" }
];

export default function OnboardingForm({ onSubmit, initialPreferences }: OnboardingFormProps) {
  const [budget, setBudget] = useState<number>(initialPreferences?.budget || 500);
  const [currency] = useState<string>("INR");
  const [mealTime, setMealTime] = useState<'breakfast' | 'lunch' | 'dinner' | 'fullday'>(
    initialPreferences?.mealTime || "lunch"
  );
  const [category, setCategory] = useState<'binge' | 'healthy' | 'athlete'>(
    initialPreferences?.category || "healthy"
  );
  
  // Initialize cuisine with a default or matching preset, fallback to Custom if not in list
  const initialCuisine = initialPreferences?.cuisine || "Indian";
  const isPreset = PRESET_CUISINES.some(c => c.name.toLowerCase() === initialCuisine.toLowerCase());
  const [cuisine, setCuisine] = useState<string>(isPreset ? initialCuisine : "Custom");
  const [customCuisine, setCustomCuisine] = useState<string>(isPreset ? "" : initialCuisine);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (budget <= 0) return;
    const selectedCuisine = cuisine === "Custom" ? (customCuisine.trim() || "Indian") : cuisine;
    onSubmit({ budget, currency, mealTime, category, cuisine: selectedCuisine });
  };

  return (
    <form id="onboarding-form" onSubmit={handleSubmit} className="space-y-12">
      {/* 1. BUDGET IN INR SETUP */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#0B0F19]/60 border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 rounded-2xl shadow-sm dark:shadow-none"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-lg text-slate-900 dark:text-slate-100">
              1. Define Your Meal Budget (INR ₹)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              We'll find and structure recipes to stay within this limit.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Currency
            </label>
            <div className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 font-sans font-medium">
              INR (₹) - Indian Rupee
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Budget Limit (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-700 dark:text-slate-300 font-bold">
                ₹
              </span>
              <input
                id="budget-input"
                type="number"
                min="10"
                step="10"
                required
                value={budget}
                onChange={(e) => setBudget(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-semibold"
                placeholder="Enter budget in ₹"
              />
            </div>
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[250, 500, 1000, 2000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBudget(preset)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    budget === preset
                      ? "bg-fuchsia-500 text-white border-fuchsia-500 shadow-sm"
                      : "border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-fuchsia-500/50 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. CUISINE SELECTION (NEW FEATURE) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-[#0B0F19]/60 border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 rounded-2xl shadow-sm dark:shadow-none"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-lg text-slate-900 dark:text-slate-100">
              2. Select Preferred Cuisine
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              The AI chef will shortlist meals belonging to this culture.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
          {PRESET_CUISINES.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCuisine(c.name)}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                cuisine === c.name
                  ? "border-fuchsia-500 bg-fuchsia-50/20 dark:bg-fuchsia-950/10 text-fuchsia-700 dark:text-fuchsia-300 ring-2 ring-fuchsia-500/20"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <span className="text-xl">{c.icon}</span>
              <span className="text-xs font-semibold">{c.name}</span>
            </button>
          ))}
        </div>

        {cuisine === "Custom" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="pt-2"
          >
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Type Custom Cuisine
            </label>
            <input
              type="text"
              value={customCuisine}
              onChange={(e) => setCustomCuisine(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-medium"
              placeholder="e.g. Spanish, Korean, Turkish, Greek..."
              required={cuisine === "Custom"}
            />
          </motion.div>
        )}
      </motion.div>

      {/* 3. MEAL TIME SELECT */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#0B0F19]/60 border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 rounded-2xl shadow-sm dark:shadow-none"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-lg text-slate-900 dark:text-slate-100">
              3. Choose Your Meal Timing
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Select a single custom meal plan or generate a complete full-day nutrition suite.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: "breakfast", label: "Breakfast", desc: "Start strong" },
            { id: "lunch", label: "Lunch", desc: "Mid-day fuel" },
            { id: "dinner", label: "Dinner", desc: "Evening feast" },
            { id: "fullday", label: "Full Day Plan", desc: "Breakfast, Lunch & Dinner!" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMealTime(item.id as any)}
              className={`p-4 rounded-xl text-left border transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                mealTime === item.id
                  ? "border-fuchsia-500 bg-fuchsia-50/20 dark:bg-fuchsia-950/10 text-fuchsia-700 dark:text-fuchsia-300 ring-2 ring-fuchsia-500/20 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div>
                <span className="block font-bold text-sm text-slate-900 dark:text-slate-100">
                  {item.label}
                </span>
                <span className="block text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {item.desc}
                </span>
              </div>
              {mealTime === item.id && (
                <div className="absolute right-2 bottom-2 w-2.5 h-2.5 rounded-full bg-fuchsia-500" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 4. LIFESTYLE CATEGORIES */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-lg text-slate-900 dark:text-slate-100">
              4. Select Culinary Focus Category
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Decide on your nutritional goals and ingredient selection.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Binge Eat Card */}
          <div
            id="category-card-binge"
            onClick={() => setCategory("binge")}
            className={`cursor-pointer rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 overflow-hidden relative group ${
              category === "binge"
                ? "border-fuchsia-500 bg-fuchsia-50/10 dark:bg-fuchsia-950/10 ring-2 ring-fuchsia-500/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19]/40 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md dark:hover:shadow-none"
            }`}
          >
            {/* Background Accent */}
            <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors duration-300" />
            
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center mb-5">
                <Flame className="w-6 h-6" />
              </div>
              <h4 className="font-sans font-bold text-base text-slate-900 dark:text-slate-100">
                Binge Eat
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Comfort foods, rich sauces, and savory cheats. Think creamy pasta, loaded beef skillet stews, and luscious desserts. Deliciously satisfying comfort cuisine.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-full">
                Comfort Focus
              </span>
              {category === "binge" && (
                <div className="w-4 h-4 rounded-full bg-fuchsia-500" />
              )}
            </div>
          </div>

          {/* Healthy Card */}
          <div
            id="category-card-healthy"
            onClick={() => setCategory("healthy")}
            className={`cursor-pointer rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 overflow-hidden relative group ${
              category === "healthy"
                ? "border-fuchsia-500 bg-fuchsia-50/10 dark:bg-fuchsia-950/10 ring-2 ring-fuchsia-500/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19]/40 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md dark:hover:shadow-none"
            }`}
          >
            <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-300" />

            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center mb-5">
                <Heart className="w-6 h-6" />
              </div>
              <h4 className="font-sans font-bold text-base text-slate-900 dark:text-slate-100">
                Healthy Choice
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Balanced, nutritious, and wholesome. Fresh garden bases, premium seafood, vegetables, and vegan-friendly plant nutrients. Perfectly clean energy for daily vitality.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full">
                Balanced Nutrition
              </span>
              {category === "healthy" && (
                <div className="w-4 h-4 rounded-full bg-fuchsia-500" />
              )}
            </div>
          </div>

          {/* Athlete's Pick Card */}
          <div
            id="category-card-athlete"
            onClick={() => setCategory("athlete")}
            className={`cursor-pointer rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 overflow-hidden relative group ${
              category === "athlete"
                ? "border-fuchsia-500 bg-fuchsia-50/10 dark:bg-fuchsia-950/10 ring-2 ring-fuchsia-500/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19]/40 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md dark:hover:shadow-none"
            }`}
          >
            <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors duration-300" />

            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center mb-5">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h4 className="font-sans font-bold text-base text-slate-900 dark:text-slate-100">
                Athlete's Pick
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                High protein, muscle-building, and performance-ready. Lean beef, grilled chicken, salmon, and high amino acids. Full visual macronutrient reports included.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-full">
                High Protein
              </span>
              {category === "athlete" && (
                <div className="w-4 h-4 rounded-full bg-fuchsia-500" />
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* SUBMIT BUTTON */}
      <div className="flex justify-center pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="px-8 py-4 bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-sans font-semibold rounded-xl shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/35 transition-all flex items-center gap-3 text-base cursor-pointer"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          Generate My Meal Plan
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </form>
  );
}
