# Icons Art Assets

## Overview
Hand-drawn vector icons collection categorized into domain-specific batches (arrows, marks, status, layout, files, communications, developer tools, media, commerce). Includes name resolution and Lucide-compatible alias mapping.

## Interface
- [aliases.ts:ICON_ALIASES]
- [aliases.ts:kebabIconName]
- [aliases.ts:resolveIconName]
- [arrows.ts:arrows]
- [marks.ts:marks]
- [status.ts:status]
- [layout.ts:layout]
- [files.ts:files]
- [comms.ts:comms]
- [dev-data.ts:devData]
- [text-nature-misc.ts:textNatureMisc]
- [media.ts:media]
- [commerce-time.ts:commerceTime]
- [index.ts:iconBatches]
- [index.ts:icons]
- [index.ts:IconName]

## Invariants
- Primary icon names map to alternative or legacy names via alias table [aliases.ts:ICON_ALIASES]
- All exported icon entries conform to ArtDef specifications [index.ts:icons]

## Side Effects
- Populates reverse alias lookup dictionary during module evaluation [aliases.ts:REVERSE]

## Verification
- Run: npm run build
