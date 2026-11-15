# Looseleaf Chart Engine

## Overview

Chart layout calculation, data scaling, downsampling (LTTB), and mathematical layout engines for hand-drawn XY charts, polar charts, sparklines, tallies, and heatmaps.

## Interface

- [chart-build.ts:buildXY]
- [chart-build.ts:buildXYRows]
- [chart-build.ts:capRows]
- [chart-build.ts:MAX_BARS]
- [chart-build.ts:MAX_POINTS]
- [chart-data.ts:summarizeXY]
- [chart-data.ts:tableXY]
- [chart-data.ts:xScaleFor]
- [chart-data.ts:yScaleFor]
- [chart-heat.ts:buildCalendar]
- [chart-heat.ts:buildGrid]
- [chart-heat.ts:levelOf]
- [chart-layout.ts:hitIndex]
- [chart-layout.ts:layoutChart]
- [chart-layout.ts:stepIndex]
- [chart-mini.ts:layoutHeat]
- [chart-mini.ts:layoutSpark]
- [chart-mini.ts:layoutTally]
- [chart-polar.ts:layoutGauge]
- [chart-polar.ts:layoutPie]
- [chart-polar.ts:layoutRadar]
- [chart-polar.ts:layoutRadial]
- [chart-scale.ts:linearScale]
- [chart-scale.ts:lttb]
- [chart-scale.ts:monotoneCurve]
- [chart-scale.ts:niceTicks]
- [chart-types.ts:defaultDash]
- [chart-types.ts:defaultMarker]
- [chart-types.ts:defaultPattern]
- [chart-types.ts:slotKey]
- [chart-xy.ts:layoutXY]

## Invariants

- Chart series inputs are automatically capped at MAX_BARS (240) and MAX_POINTS (1500) to ensure rendering performance [chart-build.ts:MAX_BARS]
- Largest-Triangle-Three-Buckets (LTTB) algorithm guarantees retention of boundary points and extrema [chart-scale.ts:lttb]

## Side Effects

- None

## Verification

- Run: npm run build
