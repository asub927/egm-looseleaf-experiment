# Dovetail Joinery: Handcrafted Stained-Wood Physical Math Toy

- **Author:** Technical Design Team & EGM Swarm
- **Status:** Approved (Interactive Showcase Tested · Ready for Implementation)
- **Date:** 2026-11-16
- **Branch:** `feature/hybrid-kids-learning-experience`
- **Target Repository:** `https://github.com/asub927/egm-looseleaf-experiment`
- **Target Standards:** NC.2.OA.2, NC.2.OA.3, NC.2.OA.4, NC.2.G.3 (North Carolina Grade 2 Mathematics)
- **Interactive Prototype:** [`public/dovetail-curriculum-suite.html`](file:///Users/aaranvi/dev/elephant-goldfish/public/dovetail-curriculum-suite.html)

---

## 1. Overview & Core Philosophy

This specification codifies the definitive interaction and visual design for **Elephant-Goldfish**: **The Dovetail Joinery Physical Math Toy**.

By rejecting the "digital worksheet" trap (clunky forms, patronizing cartoon mascots, multiple-choice buttons, and dusty monotone beige palettes), this system recreates the timeless, irresistible tactile appeal of high-end **Grimm's wooden toys**, **Brio railway blocks**, and **Pok Pok Playroom** on modern web hardware:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE DOVETAIL JOINERY ENGINE                           │
├───────────────────────────────────┬─────────────────────────────────────────┤
│ 1. Tactile Metaphor               │ Handcrafted Stained Birch & Walnut Wood │
│ 2. Primary Kinetic Mechanic       │ 3D Elevation Drag + Magnetic Snap Basin │
│ 3. Acoustic Architecture          │ Binaural Wood Block THOCK Synthesizer   │
│ 4. Color as Mathematical Logic    │ Grimm's Vibrant Non-Toxic Wood Stains   │
│ 5. Technical Platform             │ Chrome Modern Web Guidance (PWA/Zero)   │
└───────────────────────────────────┴─────────────────────────────────────────┘
```

The application executes 100% client-side with zero network telemetry (COPPA exempt), maintains a memory footprint $< 120\text{ MB}$ on classroom Chromebooks, and validates all mathematical operations deterministically across 43 invariant test suites in $< 250\text{ ms}`.

---

## 2. The Problems Solved

1. **The Reading Barrier & Executive Fatigue**:
   Second graders (ages 7–8) decode text at approximately 400L. Text prompts, speech bubbles, and instruction paragraphs create cognitive fatigue that distracts from mathematical reasoning. The Dovetail Joinery interface is **100% self-explaining**: carved router recesses and glowing missing insets teach the objective through pure spatial affordances.
2. **The "Monotone Woodshop" Pitfall**:
   Unpainted natural wood looks dusty, neutral, and unappealing to children. By pairing organic wooden grain with **vibrant, jewel-toned and pastel stained pigments** (Strawberry Coral, Sage Mint, Honey Amber, Sky Azure, Royal Lavender), mathematical complements and structures become immediately visible at a glance.
3. **Flaccid Digital Dragging**:
   Standard web drag-and-drop feels flat and frictionless. Dovetail Joinery incorporates **haptic visual physics**:
   - **Elevation Depth**: Touching a piece expands its drop shadow and scales it up ($1.08\times$), simulating picking a physical block up off the workbench.
   - **Magnetic Pull**: Approaching a target recess ($\pm 50\text{px}$) triggers magnetic acceleration into the slot.
   - **The Lock-In Recoil**: The block snaps flush with a micro-recoil impulse and a resonant, binaural acoustic wood block **`THOCK`**.

---

## 3. Vibrant Stained-Wood Color Palette (Grimm's Inspired)

Colors are not arbitrary decorations; they serve as **direct mathematical visual encodings**:

| Stained Wood Tone     | Hex Gradient                      | Psychological & Spatial Role        | Curriculum Application             |
| :-------------------- | :-------------------------------- | :---------------------------------- | :--------------------------------- |
| **Strawberry Coral**  | `#ff6b81` $\rightarrow$ `#ee5253` | Primary active addend / focal block | Known addends ($6$), Array Row 3   |
| **Sage Emerald Mint** | `#2ed573` $\rightarrow$ `#10ac84` | Calming complement / solution block | Missing complement ($4$), Tart 3rd |
| **Sunshine Honey**    | `#ffa502` $\rightarrow$ `#ff7f50` | Warm baseline grouping              | Array Row 1, Parity Right Team     |
| **Blueberry Sky**     | `#70a1ff` $\rightarrow$ `#1e90ff` | Cool secondary row / partner team   | Array Row 2, Parity Active Dowel   |
| **Royal Lavender**    | `#a55eea` $\rightarrow$ `#8854d0` | Structured foundational column      | Parity Left Team (4 pairs)         |
| **Natural Birch**     | `#fdfbf7` $\rightarrow$ `#ece5d8` | Warm, clean workbench surface       | Workbench card & perimeter         |
| **Carved Recess**     | `#e4dcce` + inset shadow          | Milled negative space / snap basin  | Target insets & router pockets     |

---

## 4. The 4 Curriculum Stations

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [ 1. Making Ten (NC.2.OA.2) ]  [ 2. Arrays (NC.2.OA.4) ]  [ 3. Odd/Even ]  [ 4. Geometry ] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Station 1: Ten-Frame Insets (`NC.2.OA.2` — Making Ten & Subtraction)

- **Workbench State**: A $10$-slot milled birch tray. $6$ pockets are filled with flush **Strawberry Coral** stained pegs; $4$ empty router pockets wait on the right.
- **Physical Interaction**: Student picks up the $4$-peg **Sage Emerald Mint** block. It elevates off the table, drops an angled shadow, and snaps into the empty pockets with a deep, resonant wood **`THOCK`**.
- **Mathematical Closure**: $6\text{ (Coral)} + 4\text{ (Mint)} = 10$. The wood grain aligns flush, and the engraved brass badge reveals `10 − 6 = 4 · Inset Completed ✓`.

### Station 2: Interlocking Arrays (`NC.2.OA.4` — $3 \times 4$ Repeated Addition)

- **Workbench State**: A $3 \times 4$ carved wooden tray with $2$ rows of $4$ pegs already locked in (**Row 1: Honey Amber**, **Row 2: Blueberry Sky**).
- **Physical Interaction**: Student drags Row 3 (**Strawberry Coral**). When dropped into the groove, the dovetail teeth mesh with a **rapid triple-thock cascade** (`thock-thock-thock`), locking all 3 rows into a single solid wooden matrix.
- **Mathematical Closure**: Distinct colored rows make repeated addition instantly perceptible: `4 (Honey) + 4 (Blue) + 4 (Coral) = 12 · 3 Rows of 4`.

### Station 3: Odd & Even Parity (`NC.2.OA.3` — Equal Partner Columns)

- **Workbench State**: Two vertical carved tracks. Left column has $4$ **Royal Lavender** pegs. Right column has $3$ **Sunshine Honey** pegs.
- **Physical Interaction**: Student drags a loose **Blueberry Sky** dowel. Bringing it toward the empty right socket triggers magnetic pull and locks with a crisp wooden snap.
- **Mathematical Closure**: The two columns balance into $4$ symmetrical pairs. The engraved badge confirms `8 is EVEN · Symmetrical Pairs (4 + 4) ✓`. If an odd number is tested, the lone peg sits protruding without a partner.

### Station 4: Geometry Equal Partitioning (`NC.2.G.3` — Circular Thirds)

- **Workbench State**: A circular routed pie pan with two $\frac{1}{3}$ wedges seated (**Strawberry Coral** and **Blueberry Sky**). The remaining $120^\circ$ sector is open.
- **Physical Interaction**: Student picks up the curved **Matcha Mint** wedge, centers it over the pan, and releases. It magnetic-snaps flush against the existing wedges with zero seam tolerance.
- **Mathematical Closure**: Forms an unbroken, tripartite stained-wood circle: `1/3 + 1/3 + 1/3 = 1 Whole Pan ✓`.

---

## 5. Acoustic Synthesis Architecture

The sound engine is 100% procedural Web Audio (zero external `.mp3` assets, zero latency, offline reliable):

```typescript
// Procedural Wood Block Synthesizer
function playWoodThock(pitchMultiplier = 1.0) {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()

  // Pitch envelope: Fast decay from 440Hz to 150Hz in 70ms
  const baseFreq = 440 * pitchMultiplier
  osc.frequency.setValueAtTime(baseFreq, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.35, ctx.currentTime + 0.07)

  // Bandpass filter centered at 560Hz (Q = 7.0) for hollow wood resonance
  filter.type = "bandpass"
  filter.frequency.setValueAtTime(560 * pitchMultiplier, ctx.currentTime)
  filter.Q.setValueAtTime(7.0, ctx.currentTime)

  // Fast exponential amplitude decay
  gain.gain.setValueAtTime(0.75, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  osc.start()
  osc.stop(ctx.currentTime + 0.12)
}
```

---

## 6. Implementation Architecture & File Partitioning

The React 19 application will be structured around these dedicated components:

```
src/
 ├── components/math/dovetail/
 │    ├── DovetailWorkbench.tsx       (Central workbench stage & aspect ratio container)
 │    ├── TenFrameInsetStation.tsx    (NC.2.OA.2 Complements of 10)
 │    ├── InterlockingArrayStation.tsx(NC.2.OA.4 Array slats with cascade thocks)
 │    ├── ParityBalanceStation.tsx    (NC.2.OA.3 Dual-channel partner columns)
 │    ├── GeometricTartStation.tsx    (NC.2.G.3 Circular & rectangular wedges)
 │    └── DovetailDraggable.tsx       (Elevation shadow & magnetic pointer engine)
 │
 ├── lib/audio/
 │    └── wood-thock-synth.ts         (Procedural Web Audio wood block synthesizer)
 │
 └── App.tsx                          (Mounts DovetailWorkbench as the primary experience)
```

---

## 7. Universal Verification Matrix

All implementations must satisfy the non-negotiable repository gates:

```bash
# Gate 1: Pure Mathematical Invariants (< 250 ms budget in Node 26)
npm test

# Gate 2: Static Oxlint Quality (0 errors across 380+ files)
npm run lint

# Gate 3: TypeScript Type-Safety (tsc -b)
npm run typecheck

# Gate 4: Production Compilation (Vite 8 release build)
npm run build

# Composite Gate
npm run check
```
