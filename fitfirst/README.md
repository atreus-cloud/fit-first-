# FitFirst Nutrition OS — mobile-first alpha

FitFirst is a phone-first calorie tracker built as a Vercel static app plus serverless API routes. It is intended to be used in portrait on Android; desktop is secondary.

## What's in this build
- Mobile-first responsive layout, large touch targets, bottom navigation and safe-area padding.
- Local diary/weight/profile persistence, export, calorie and macro targets.
- Food search across a 50-entry curated Indian/global starter list, optional Supabase foods table, and optional USDA FoodData Central API.
- Gemini vision meal scanner: food names, estimated edible grams, per-100-g fallback macro estimates; editable before logging.
- Food scan nutrition matching against the food search endpoint. Database-backed values and AI fallback values are separately labelled.
- Katori dataset importer (CC BY 4.0) for 128 dish/preparation rows, once the CSV is downloaded from the source.
- Supabase SQL schema and a seed script for FitFirst starter foods.

## v0.3 — app completed (phone-only storage)
- **Per-day diary**: every entry is saved against its date. Old flat diaries are migrated to today automatically.
- **Date navigation**: tappable Mon–Sun week strip with ‹ › week arrows, a date picker, and a "Today" jump. Day rings turn green when on target (±10%) and pink when over.
- **Meals**: Breakfast / Lunch / Snacks / Dinner sections with subtotals, a ＋ on each, and "Copy from previous day".
- **Add/edit sheet** (replaces the old `prompt()`): servings or grams, ± stepper, live kcal/macro preview, meal picker. Tap any logged item to edit or delete it.
- **Quick add** (calories only) and **Create food** (saved to My foods, searchable). Recent foods show at the top of search.
- **Photo scan**: choose the meal, untick items you don't want, grams-based entries that stay editable later.
- **Progress**: real streak, 8 earned badges, 7-day calorie chart, weekly macro averages, weight trend chart, deletable weigh-ins (one per date).
- **Profile**: target calculator (Mifflin-St Jeor + activity + goal), input validation, backup import/export, clear selected day, full reset.
- API: USDA energy now read correctly (kcal or kJ), results ranked by relevance and capped at 40, edge-cached for 1 h. Service worker cache bumped to v2 so phones pick up the new app.

Next steps if you want them: Supabase Auth + cloud sync of `food_logs`/`weights` (schema already exists), barcode scanning, water tracking.

## Vercel API routes
- `GET /api/health` — reports provider configuration status without exposing secrets.
- `GET /api/foods/search?q=...` — returns curated entries and optional Supabase, USDA and imported Katori data.
- `POST /api/scan` — accepts `{ imageBase64, mimeType, notes }` and uses Gemini `generateContent` with image data.

## Vercel environment variables
Set these only in Vercel Project Settings → Environment Variables. Never put API keys in `index.html` or other client files.
- `GEMINI_API_KEY` (required for vision scanning)
- `GEMINI_VISION_MODEL` (optional; defaults to `gemini-flash-latest`)
- `USDA_API_KEY` (optional; obtain at https://api.data.gov/signup/)
- `SUPABASE_URL` (optional)
- `SUPABASE_SERVICE_ROLE_KEY` (optional; server-side only, never expose to client)

## Indian food data
- FitFirst curated starter dataset: quick local lookup; values are estimates, not lab data.
- Katori Indian food nutrition dataset: CC BY 4.0; source page/download and attribution: https://getkatori.com/data. Katori CSV was not included in this alpha because the download could not be fetched in this environment. Download the full CSV yourself, then run:
  `node scripts/import-katori.js /path/to/katori-indian-food-dataset.csv`
  This writes `data/katori-foods.json`, which the food-search API loads automatically. The importer keeps the per-100-g figures and preparation names; missing nutrients remain zero and are not guessed.
- INDB (Indian Nutrient Databank): research/open-access resource with 1,014 recipes, but the dataset's redistribution terms are not clearly stated. Do not redistribute/import it into a public hosted app until permissions are confirmed. Reference: https://www.anuvaad.org.in/indian-nutrient-databank/
- USDA FoodData Central: live API search when `USDA_API_KEY` is configured.

## Supabase setup
1. Create a Supabase project.
2. Run `supabase-schema.sql` in SQL Editor.
3. Optionally run `data/curated-foods-seed.sql` to seed 50 starter foods.
4. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel.
5. Service-role key stays backend-only. Before implementing cloud user diaries, configure Auth and verify row-level security policies.


## Run locally
Install Node.js and Vercel CLI, then run `vercel dev` in this folder.


## Privacy and estimation
Photos are uploaded to Gemini only when the user taps Analyze. Portion weights and nutrition fallback values are AI estimates. Database matching is preferred when available. Review the results before saving.
