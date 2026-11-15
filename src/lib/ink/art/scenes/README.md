# Scenes Art Assets

## Overview

Multi-layered compositional scene definitions combining mascots, paper props, tape, doodles, and ink marks into rich illustrated states (e.g. empty inbox, no data, search results).

## Interface

- [empty-scenes.ts:emptyScenes]
- [index.ts:sceneBatches]
- [index.ts:scenes]
- [index.ts:SceneName]

## Invariants

- Each scene item explicitly specifies kind as 'scene' and provides composite layers [empty-scenes.ts:emptyScenes]
- Primary grid space defaults to 240x180 [empty-scenes.ts:emptyScenes]

## Side Effects

- None

## Verification

- Run: npm run build
