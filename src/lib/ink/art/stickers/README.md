# Stickers Art Assets

## Overview

Decorative sticker and rubber-stamp illustrations covering status markers, desk items, badges, celebrations, animals, and weather. Supports both vector drawing definitions and procedural stamp generation.

## Interface

- [status-pointers.ts:statusPointers]
- [space-weather.ts:spaceWeather]
- [food-drink.ts:foodDrink]
- [office-desk.ts:officeDesk]
- [nature-animals.ts:natureAnimals]
- [faces-celebrate.ts:facesCelebrate]
- [badges-stamps.ts:badgesStamps]
- [index.ts:stickerBatches]
- [index.ts:stickers]
- [index.ts:StickerName]

## Invariants

- All sticker elements satisfy the StickerDef contract [index.ts:stickers]
- Procedural stamps provide valid shape, dimensions, and textual parameters [badges-stamps.ts:badgesStamps]

## Side Effects

- None

## Verification

- Run: npm run build
