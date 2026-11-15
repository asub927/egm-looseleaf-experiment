# Looseleaf Art Engine

## Overview

Vector art generation, DSL parsing, typography rendering, and asset registry for hand-drawn icons, doodles, stickers, stamps, mascots, and scenes.

## Subdirectories & Boundaries

- [doodles](./doodles/README.md) - Hand-drawn doodle vector art assets organized into nature, things, and marks categories.
- [icons](./icons/README.md) - Hand-drawn vector icons collection categorized into domain-specific batches.
- [mascots](./mascots/README.md) - Procedural mascot generator and pre-configured poses for the pencil/eraser character.
- [props](./props/README.md) - Registry and batch definitions for standalone art prop illustrations.
- [scenes](./scenes/README.md) - Multi-layered compositional scene definitions combining mascots, paper props, and doodles.
- [stickers](./stickers/README.md) - Decorative sticker and rubber-stamp illustrations.

## Interface

- [badge-gen.ts:badgeSkeleton]
- [dsl.ts:ACCENT_KEYS]
- [dsl.ts:BUDGET]
- [dsl.ts:checkPath]
- [dsl.ts:kindOfDef]
- [dsl.ts:parsePath]
- [dsl.ts:polygonsOf]
- [dsl.ts:tokenize]
- [dsl.ts:validateArt]
- [dsl.ts:validateParts]
- [glyph-text.ts:capHeight]
- [glyph-text.ts:hasGlyph]
- [glyph-text.ts:measureText]
- [glyph-text.ts:textPath]
- [glyphs.ts:GLYPH_FONTS]
- [glyphs.ts:GLYPHS_HAND]
- [mascot-draw.ts:drawMascot]
- [mascot-draw.ts:mascotVariant]
- [rubber-stamp.ts:stamp]
- [types.ts:defineDoodle]
- [types.ts:defineDoodles]
- [types.ts:defineIcon]
- [types.ts:defineIcons]
- [types.ts:defineMascot]
- [types.ts:defineProps]
- [types.ts:defineSticker]
- [types.ts:defineStickers]
- [types.ts:isGen]

## Invariants

- Art definitions are validated against structural and command budgets per kind [dsl.ts:validateArt]
- Mascot level of detail scales across size thresholds (<28, <56, <140, >=140) [mascot-draw.ts:mascotVariant]

## Side Effects

- None

## Verification

- Run: npm run build
