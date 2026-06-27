import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Settings,
  X,
  TrendingUp,
  Flame,
  Dumbbell,
  Heart,
  Utensils,
  Check,
  ChevronRight,
  RefreshCw,
  Coins,
  ChevronLeft,
  AlertTriangle,
  Lightbulb,
  CheckSquare,
  Square,
  Layers,
  ShoppingBag,
  Info,
  Sun,
  Moon,
  Clock,
  ArrowRight,
  Lock,
  Unlock,
  HelpCircle,
  Globe
} from "lucide-react";
import OnboardingForm from "./components/OnboardingForm";
import { UserPreferences, Meal, PantryState, SubstitutionResult } from "./types";

export default function App() {
  // Theme & Onboarding States
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("app-theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  const [preferences, setPreferences] = useState<UserPreferences | null>(() => {
    const saved = localStorage.getItem("user-preferences");
    return saved ? JSON.parse(saved) : null;
  });

  // Live exchange rate (USD to INR). Set 83.5 as initial fallback
  const [inrRate, setInrRate] = useState<number>(83.5);
  const [isRateFetched, setIsRateFetched] = useState<boolean>(false);

  // Navigation & Data States
  const [phase, setPhase] = useState<1 | 2>(1); // Phase 1: Onboarding, Phase 2: Interactive Meal Engine
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMealIndex, setSelectedMealIndex] = useState<number>(0);
  const [pantry, setPantry] = useState<PantryState>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Is pantry submitted / substitutes generated for the currently selected meal?
  const [isPantrySubmitted, setIsPantrySubmitted] = useState<boolean>(false);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [editBudget, setEditBudget] = useState<number>(500);
  const [editCategory, setEditCategory] = useState<'binge' | 'healthy' | 'athlete'>("healthy");
  const [editMealTime, setEditMealTime] = useState<'breakfast' | 'lunch' | 'dinner' | 'fullday'>("lunch");
  const [editCuisine, setEditCuisine] = useState<string>("Indian");

  // Substitutions state
  const [subResult, setSubResult] = useState<SubstitutionResult | null>(null);
  const [submittingPantry, setSubmittingPantry] = useState<boolean>(false);

  // Fetch Live Currency Conversion Rate (USD to INR) on component mount
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch("https://v6.exchangerate-api.com/v6/7a92d82dd2a713e6ed7a0e74/latest/USD");
        if (res.ok) {
          const data = await res.json();
          if (data && data.conversion_rates && typeof data.conversion_rates.INR === "number") {
            setInrRate(data.conversion_rates.INR);
            setIsRateFetched(true);
            console.log("Live exchange rate fetched successfully:", data.conversion_rates.INR);
          }
        }
      } catch (err) {
        console.error("Failed to fetch live exchange rate, utilizing fallback 83.5:", err);
      }
    };
    fetchRate();
  }, []);

  // Apply Theme Class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  // Sync preferences edit form fields
  useEffect(() => {
    if (preferences) {
      setEditBudget(preferences.budget);
      setEditCategory(preferences.category);
      setEditMealTime(preferences.mealTime);
      setEditCuisine(preferences.cuisine || "Indian");
    }
  }, [preferences]);

  // Fetch / Generate Meal Plan
  const handleOnboardingSubmit = async (prefs: UserPreferences) => {
    setLoading(true);
    setError(null);
    setLoadingStep("Sourcing fresh recipes matching your cuisine selection...");
    
    // Save to local storage
    localStorage.setItem("user-preferences", JSON.stringify(prefs));
    setPreferences(prefs);
    setIsPantrySubmitted(false);
    setSubResult(null);

    // Converted USD Budget limit for the AI to understand limits
    const usdBudget = prefs.budget / inrRate;

    try {
      setTimeout(() => {
        setLoadingStep("Analyzing macronutrients with Gastronomy AI...");
      }, 800);
      setTimeout(() => {
        setLoadingStep("Performing real-time ingredient budget forecasting...");
      }, 1600);

      const response = await fetch("/api/mealplan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: prefs.budget,
          usdBudget: usdBudget,
          currency: "INR",
          mealTime: prefs.mealTime,
          category: prefs.category,
          cuisine: prefs.cuisine
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with cooking backend server.");
      }

      const data = await response.json();
      if (data && data.meals && data.meals.length > 0) {
        setMeals(data.meals);
        setSelectedMealIndex(0);
        
        // Clear old pantry checklist state and pre-populate all as unchecked
        const initialPantry: PantryState = {};
        data.meals[0].ingredients.forEach((ing: any) => {
          initialPantry[ing.name] = false;
        });
        setPantry(initialPantry);
        
        setPhase(2);
      } else {
        throw new Error("We couldn't generate recipes for this combination. Try raising your budget limit.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected culinary networking error occurred.");
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingStep("");
      }, 2200);
    }
  };

  // Re-run generation with edited preferences inside the modal
  const handleSaveSettings = () => {
    setIsSettingsOpen(false);
    const updatedPrefs: UserPreferences = {
      budget: editBudget,
      currency: "INR",
      mealTime: editMealTime,
      category: editCategory,
      cuisine: editCuisine
    };
    handleOnboardingSubmit(updatedPrefs);
  };

  // Switch to another meal in multi-meal fullday layout
  const handleMealSelect = (index: number) => {
    setSelectedMealIndex(index);
    // Refresh pantry checkboxes for the newly active meal
    const activeMeal = meals[index];
    const initialPantry: PantryState = {};
    activeMeal.ingredients.forEach((ing: any) => {
      initialPantry[ing.name] = false;
    });
    setPantry(initialPantry);
    setSubResult(null); // Reset substitution results for new meal
    setIsPantrySubmitted(false); // Relock the steps for the new meal
  };

  // Toggle checklist ingredient state
  const toggleIngredient = (name: string) => {
    setPantry((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  // Run Substitution check and unlock preparation plan (Step C)
  const handleCheckMissingIngredients = async () => {
    if (meals.length === 0) return;
    setSubmittingPantry(true);
    setError(null);

    const activeMeal = meals[selectedMealIndex];

    try {
      const response = await fetch("/api/mealplan/substitutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meal: activeMeal,
          pantryState: pantry,
          currency: "USD" // Backend evaluates costs in USD, we convert to INR on frontend
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process ingredient substitutions.");
      }

      const result = await response.json();
      setSubResult(result);
      setIsPantrySubmitted(true); // Unlock preparation steps!
    } catch (err: any) {
      setError(err.message || "Could not analyze substitutions.");
    } finally {
      setSubmittingPantry(false);
    }
  };

  const handleBackToLanding = () => {
    setPhase(1);
    setMeals([]);
    setSubResult(null);
    setIsPantrySubmitted(false);
  };

  const currentMeal = meals[selectedMealIndex];
  
  // USD costs from backend are strictly converted to INR using live exchange rate
  const totalMealCostInINR = currentMeal ? currentMeal.estimatedTotalCost * inrRate : 0;
  const targetBudgetInINR = preferences?.budget || 0;
  const budgetPercentage = Math.min(100, Math.round((totalMealCostInINR / targetBudgetInINR) * 100));

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-gray-100' : 'bg-slate-50 text-gray-900'}`}>
      
      {/* NAVBAR */}
      <nav className={`h-16 border-b transition-colors duration-300 flex items-center justify-between px-6 md:px-12 ${theme === 'dark' ? 'border-slate-800 bg-[#0B0F19]' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToLanding}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#D946EF]">
            <Utensils className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white uppercase">
            Gastronomy<span className="text-[#D946EF]">AI</span>
          </span>
        </div>

        {preferences && (
          <div className="hidden md:flex gap-6 text-sm font-bold">
            <button
              onClick={() => { setIsPantrySubmitted(false); setSubResult(null); }}
              className={`pb-1 transition-all cursor-pointer ${!isPantrySubmitted ? "text-[#D946EF] border-b-2 border-[#D946EF]" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"}`}
            >
              Step A: Pantry Checklist
            </button>
            <button
              onClick={() => { if (isPantrySubmitted) { /* stay */ } else { handleCheckMissingIngredients(); } }}
              className={`pb-1 transition-all cursor-pointer ${isPantrySubmitted ? "text-[#D946EF] border-b-2 border-[#D946EF]" : "text-gray-400 cursor-not-allowed opacity-50"}`}
              disabled={!isPantrySubmitted}
            >
              Step C: Cooking Prep Plan
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          {preferences && (
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-extrabold">INR Budget limit</p>
              <p className="text-sm font-mono font-extrabold text-gray-900 dark:text-white">
                ₹{preferences.budget.toFixed(2)}
              </p>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl transition-all border border-slate-300 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-900 cursor-pointer"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-fuchsia-600" />}
          </button>
        </div>
      </nav>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="max-w-4xl mx-auto mt-6 px-4">
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900/50 p-4 rounded-xl text-rose-700 dark:text-rose-400 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="flex-1 font-semibold">{error}</div>
            <button onClick={() => setError(null)} className="hover:opacity-80 font-bold text-lg">✕</button>
          </div>
        </div>
      )}

      {/* LIVE EXCHANGE RATE STATUS BAR */}
      {isRateFetched && (
        <div className="bg-fuchsia-500/5 dark:bg-fuchsia-500/10 border-b border-fuchsia-500/20 py-1.5 px-4 text-center">
          <p className="text-[11px] font-semibold text-fuchsia-700 dark:text-fuchsia-300 flex items-center justify-center gap-1.5">
            <Globe className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
            Active Live Conversion Feed: <span className="font-mono font-bold">1 USD = ₹{inrRate.toFixed(4)} INR</span>. Meal database prices converted instantly on component load.
          </p>
        </div>
      )}

      {/* LOADING OVERLAY SCREEN */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 dark:bg-black/95 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-sm px-6"
          >
            <div className="relative mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-slate-300 dark:border-slate-800 border-t-[#D946EF] animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#D946EF] animate-pulse" />
              </div>
            </div>
            <h3 className="font-sans font-bold text-xl text-gray-900 dark:text-white">Gastronomy AI at Work</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 font-semibold h-12 leading-relaxed">
              {loadingStep || "Analyzing taste parameters..."}
            </p>
            
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-6">
              <div className="bg-[#D946EF] h-full rounded-full animate-pulse" style={{ width: '80%' }}></div>
            </div>
            <span className="block text-[10px] text-slate-500 dark:text-slate-600 font-mono mt-2 tracking-widest uppercase">
              PROFILING STAPLES
            </span>
          </motion.div>
        </div>
      )}

      {/* MAIN LAYOUT WRAPPER */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 pb-28">
        
        {/* PHASE 1: LANDING PAGE & PREFERENCES */}
        {phase === 1 && (
          <div className="space-y-12">
            
            {/* HERO SECTION */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/5 text-[#D946EF] text-xs font-bold uppercase tracking-wider mb-2"
              >
                <Sparkles className="w-4 h-4 animate-spin text-[#D946EF]" style={{ animationDuration: '4s' }} />
                Smart Gastronomic Orchestrator
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1]"
              >
                AI-Powered Meal Planning <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D946EF] via-fuchsia-400 to-[#D946EF]">
                  Tailored To Your INR Budget
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm md:text-base text-gray-700 dark:text-gray-300 max-w-2xl mx-auto font-semibold leading-relaxed"
              >
                No more overspending on complex recipes. Input your budget in INR (₹), select your preferred cuisine, choose your timing, and let our custom intelligence formulate clean chef recommendations.
              </motion.p>
            </div>

            {/* ONBOARDING FORM */}
            <div className="max-w-4xl mx-auto">
              <OnboardingForm onSubmit={handleOnboardingSubmit} initialPreferences={preferences || undefined} />
            </div>

          </div>
        )}

        {/* PHASE 2: PLAN & PANTRY INTERACTIVE ENGINE */}
        {phase === 2 && currentMeal && (
          <div className="space-y-8">
            
            {/* BACK BUTTON TO RE-PLAN */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToLanding}
                className="flex items-center gap-2 py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold text-sm text-gray-800 dark:text-gray-200 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Settings
              </button>
              
              <div className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-widest flex items-center gap-1 bg-fuchsia-50 dark:bg-fuchsia-950/20 px-3 py-1.5 rounded-lg border border-fuchsia-100 dark:border-fuchsia-900/40">
                <Globe className="w-4 h-4 text-fuchsia-500" />
                Preferred Cuisine: <span className="font-extrabold text-gray-900 dark:text-white ml-0.5">{preferences?.cuisine}</span>
              </div>
            </div>

            {/* MEAL TIMING ROW (If multi-meal 'fullday' requested) */}
            {meals.length > 1 && (
              <div className="bg-white dark:bg-[#0B0F19]/60 border border-slate-200 dark:border-slate-800/80 p-3 rounded-2xl flex gap-2">
                {meals.map((m, idx) => {
                  const label = idx === 0 ? "Breakfast" : idx === 1 ? "Lunch" : "Dinner";
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleMealSelect(idx)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedMealIndex === idx
                          ? "bg-[#D946EF] text-black shadow-md"
                          : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900/40"
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TWO-COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: MEAL OVERVIEW & PANTRY CHECKLIST */}
              <div className="lg:col-span-6 space-y-8">
                
                {/* MEAL HEADER CARD */}
                <div className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-6 p-6">
                  <div className="relative h-64 bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                    <img
                      src={currentMeal.thumbnail || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop'}
                      alt={currentMeal.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="bg-[#D946EF] text-black text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                          {preferences?.category === 'athlete' ? "Athlete's Pick" : preferences?.category === 'healthy' ? "Healthy Focus" : "Binge Comfort"}
                        </span>
                        <span className="bg-slate-800/90 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                          {currentMeal.category}
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight">{currentMeal.name}</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="block text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Calories</span>
                      <span className="block text-gray-900 dark:text-gray-100 text-sm font-bold font-mono mt-0.5">{currentMeal.macros.calories} kcal</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="block text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Protein</span>
                      <span className="block text-gray-900 dark:text-gray-100 text-sm font-bold font-mono mt-0.5">{currentMeal.macros.protein}g</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="block text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Fats</span>
                      <span className="block text-gray-900 dark:text-gray-100 text-sm font-bold font-mono mt-0.5">{currentMeal.macros.fats}g</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="block text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Carbs</span>
                      <span className="block text-gray-900 dark:text-gray-100 text-sm font-bold font-mono mt-0.5">{currentMeal.macros.carbs}g</span>
                    </div>
                  </div>
                </div>

                {/* INGREDIENTS CHECKLIST (STEP A & STEP B) */}
                <div id="pantry-check-card" className="bg-white dark:bg-black rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col space-y-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-fuchsia-500/5 text-[#D946EF] text-[10px] font-extrabold uppercase tracking-widest mb-2 border border-fuchsia-500/10">
                        Step A & B: Pantry Check
                      </div>
                      <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">What ingredients do you have?</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                        Check off items you already have in stock. The AI chef will suggest substitution resolutions for missing items!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const reset: PantryState = {};
                        currentMeal.ingredients.forEach(i => reset[i.name] = false);
                        setPantry(reset);
                      }}
                      className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 cursor-pointer"
                      title="Reset Checklist"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {currentMeal.ingredients.map((ing) => {
                      const isChecked = !!pantry[ing.name];
                      // USD estimated cost strictly converted to INR
                      const costInINR = ing.estimatedCost * inrRate;
                      
                      return (
                        <label
                          key={ing.name}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? "bg-fuchsia-500/5 border-[#D946EF] text-gray-900 dark:text-white"
                              : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isChecked}
                              onChange={() => toggleIngredient(ing.name)}
                            />
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                              isChecked
                                ? "bg-[#D946EF] border-[#D946EF] text-black"
                                : "border-2 border-slate-300 dark:border-slate-700 bg-transparent"
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className={`text-sm font-bold ${isChecked ? 'line-through opacity-60 text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                              {ing.name}
                            </span>
                            {ing.isCore && (
                              <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                                Core Item
                              </span>
                            )}
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 font-bold">{ing.measure}</span>
                            <span className="text-[11px] font-mono text-[#D946EF] font-bold mt-0.5">
                              ₹{costInINR.toFixed(2)}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* SUBMIT BUTTON TO UNLOCK COOKING PLAN */}
                  <button
                    onClick={handleCheckMissingIngredients}
                    disabled={submittingPantry}
                    className="w-full mt-4 bg-[#D946EF] hover:bg-fuchsia-600 text-black font-extrabold py-4 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.3)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    {submittingPantry ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        Running Substitution AI Resolutions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-black animate-pulse" />
                        Submit Pantry Check & Build Prep Plan
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* RIGHT COLUMN: AI SUBSTITUTIONS & FINAL PREPARATION GUIDE */}
              <div className="lg:col-span-6 space-y-8">
                
                {/* BUDGET FORECAST CARD */}
                <div className="bg-white dark:bg-black rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Live Budget Forecast (INR ₹)</h3>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      totalMealCostInINR <= targetBudgetInINR 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}>
                      {totalMealCostInINR <= targetBudgetInINR ? "Under Budget" : "Exceeds Budget Limit"}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-mono font-extrabold text-gray-900 dark:text-white tracking-tighter">
                        ₹{totalMealCostInINR.toFixed(2)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-bold mb-1.5">/ estimated total</span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          totalMealCostInINR <= targetBudgetInINR ? 'bg-[#D946EF]' : 'bg-rose-500'
                        }`}
                        style={{ width: `${budgetPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mt-2">
                      <span>Utilization: {budgetPercentage}%</span>
                      <span>INR Limit: ₹{targetBudgetInINR.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs text-gray-700 dark:text-gray-300 font-semibold leading-relaxed">
                    {/* Convert any references of $ in the backend justification into ₹ using simple substitution for display */}
                    {currentMeal.budgetCheck.justification
                      .replace(/\$([\d.]+)/g, (_, val) => `₹${(parseFloat(val) * inrRate).toFixed(2)}`)
                      .replace(/USD/g, "INR")
                    }
                  </div>
                </div>

                {/* STEP C: AI RESOLUTIONS & DETAILED PREPARATION PLAN */}
                <div className="bg-white dark:bg-black rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-[#D946EF]" />
                      <h3 className="font-sans font-extrabold text-base text-gray-900 dark:text-white uppercase tracking-wider">
                        Step C: Preparation Guide
                      </h3>
                    </div>
                    <div>
                      {isPantrySubmitted ? (
                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                          <Unlock className="w-3.5 h-3.5" /> Unlocked
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Locked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* IF PANTRY SUBMITTED -> SHOW SUB RESOLUTIONS AND STEPS */}
                  <AnimatePresence mode="wait">
                    {isPantrySubmitted ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        {/* SUBSTITUTIONS LIST */}
                        {subResult && subResult.substitutions && subResult.substitutions.length > 0 && (
                          <div className="bg-fuchsia-500/5 dark:bg-fuchsia-500/10 border-l-4 border-[#D946EF] p-4 rounded-r-2xl space-y-3">
                            <h4 className="text-xs font-extrabold text-[#D946EF] uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4" /> AI Substitution Resolutions
                            </h4>
                            <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold italic">
                              Substitution resolutions calculated live for missing pantry items:
                            </p>
                            <div className="space-y-2 pt-1">
                              {subResult.substitutions.map((sub, idx) => (
                                <div key={idx} className="bg-slate-100 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-rose-600 dark:text-rose-400">Missing: {sub.missingIngredient}</span>
                                    <span className="text-[9px] font-bold bg-fuchsia-100 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 px-2 py-0.5 rounded">
                                      AI SWAP
                                    </span>
                                  </div>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    Substitute: {sub.suggestedSubstitute}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                    {sub.explanation}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* CORE MISSING MAJOR ALERT ALTERNATIVES */}
                        {subResult && !subResult.isMinorMissingOnly && subResult.majorAlert && (
                          <div className="bg-rose-500/10 border-l-4 border-rose-500 p-4 rounded-r-2xl space-y-4">
                            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-extrabold text-xs uppercase tracking-wider">
                              <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                              Major Pantry Gap Detected
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
                              {subResult.majorAlert.message}
                            </p>
                            
                            <div className="space-y-3 pt-1">
                              {subResult.majorAlert.alternativeMeals.map((alt, idx) => (
                                <div key={idx} className="bg-slate-100 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
                                  <img src={alt.thumbnail} alt={alt.name} className="w-16 h-16 object-cover rounded-lg" />
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">{alt.name}</h5>
                                    <p className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-tight mt-0.5">{alt.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* REVEALED INSTRUCTIONS */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2">
                            Step-By-Step Instructions
                          </h4>
                          
                          <div className="space-y-4">
                            {currentMeal.instructions.map((step, idx) => {
                              // Dynamically highlight if any missing ingredient is referenced in this step to draw substitute attention!
                              const missingSub = subResult?.substitutions?.find(sub => 
                                step.toLowerCase().includes(sub.missingIngredient.toLowerCase())
                              );

                              return (
                                <div key={idx} className="flex gap-4 items-start">
                                  <span className="w-6 h-6 shrink-0 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950/40 text-[#D946EF] flex items-center justify-center font-mono text-xs font-extrabold mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="text-gray-800 dark:text-gray-200 text-sm font-semibold leading-relaxed">
                                      {step}
                                    </p>
                                    {missingSub && (
                                      <span className="inline-block mt-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded">
                                        💡 AI Resolution Swap: Use <span className="underline">{missingSub.suggestedSubstitute}</span> instead of {missingSub.missingIngredient}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      /* IF LOCKER -> SHOW LOCK CARD */
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 px-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800/80 space-y-4"
                      >
                        <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                          <Lock className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm">Instructions Locked</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">
                            Check off any available ingredients on the left and click **"Submit Pantry Check"** to resolve substitutions and unlock step-by-step cooking steps.
                          </p>
                        </div>
                        <button
                          onClick={handleCheckMissingIngredients}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-lg cursor-pointer transition-all"
                        >
                          Skip & Unlock instructions
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* STICKY SETTINGS FAB BUTTON (BOTTOM-LEFT) */}
      <button
        onClick={() => {
          if (preferences) {
            setEditBudget(preferences.budget);
            setEditCategory(preferences.category);
            setEditMealTime(preferences.mealTime);
            setEditCuisine(preferences.cuisine || "Indian");
          }
          setIsSettingsOpen(true);
        }}
        id="sticky-settings-fab"
        className="fixed bottom-8 left-8 w-12 h-12 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-gray-900 dark:text-white shadow-2xl hover:border-[#D946EF] dark:hover:border-[#D946EF] z-50 transition-all cursor-pointer"
        title="Settings & Preferences"
      >
        <Settings className="w-6 h-6 animate-spin hover:text-[#D946EF] text-gray-800 dark:text-gray-200" style={{ animationDuration: '8s' }} />
      </button>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              id="settings-modal"
              className="bg-white dark:bg-[#0B0F19] border border-slate-300 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#D946EF]" />
                  <h3 className="font-sans font-extrabold text-lg text-gray-900 dark:text-white">
                    Preferences & Setup
                  </h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 dark:text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Theme Selector (Visible Always) */}
              <div className="space-y-3">
                <span className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                  Visual Theme
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                      theme === "light"
                        ? "border-[#D946EF] bg-fuchsia-500/5 text-fuchsia-700 font-extrabold"
                        : "border-slate-200 dark:border-slate-800/80 text-gray-700 bg-transparent"
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Light Mode
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                      theme === "dark"
                        ? "border-[#D946EF] bg-fuchsia-500/10 text-[#D946EF] font-extrabold"
                        : "border-slate-200 dark:border-slate-800/80 text-gray-700 bg-transparent"
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    Elegant Dark
                  </button>
                </div>
              </div>

              {/* Dynamic Expanded Section if After Onboarding */}
              {preferences ? (
                <div className="space-y-5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  {/* Budget Edit */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                      Edit Budget Limit (₹ INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-800 dark:text-gray-200 font-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={editBudget}
                        onChange={(e) => setEditBudget(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-bold"
                      />
                    </div>
                  </div>

                  {/* Cuisine Edit */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                      Edit Cuisine Preference
                    </label>
                    <input
                      type="text"
                      value={editCuisine}
                      onChange={(e) => setEditCuisine(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-bold"
                      placeholder="e.g. Indian, Italian, Mexican"
                    />
                  </div>

                  {/* Meal Focus Category */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                      Edit Meal Style Focus
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "binge", label: "Binge Eat" },
                        { id: "healthy", label: "Healthy" },
                        { id: "athlete", label: "Athlete" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setEditCategory(item.id as any)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            editCategory === item.id
                              ? "border-[#D946EF] bg-fuchsia-500/10 text-[#D946EF]"
                              : "border-slate-200 dark:border-slate-800/80 text-gray-700 bg-transparent"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meal Time Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                      Edit Meal Timing
                    </label>
                    <select
                      value={editMealTime}
                      onChange={(e) => setEditMealTime(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-sm font-bold"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="fullday">Full Day Plan (3 Meals)</option>
                    </select>
                  </div>

                  {/* Submit / Re-generate Trigger */}
                  <button
                    onClick={handleSaveSettings}
                    className="w-full bg-[#D946EF] hover:bg-fuchsia-600 text-black font-extrabold py-3.5 rounded-xl transition-all shadow-md text-sm mt-2 cursor-pointer"
                  >
                    Save & Re-Generate Meal Plan
                  </button>
                </div>
              ) : (
                <div className="text-center p-3 text-xs text-gray-600 dark:text-gray-400">
                  Complete onboarding to edit personalized budget and style parameters.
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
