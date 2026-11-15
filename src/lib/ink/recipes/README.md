# Looseleaf UI Recipes

## Overview

Component drawing recipes providing hand-drawn visual representations for UI widgets (buttons, cards, inputs, tabs, dialogs, overlays) and specialized data visualization recipes.

## Subdirectories & Boundaries

- [chart-ink](./chart-ink/README.md) - Procedural looseleaf drawing recipes for charts and data visualizations.

## Interface

- [index.ts:allRecipes]
- [index.ts:bucketBox]
- [index.ts:DEFAULT_KNOBS]
- [index.ts:defineRecipe]
- [index.ts:getRecipe]
- [index.ts:INK_LAYER_ORDER]
- [index.ts:knobsKey]
- [index.ts:orderLayers]
- [index.ts:resolveKnobs]
- [index.ts:runCounter]
- [index.ts:runRecipe]
- [index.ts:stableStringify]

## Invariants

- Recipe IDs must follow kebab-case naming syntax [index.ts:defineRecipe]
- All declared lazy evaluation layers must be members of the recipe's base layer array [index.ts:defineRecipe]
- Bounding box sizes are snapped to modular step multiples [index.ts:bucketBox]

## Side Effects

- Mutates module-level recipe registry during definition [index.ts:defineRecipe]
- Increments global runCounter execution count upon recipe execution [index.ts:runRecipe]
- Emits console error diagnostics when unhashable parameters are passed to stableStringify [index.ts:stableStringify]

## Verification

- Run: npm run build
