# Core Library

## Overview
Shared client utilities, message scroller primitives, syntax highlighting, menu styles, sketch raster export, and the core looseleaf procedural ink rendering engine.

## Subdirectories & Boundaries
- [audio](./audio) - Web Audio procedural sound effect synthesizer and speech synthesis helpers. [audio-bus.ts](./audio/audio-bus.ts), [sfx.ts](./audio/sfx.ts)
- [ink](./ink/README.md) - Core procedural sketching and rendering engine producing organic, hand-drawn vector graphics, paper simulations, and UI components.
- [math](./math) - Headless mathematical diagnostic evaluators for NC.2.OA.3 parity and NC.2.OA.4 rectangular array standards. [evaluator.ts](./math/evaluator.ts)
- [storage](./storage) - COPPA-compliant anonymous local student profile storage. [profile.ts](./storage/profile.ts)

## Interface
- [audio/audio-bus.ts:audioBus]
- [audio/audio-bus.ts:AudioBusController]
- [audio/audio-bus.ts:VoiceBus]
- [audio/audio-bus.ts:SfxBus]
- [audio/audio-bus.ts:cleanSpeechText]
- [audio/audio-bus.ts:unlockAudioContext]
- [audio/sfx.ts:playStampThud]
- [audio/sfx.ts:playPickupChirp]
- [audio/sfx.ts:playNudgeTone]
- [audio/sfx.ts:playVictoryFanfare]
- [audio/sfx.ts:speakSpeech]
- [audio/sfx.ts:cancelSpeech]
- [chat-align.ts:ChatAlignContext]
- [chat-align.ts:useChatAlign]
- [code-highlight.ts:diffResult]
- [code-highlight.ts:diffStats]
- [code-highlight.ts:langFromFileName]
- [code-highlight.ts:normaliseLang]
- [code-highlight.ts:parseDiff]
- [code-highlight.ts:tokenize]
- [code-highlight.ts:tokenizeLines]
- [field-class.ts:splitFieldClass]
- [math/evaluator.ts:evaluateArrayGrid]
- [math/evaluator.ts:evaluatePairingMat]
- [math/evaluator.ts:ArrayProblemSpec]
- [math/evaluator.ts:ArrayDiagnostic]
- [math/evaluator.ts:ParityProblemSpec]
- [math/evaluator.ts:PairingSlot]
- [math/evaluator.ts:ParityDiagnostic]
- [menu-styles.ts:MENU_CHOICE_ITEM]
- [menu-styles.ts:MENU_INDICATOR]
- [menu-styles.ts:MENU_ITEM]
- [menu-styles.ts:MENU_KEYCAP]
- [menu-styles.ts:MENU_LABEL]
- [menu-styles.ts:MENU_MARK]
- [menu-styles.ts:MENU_SEPARATOR]
- [menu-styles.ts:MENU_SHORTCUT]
- [menu-styles.ts:MENU_SUB_TRIGGER]
- [menu-styles.ts:menuContentClass]
- [menu-styles.ts:menuViewportClass]
- [menu-styles.ts:parseShortcut]
- [menu-styles.ts:splitMenuClass]
- [message-scroller-primitive.tsx:MessageScroller]
- [message-scroller-primitive.tsx:useMessageScroller]
- [message-scroller-primitive.tsx:useMessageScrollerScrollable]
- [message-scroller-primitive.tsx:useMessageScrollerVisibility]
- [sketch-export.ts:svgToPngDataUrl]
- [utils.ts:cn]

## Invariants
- Code tokenizer normalizes unrecognized languages to plain text representation [code-highlight.ts:tokenize]
- SVG-to-PNG export times out gracefully after 4000ms if image rasterization hangs [sketch-export.ts:svgToPngDataUrl]

## Side Effects
- Asynchronously creates DOM Image and Canvas elements to perform client-side raster image conversion [sketch-export.ts:svgToPngDataUrl]

## Verification
- Run: npm run build
