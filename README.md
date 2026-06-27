# GastronomyAI 🍳
### Smart AI-Powered Meal Planning & Budget-Aware Recipe Orchestrator

**GastronomyAI** is an intelligent, full-stack, budget-aware meal planning application designed to revolutionize how you cook, budget, and manage your pantry. By combining real-time recipes with advanced Generative AI and live currency exchange conversion, GastronomyAI helps you curate customized meal plans, check off your available pantry ingredients, resolve missing item substitutions instantly, and cook within your chosen target Indian Rupee (₹ INR) budget.

---

## 🌟 Key Features (The User Journey)

GastronomyAI is built around a beautifully crafted, highly intuitive user experience divided into clean, structured logical phases:

### 1. Smart Preferences & Onboarding
* **Dynamic Budget Setting (INR ₹):** Define your strict spending limit in Indian Rupees (₹) for a single meal or full-day culinary suite.
* **Cuisine Selection:** Shortlist your culinary preference (Indian, Italian, Mexican, Chinese, Japanese, Thai, Mediterranean, or custom options) to focus the meal suggestions.
* **Meal Style Focus (Lifestyle Categories):**
  * **Binge Eat:** Comfort foods, rich sauces, and savory cheats.
  * **Healthy Choice:** Balanced, wholesome, and nutritious options with optimal plant/seafood nutrients.
  * **Athlete's Pick:** High-protein, muscle-building, and performance-ready protein fuel.
* **Meal Timing Selection:** Plan for a single timing (Breakfast, Lunch, Dinner) or generate a complete **Full Day Plan** spanning all three.

### 2. Live Budget & Currency Conversion
* **Live Exchange Rates:** The application automatically fetches live USD-to-INR currency exchange rates on mount from a real-world conversion feed.
* **Real-Time Cost Calculations:** Because raw ingredient catalogs operate in global indexes (USD), the system converts any background prices dynamically to INR. It validates whether your meal selections fit your target INR limit, highlighting cost indicators and budget headroom.

### 3. Interactive Pantry Checklist (Step A & B)
* **What's In Stock?** Once a meal is formulated, the app renders a comprehensive ingredient checklist detailing the exact metric measurements, core/minor item status, and converted cost estimates.
* **Pantry Check:** Mark off the ingredients you already have in stock. This ensures you only buy or focus on what's missing, optimizing your kitchen expenses.

### 4. AI Substitution Resolution & Final Prep Plan (Step C)
* **Conditional Cooking Flow:** Cooking instructions are locked initially. This prevents cognitive overload and encourages smart preparation.
* **Smart AI Swaps:** Clicking **"Submit Pantry Check"** triggers the Generative AI Service Layer. The AI calculates tailored substitutions for missing items (e.g., substituting milk with almond milk, or chicken with tofu) and integrates those substituted ingredients dynamically into the steps.
* **Major Pantry Gap Alerts:** If critical core ingredients are missing, the AI warns you of a major gap and offers alternative recipes that utilize your in-stock pantry items instead.

### 5. Highly Polished Dual-Theme Interface
* **Elegant Light & Deep Dark Modes:** A pristine, high-contrast user interface featuring smooth transitions powered by **Motion**.
* **Contrast-Guaranteed Typography:** Meticulously selected Tailwind contrast rules ensure readable, eye-friendly layout elements across all lighting environments.

---

## 🧠 AI & API Integration Details

GastronomyAI leverages a hybrid architecture combining external database queries, live calculations, and generative reasoning:

```
  [User Onboarding Inputs] 
             │
             ▼
   ┌───────────────────┐      1. Cuisine & Categories Filter
   │   Express Server  │ ──────────────────────────────────────► [TheMealDB API]
   │    (Vite Dev)     │ ◄──────────────────────────────────────   (Base Recipes)
   └───────────────────┘
             │
             │ 2. Real-Time Enrichment & Budget Forecasting
             ▼
   ┌───────────────────┐      - Ingredient Pricing in USD ($)
   │ Google Gemini AI  │      - Macro-nutrient Synthesis
   │   Service Layer   │      - Budget Justifications
   └───────────────────┘
             │
             ▼
   ┌───────────────────┐      3. Live USD to INR Rate Fetch
   │   React Client    │ ◄────────────────────────────────────── [ExchangeRate API]
   └───────────────────┘
             │
             ▼
    [Unlocked Step C]  ◄── 4. AI Ingredient Substitution Logic & Adjusted Cooking Steps
```

1. **TheMealDB API:** Acts as the primary base culinary database, pulling raw regional dishes matching the user's selected cuisine preference and timing.
2. **Generative AI Service Layer (Google Gemini API):** Powered by the cutting-edge **Google Gemini** model using the `@google/genai` TypeScript SDK. The model performs complex reasoning tasks:
   * **Nutritional Analysis:** Dynamically compiles macronutrient reports (Calories, Protein, Carbohydrates, Fats) based on the database's recipe structure.
   * **Price Assignment:** Estimates standard market pricing for ingredients, ensuring logical balance.
   * **Substitutions Reasoning:** Dynamically maps missing ingredients to acceptable replacements while warning the user if the recipe's integrity changes.
3. **Live Exchange Rate API:** Uses the `ExchangeRate-API` feed to perform currency conversions seamlessly in the browser.

---

## 🛠️ Tech Stack

* **Frontend:** React 18 (with TypeScript, Vite, and ES Modules)
* **Animations:** `motion` (Framer Motion)
* **Styling:** Tailwind CSS, Lucide React Icons
* **Backend:** Express Server (handling proxy routing, static delivery, and the Generative AI Service Layer)
* **AI Model integration:** Google Gen AI SDK (`@google/genai`)

---

## 🚀 Local Setup & Installation

Follow these steps to run GastronomyAI on your local developer workstation:

### 1. Prerequisites
Ensure you have Node.js (v18 or higher) and npm installed.

### 2. Clone and Install Dependencies
```bash
# Clone the repository
git clone https://github.com/yourusername/gastronomy-ai.git
cd gastronomy-ai

# Install the required packages
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add your API credentials. You can copy the values from `.env.example`:

```env
# .env.example
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 4. Start the Application
To run the server and client concurrently in your development environment:

```bash
# Run the development server
npm run dev
```

The application will launch on **`http://localhost:3000`** with Hot Module Replacement and live server-side capabilities.

### 5. Build for Production
To bundle and compile the application for production deployment:

```bash
# Compile client assets & bundle the server CJS output
npm run build

# Start production server
npm start
```

---

## 🗺️ Future Roadmap

Planned enhancements for future iterations of GastronomyAI include:
- [ ] **Persistent User Accounts:** Secure login and session management powered by **Firebase Authentication** or **Clerk**.
- [ ] **Cloud Saved Boards:** Persistent meal boards and grocery shopping lists stored in a cloud-hosted **Firestore** or **PostgreSQL** database.
- [ ] **Calorie Tracking Calendar:** Historical visual dashboard showing daily consumption stats, macronutrient progress, and cumulative budget savings.
- [ ] **Custom Ingredient Price Customization:** Allowing users to override ingredient pricing to match their local supermarket.

---

*Enjoy cooking delicious, healthy, and budget-friendly meals with GastronomyAI!* 🍲
