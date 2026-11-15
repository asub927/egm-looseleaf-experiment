# Looseleaf React Bindings

## Overview

React integration for the looseleaf ink engine, providing context providers, layout hooks, canvas/SVG rendering primitives, and an in-memory frame cache.

## Interface

- [cache.ts:bucketBox]
- [cache.ts:frameKey]
- [cache.ts:frameSvg]
- [cache.ts:inkCache]
- [cache.ts:inkFrame]
- [defs.tsx:ensureInkDefs]
- [defs.tsx:ensureInkFonts]
- [defs.tsx:InkDefs]
- [defs.tsx:InkTiles]
- [defs.tsx:KEVIN_SANS_CSS]
- [ensure-defs.ts:useEnsureInkDefs]
- [hooks.ts:DEFAULT_INK_CONTEXT]
- [hooks.ts:InkContext]
- [hooks.ts:mergeRefs]
- [hooks.ts:useDensity]
- [hooks.ts:useInk]
- [hooks.ts:useInkBox]
- [hooks.ts:useInkContext]
- [hooks.ts:useInkCore]
- [hooks.ts:useInkKnobs]
- [hooks.ts:useInkScope]
- [hooks.ts:useInkSeed]
- [hooks.ts:useInkTier]
- [hooks.ts:useMergedRef]
- [icon-size.ts:IconSizeContext]
- [icon-size.ts:useIconSize]
- [ink-layer.tsx:Ink]
- [provider.tsx:InkProvider]
- [svg.tsx:InkSvg]

## Invariants

- Rendered SVG frames are cached by deterministic input keys using bucketed box dimensions [cache.ts:inkCache]
- Hooks fall back to default context values when invoked outside an InkProvider hierarchy [hooks.ts:DEFAULT_INK_CONTEXT]

## Side Effects

- Injects global SVG definition elements into document body when defs are required [defs.tsx:ensureInkDefs]
- Injects external font stylesheet link into document head [defs.tsx:ensureInkFonts]

## Verification

- Run: npm run build
