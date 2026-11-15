import {
  createNC2OA4Item,
  type NC2OA4Item,
} from "../invariants.ts"

/**
 * Verified NCDPI & OER problem seeds for standard NC.2.OA.4:
 * Rectangular arrays up to 5x5 using repeated addition equations
 * by row and by column.
 */
export const NC2_OA4_SEEDS: readonly NC2OA4Item[] = [
  createNC2OA4Item({
    id: "nc2-oa4-3x4-cookies",
    label: "3x4 (12 cookies)",
    targetRows: 3,
    targetCols: 4,
    context: "cookies",
    itemSingular: "cookie",
    icon: "🍪",
    narrative:
      "Baker Kit baked 12 warm cookies on a sheet. Arrange them into 3 equal rows with 4 cookies in each row!",
  }),
  createNC2OA4Item({
    id: "nc2-oa4-2x5-muffins",
    label: "2x5 (10 muffins)",
    targetRows: 2,
    targetCols: 5,
    context: "muffins",
    itemSingular: "muffin",
    icon: "🧁",
    narrative:
      "Baker Kit pulled 10 blueberry muffins from the oven. Arrange them into 2 equal rows with 5 muffins in each row!",
  }),
  createNC2OA4Item({
    id: "nc2-oa4-3x5-tiles",
    label: "3x5 (15 tiles)",
    targetRows: 3,
    targetCols: 5,
    context: "tiles",
    itemSingular: "tile",
    icon: "🧱",
    narrative:
      "Kit is laying 15 colorful tiles on the craft table. Arrange them into 3 equal rows with 5 tiles in each row!",
  }),
  createNC2OA4Item({
    id: "nc2-oa4-2x4-stamps",
    label: "2x4 (8 stamps)",
    targetRows: 2,
    targetCols: 4,
    context: "stamps",
    itemSingular: "stamp",
    icon: "🏷️",
    narrative:
      "Kit is organizing 8 postage stamps in an album. Arrange them into 2 equal rows with 4 stamps in each row!",
  }),
  createNC2OA4Item({
    id: "nc2-oa4-3x3-biscuits",
    label: "3x3 (9 biscuits)",
    targetRows: 3,
    targetCols: 3,
    context: "biscuits",
    itemSingular: "biscuit",
    icon: "🍘",
    narrative:
      "Kit placed 9 golden biscuits on the baking grid. Arrange them into a square array of 3 equal rows of 3!",
  }),
  createNC2OA4Item({
    id: "nc2-oa4-4x3-brownies",
    label: "4x3 (12 brownies)",
    targetRows: 4,
    targetCols: 3,
    context: "brownies",
    itemSingular: "brownie",
    icon: "🍫",
    narrative:
      "Kit sliced 12 fudge brownies into equal squares. Arrange them into 4 equal rows with 3 brownies in each row!",
  }),
  createNC2OA4Item({
    id: "nc2-oa4-4x2-crackers",
    label: "4x2 (8 crackers)",
    targetRows: 4,
    targetCols: 2,
    context: "crackers",
    itemSingular: "cracker",
    icon: "🥨",
    narrative:
      "Kit served 8 crunchy crackers for snack time. Arrange them into 4 equal rows with 2 crackers in each row!",
  }),
] as const

export const NC2_OA4_ITEMS = [...NC2_OA4_SEEDS]
