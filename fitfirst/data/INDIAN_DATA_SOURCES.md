# Indian food data sources and attribution

## Katori Indian food nutrition dataset
- Dataset: https://getkatori.com/data
- License: CC BY 4.0 as stated on the source page.
- Attribution: `Data: Katori Indian food nutrition dataset, getkatori.com/data (CC BY 4.0)`
- Import: `node scripts/import-katori.js <CSV path>`
- Dataset CSV is not bundled in this alpha; direct download failed in the build environment.
- Nutrient values available from the documented CSV: kcal, protein, carbohydrate and fat per 100 g. FitFirst leaves fiber, sugar and sodium at zero when the source doesn't provide them.

## Indian Nutrient Databank (INDB)
- Resource: https://www.anuvaad.org.in/indian-nutrient-databank/
- Reported coverage: 1,014 common recipes.
- Data redistribution terms are not confirmed here. No INDB raw data is bundled or served by FitFirst until the rights are clarified.

## FitFirst curated starter foods
- 50 entries for prototype search, each clearly marked as a FitFirst estimate.
- These are rough reference values, not lab measurements and should be replaced or verified against licensed sources when matched.
