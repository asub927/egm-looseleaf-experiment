# Looseleaf Ink System

## Overview
Core procedural sketching and rendering engine that produces organic, hand-drawn vector graphics, paper simulations, textures, strokes, and UI components.

## Subdirectories & Boundaries
- [art](./art/README.md) - Vector art generation, DSL parsing, typography rendering, and asset registry.
- [charts](./charts/README.md) - Chart layout calculation, data scaling, downsampling (LTTB), and mathematical layout engines.
- [paper](./paper/README.md) - Physical paper simulation engine providing edge tearing algorithms, stock definitions, and shadows.
- [react](./react/README.md) - React integration for the ink engine, providing context providers, hooks, and frame caching.
- [recipes](./recipes/README.md) - Component drawing recipes providing hand-drawn visual representations for UI widgets.

## Interface
- [art-draw.ts:dieCut]
- [art-draw.ts:drawSkeleton]
- [art-draw.ts:paintSkeleton]
- [art-draw.ts:renderSticker]
- [builder.ts:GRAINS]
- [builder.ts:Ink]
- [builder.ts:inkViewBox]
- [builder.ts:maskId]
- [builder.ts:maskPhase]
- [fills.ts:bandFill]
- [fills.ts:blobFill]
- [fills.ts:clipFill]
- [fills.ts:flatFill]
- [fills.ts:hatch]
- [fills.ts:solidFill]
- [fills.ts:wash]
- [geom.ts:boundsOf]
- [geom.ts:chaikin]
- [geom.ts:dist]
- [geom.ts:lerp]
- [geom.ts:offsetPoly]
- [geom.ts:polyLength]
- [geom.ts:resamplePoly]
- [geom.ts:simplifyPoly]
- [noise.ts:curl2d]
- [noise.ts:fbm2d]
- [noise.ts:noiseGrain]
- [noise.ts:simplex2d]
- [noise.ts:turb2d]
- [paint.ts:hexOf]
- [paint.ts:PAINT_KEYS]
- [paint.ts:PAINTS]
- [paint.ts:resolvePaint]
- [pen.ts:applyTaper]
- [pen.ts:strokePath]
- [pen.ts:wobbleSegment]
- [pens.ts:PEN_NAMES]
- [pens.ts:penOf]
- [pens.ts:PENS]
- [rng.ts:createRng]
- [rng.ts:hashString]
- [rng.ts:rngFor]
- [shapes.ts:arc]
- [shapes.ts:arrow]
- [shapes.ts:circle]
- [shapes.ts:ellipse]
- [shapes.ts:line]
- [shapes.ts:polygon]
- [shapes.ts:rect]
- [shapes.ts:star]
- [textures.ts:textureCss]
- [textures.ts:TEXTURES]

## Invariants
- Pseudorandom number generators seeded with the same seed yield deterministic numeric sequences [rng.ts:createRng]
- Generated SVG paths maintain bounded coordinates conforming to the calculated bounding box [builder.ts:Ink]

## Side Effects
- None

## Verification
- Run: npm run build
