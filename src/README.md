# Application Source (`src`)

## Overview
Root application source tree for the Looseleaf UI showcase application, configuring the top-level React root mount, global providers (`InkProvider`, `TooltipProvider`, `Toaster`), global typography/CSS styling, and demo application shell.

## Subdirectories & Boundaries
- components: [./components/README.md](./components/README.md) - UI building blocks, interactive widgets, tactile stationery components, and NC.2.OA math wireframes (`components/math`).
- hooks: [./hooks/README.md](./hooks/README.md) - React hooks for responsive detection, motion preferences, paper styling, and ink layout measurements.
- lib: [./lib/README.md](./lib/README.md) - Shared client utilities, procedural ink engine, headless math diagnostic evaluators (`lib/math`), and procedural Web Audio synthesizers (`lib/audio`).

## Interface
- `App()`: Default React application showcase component rendering interactive controls, cards, and stationery notes. [src/App.tsx:App]
- Client Root Mount: React 19 root bootstrap mounting `<App />` within `<StrictMode>`, `<InkProvider>`, `<TooltipProvider>`, and `<Toaster />`. [src/main.tsx:createRoot]

## Invariants
- `main.tsx` requires an HTML root container element with `id="root"` present in the DOM. [src/main.tsx:getElementById]
- `App` requires being rendered within an `<InkProvider>` context to resolve procedural ink shaders and textures properly. [src/main.tsx:InkProvider]

## Side Effects
- Invokes `createRoot` and synchronously renders the virtual DOM tree into `document.getElementById('root')`. [src/main.tsx:createRoot]

## Verification
- Run: npm run build
