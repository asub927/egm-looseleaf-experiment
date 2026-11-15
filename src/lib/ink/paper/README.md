# Looseleaf Paper Simulation

## Overview
Physical paper simulation engine providing edge tearing algorithms, stock definitions, tooth textures, multi-layer drop shadows, desk fasteners (tape, pins, staples, clips), and ruling lines.

## Interface
- [defs.tsx:ensurePaperDefs]
- [defs.tsx:PAPER_DEF_TILES]
- [defs.tsx:PaperDefs]
- [edges.ts:edgeInset]
- [edges.ts:EDGE_KINDS]
- [edges.ts:edgeSides]
- [edges.ts:outlinePath]
- [edges.ts:sheetOutline]
- [faces.ts:faceLook]
- [faces.ts:faceSvg]
- [faces.ts:renderFaces]
- [faces.ts:splitFaces]
- [prop-svg.tsx:PropSvg]
- [props.ts:binderClip]
- [props.ts:clip]
- [props.ts:coffeeRing]
- [props.ts:pin]
- [props.ts:ruler]
- [props.ts:staple]
- [props.ts:stickyCurl]
- [props.ts:tape]
- [props.ts:TAPE_KINDS]
- [shadows.ts:dropShadow]
- [shadows.ts:sheetShadow]
- [shadows.ts:tiltFor]
- [sheet-layers.tsx:SheetLayers]
- [sheet-layers.tsx:useInkFaces]
- [stocks.ts:ruleGeometry]
- [stocks.ts:rulesLayer]
- [stocks.ts:STOCK_NAMES]
- [stocks.ts:stockOf]
- [stocks.ts:STOCKS]

## Invariants
- Edge geometry implements 7 physical edge kinds with closed boundary paths [edges.ts:EDGE_KINDS]
- Paper stocks map deterministically to specific tooth textures and drop shadow profiles [stocks.ts:STOCKS]

## Side Effects
- Dynamically injects paper texture SVG filter elements into the document DOM body [defs.tsx:ensurePaperDefs]

## Verification
- Run: npm run build
