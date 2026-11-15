# Doodles Art Assets

## Overview
Hand-drawn doodle vector art assets organized into nature, things, and marks categories. Provides predefined vector shapes conforming to `ArtDef` for decorative and expressive UI accents.

## Interface
- [nature.ts:nature]
- [marks.ts:marks]
- [things.ts:things]
- [index.ts:doodleBatches]
- [index.ts:doodles]
- [index.ts:DoodleName]

## Invariants
- All doodle records satisfy the ArtDef specification [index.ts:doodles]
- Doodle coordinate grid defaults to 64x64 coordinate spaces [nature.ts:nature]

## Side Effects
- None

## Verification
- Run: npm run build
