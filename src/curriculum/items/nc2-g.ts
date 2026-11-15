import { createNC2GItem, type NC2GItem } from "../invariants.ts"

/**
 * Verified NCDPI problem seeds for standard NC.2.G.3:
 * Partitioning circles and rectangles into 2, 3, or 4 equal shares (halves, thirds, fourths).
 */
export const NC2_G_SEEDS: readonly NC2GItem[] = [
  createNC2GItem({
    id: "nc2-g-halves-brownies",
    label: "2 Halves (Brownie Pan)",
    shapeType: "rectangle",
    targetShares: 2,
    context: "brownies",
    itemSingular: "brownie",
    icon: "🍫",
    narrative:
      "Baker Kit baked a warm pan of brownies! Cut the pan into 2 equal halves for 2 friends.",
  }),
  createNC2GItem({
    id: "nc2-g-thirds-cake",
    label: "3 Thirds (Sheet Cake)",
    shapeType: "rectangle",
    targetShares: 3,
    context: "sheet cake",
    itemSingular: "slice",
    icon: "🍰",
    narrative:
      "Kit baked a delicious sheet cake for the school fair! Cut the cake into 3 equal thirds.",
  }),
  createNC2GItem({
    id: "nc2-g-fourths-sheet",
    label: "4 Fourths (Brownie Pan)",
    shapeType: "rectangle",
    targetShares: 4,
    context: "brownies",
    itemSingular: "brownie",
    icon: "🍫",
    narrative:
      "Baker Kit made a big batch of fudge brownies! Partition the pan into 4 equal fourths.",
  }),
  createNC2GItem({
    id: "nc2-g-halves-cornbread",
    label: "2 Halves (Cornbread)",
    shapeType: "rectangle",
    targetShares: 2,
    context: "cornbread",
    itemSingular: "square",
    icon: "🍞",
    narrative:
      "Kit baked golden cornbread in a rectangular pan. Cut the pan into 2 equal halves.",
  }),
  createNC2GItem({
    id: "nc2-g-halves-pizza",
    label: "2 Halves (Personal Pizza)",
    shapeType: "circle",
    targetShares: 2,
    context: "pizza",
    itemSingular: "slice",
    icon: "🍕",
    narrative:
      "Baker Kit pulled a hot round pizza from the oven! Cut the pizza into 2 equal halves.",
  }),
  createNC2GItem({
    id: "nc2-g-thirds-tart",
    label: "3 Thirds (Fruit Tart)",
    shapeType: "circle",
    targetShares: 3,
    context: "fruit tart",
    itemSingular: "wedge",
    icon: "🥧",
    narrative:
      "Kit prepared a berry fruit tart! Divide the tart into 3 equal thirds for a picnic.",
  }),
  createNC2GItem({
    id: "nc2-g-fourths-pie",
    label: "4 Fourths (Berry Pie)",
    shapeType: "circle",
    targetShares: 4,
    context: "berry pie",
    itemSingular: "slice",
    icon: "🫐",
    narrative:
      "Baker Kit baked a sweet blueberry pie! Divide the pie into 4 equal fourths.",
  }),
  createNC2GItem({
    id: "nc2-g-fourths-cookie",
    label: "4 Fourths (Giant Cookie)",
    shapeType: "circle",
    targetShares: 4,
    context: "giant cookie",
    itemSingular: "piece",
    icon: "🍪",
    narrative:
      "Kit baked an enormous round chocolate chip cookie! Cut it into 4 equal fourths to share.",
  }),
]
