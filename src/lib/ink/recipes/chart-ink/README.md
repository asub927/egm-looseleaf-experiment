# Chart Ink Recipes

## Overview
Procedural looseleaf drawing recipes for charts, including XY axes, gridlines, data markers, hatched fills, sparklines, tally counters, heatmaps, and polar visualizations (pie, radar, radial, gauge).

## Interface
- [mark.ts:markRecipe]
- [mini.ts:roughSquare]
- [mini.ts:sparkRecipe]
- [mini.ts:tallyRecipe]
- [mini.ts:heatAlpha]
- [mini.ts:heatRecipe]
- [parts.ts:rectPts]
- [parts.ts:NOTE_PEN]
- [parts.ts:seriesColor]
- [parts.ts:patternFill]
- [parts.ts:drawMarker]
- [parts.ts:drawPolyline]
- [parts.ts:drawGrid]
- [parts.ts:drawAxisLines]
- [parts.ts:swipeFill]
- [polar.ts:pieRecipe]
- [polar.ts:radarRecipe]
- [polar.ts:radialRecipe]
- [polar.ts:gaugeRecipe]
- [xy.ts:HATCH_ON]
- [xy.ts:hatchOn]
- [xy.ts:xyRecipe]

## Invariants
- Color slot indexing in hatchOn cycles predictably across 8 discrete palette keys [xy.ts:hatchOn]
- All chart renderers conform to the ink recipe specification [mark.ts:markRecipe]

## Side Effects
- None

## Verification
- Run: npm run build
