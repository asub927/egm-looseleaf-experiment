# Mascots Art Assets

## Overview
Procedural mascot generator and pre-configured poses for the pencil/eraser character. Supplies body geometry, facial features, accessories, props, and affine transforms for multi-tiered rendering.

## Interface
- [body.ts:BASE]
- [body.ts:BODY_K]
- [body.ts:bodyParts]
- [body.ts:faceParts]
- [body.ts:pose]
- [body.ts:xf]
- [poses.ts:poses]
- [props.ts:propDefs]
- [props.ts:frames]
- [index.ts:mascotBatches]
- [index.ts:mascot]
- [index.ts:MascotPose]
- [index.ts:mascotBody]
- [index.ts:mascotProps]

## Invariants
- Mascot base coordinates align to fixed origin point `[32.4, 67.4]` [body.ts:BASE]
- Mascot pose definitions conform to ArtDef across tiers [body.ts:pose]

## Side Effects
- None

## Verification
- Run: npm run build
