import { createNC2OA3Item, type NC2OA3Item } from "../invariants.ts"

/**
 * Verified NCDPI & OER problem seeds for standard NC.2.OA.3:
 * Determining odd and even parity within 20 by pairing objects and
 * identifying equal addends or leftover singletons.
 */
export const NC2_OA3_SEEDS: readonly NC2OA3Item[] = [
  createNC2OA3Item({
    id: "nc2-oa3-7-acorns",
    label: "7 Acorns",
    totalTokens: 7,
    context: "acorns",
    itemSingular: "acorn",
    icon: "🌰",
    strategy: "pairing",
    narrative:
      "Kit found 7 acorns under the big oak tree. Pair them up side-by-side to see if 7 is even or odd!",
  }),
  createNC2OA3Item({
    id: "nc2-oa3-8-carrots",
    label: "8 Carrots",
    totalTokens: 8,
    context: "carrots",
    itemSingular: "carrot",
    icon: "🥕",
    strategy: "pairing",
    narrative:
      "Kit harvested 8 crunchy carrots from the garden. Pair them up to see if every carrot finds a buddy!",
  }),
  createNC2OA3Item({
    id: "nc2-oa3-11-blueberries",
    label: "11 Blueberries",
    totalTokens: 11,
    context: "blueberries",
    itemSingular: "blueberry",
    icon: "🫐",
    strategy: "pairing",
    narrative:
      "Kit picked 11 plump blueberries for breakfast. Pair them up to see if 11 has an extra berry left over!",
  }),
  createNC2OA3Item({
    id: "nc2-oa3-12-shells",
    label: "12 Shells",
    totalTokens: 12,
    context: "shells",
    itemSingular: "shell",
    icon: "🐚",
    strategy: "pairing",
    narrative:
      "Kit gathered 12 smooth shells by the seashore. Pair them up into two equal groups to check their parity!",
  }),
  createNC2OA3Item({
    id: "nc2-oa3-15-buttons",
    label: "15 Buttons",
    totalTokens: 15,
    context: "buttons",
    itemSingular: "button",
    icon: "🔘",
    strategy: "pairing",
    narrative:
      "Kit organized 15 craft buttons in the jar. Can every button find a partner, or is one left alone?",
  }),
  createNC2OA3Item({
    id: "nc2-oa3-16-seeds",
    label: "16 Seeds",
    totalTokens: 16,
    context: "seeds",
    itemSingular: "seed",
    icon: "🌱",
    strategy: "pairing",
    narrative:
      "Kit counted 16 sunflower seeds ready for planting. Match them up in pairs to see if 16 is even or odd!",
  }),
  createNC2OA3Item({
    id: "nc2-oa3-19-beads",
    label: "19 Beads",
    totalTokens: 19,
    context: "beads",
    itemSingular: "bead",
    icon: "📿",
    strategy: "pairing",
    narrative:
      "Kit sorted 19 wooden beads for a necklace. Pair them up side-by-side to see if any bead is left over!",
  }),
  createNC2OA3Item({
    id: "nc2-oa3-20-gems",
    label: "20 Gems",
    totalTokens: 20,
    context: "gems",
    itemSingular: "gem",
    icon: "💎",
    strategy: "pairing",
    narrative:
      "Kit uncovered 20 sparkling gems in the chest. Pair them all up to see if 20 forms two equal groups!",
  }),
] as const

export const NC2_OA3_ITEMS = [...NC2_OA3_SEEDS]
