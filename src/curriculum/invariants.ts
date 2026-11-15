/**
 * Strongly typed schema and validation invariants for NCDPI Unpacked Content:
 * - NC.2.OA.3: Determining odd and even parity within 20.
 * - NC.2.OA.4: Rectangular arrays with up to 5 rows and 5 columns.
 * - NC.2.G.3: Partitioning circles and rectangles into halves, thirds, and fourths.
 *
 * Designed for offline, client-side, zero-PII tactile math manipulatives.
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ============================================================================
// NC.2.OA.3: Odd and Even Parity (up to 20)
// ============================================================================

export type ParityStrategy = "pairing" | "two_equal_groups"

export interface NC2OA3Item {
  id: string
  standard: "NC.2.OA.3"
  label: string
  totalTokens: number // Standard constraint: 1..20
  context: string // e.g. "acorns", "carrots", "blueberries"
  itemSingular?: string // e.g. "acorn", "carrot"
  narrative: string // Contextual narrative prompt for Socratic voice / dialogue
  strategy: ParityStrategy
  expectedPairs: number // Math.floor(totalTokens / 2)
  leftover: number // totalTokens % 2 (0 or 1)
  isEven: boolean // totalTokens % 2 === 0
  equation: string // e.g. "4 + 4 = 8" or "3 + 3 + 1 = 7"
  equationAddends?: string // e.g. "4 + 4 = 8"
  icon?: string // Visual emoji / token representation
}

export interface CreateNC2OA3ItemParams {
  id: string
  label?: string
  totalTokens: number
  context: string
  itemSingular?: string
  narrative: string
  strategy?: ParityStrategy
  icon?: string
}

/**
 * Factory helper to construct a verified NC2OA3Item with auto-computed math fields.
 */
export function createNC2OA3Item(params: CreateNC2OA3ItemParams): NC2OA3Item {
  const strategy = params.strategy ?? "pairing"
  const expectedPairs = Math.floor(params.totalTokens / 2)
  const leftover = params.totalTokens % 2
  const isEven = leftover === 0
  const equation = isEven
    ? `${expectedPairs} + ${expectedPairs} = ${params.totalTokens}`
    : `${expectedPairs} + ${expectedPairs} + 1 = ${params.totalTokens}`
  const equationAddends = isEven
    ? `${expectedPairs} + ${expectedPairs} = ${params.totalTokens}`
    : undefined
  const label = params.label ?? `${params.totalTokens} ${params.context}`

  const item: NC2OA3Item = {
    id: params.id,
    standard: "NC.2.OA.3",
    label,
    totalTokens: params.totalTokens,
    context: params.context,
    itemSingular: params.itemSingular,
    narrative: params.narrative,
    strategy,
    expectedPairs,
    leftover,
    isEven,
    equation,
    equationAddends,
    icon: params.icon,
  }

  assertValidNC2OA3Item(item)
  return item
}

/**
 * Validates whether an object strictly adheres to NC.2.OA.3 curriculum bounds.
 */
export function validateNC2OA3Item(item: unknown): ValidationResult {
  const errors: string[] = []

  if (!item || typeof item !== "object") {
    return { valid: false, errors: ["Item must be a non-null object."] }
  }

  const candidate = item as Partial<NC2OA3Item>

  // 1. Standard identifier
  if (candidate.standard !== "NC.2.OA.3") {
    errors.push(`Standard must be 'NC.2.OA.3', got '${candidate.standard}'.`)
  }

  // 2. ID and Strings
  if (!candidate.id || typeof candidate.id !== "string" || candidate.id.trim().length === 0) {
    errors.push("Item 'id' must be a non-empty string.")
  }
  if (
    !candidate.context ||
    typeof candidate.context !== "string" ||
    candidate.context.trim().length === 0
  ) {
    errors.push("Item 'context' must be a non-empty string.")
  }
  if (
    !candidate.narrative ||
    typeof candidate.narrative !== "string" ||
    candidate.narrative.trim().length === 0
  ) {
    errors.push("Item 'narrative' must be a non-empty string.")
  }

  // 3. Strategy bounds
  if (candidate.strategy !== "pairing" && candidate.strategy !== "two_equal_groups") {
    errors.push(`Strategy must be 'pairing' or 'two_equal_groups', got '${candidate.strategy}'.`)
  }

  // 4. Token bounds (1..20 per NC.2.OA.3 unpacking standard)
  if (typeof candidate.totalTokens !== "number" || !Number.isInteger(candidate.totalTokens)) {
    errors.push("totalTokens must be an integer.")
  } else if (candidate.totalTokens < 1 || candidate.totalTokens > 20) {
    errors.push(`NC.2.OA.3 totalTokens must be between 1 and 20, got ${candidate.totalTokens}.`)
  } else {
    // Math Invariants
    const expectedPairs = Math.floor(candidate.totalTokens / 2)
    const expectedLeftover = candidate.totalTokens % 2
    const expectedIsEven = expectedLeftover === 0

    if (candidate.expectedPairs !== expectedPairs) {
      errors.push(
        `expectedPairs must be ${expectedPairs} for totalTokens ${candidate.totalTokens}, got ${candidate.expectedPairs}.`,
      )
    }

    if (candidate.leftover !== expectedLeftover) {
      errors.push(
        `leftover must be ${expectedLeftover} for totalTokens ${candidate.totalTokens}, got ${candidate.leftover}.`,
      )
    }

    if (candidate.isEven !== expectedIsEven) {
      errors.push(
        `isEven must be ${expectedIsEven} for totalTokens ${candidate.totalTokens}, got ${candidate.isEven}.`,
      )
    }

    const expectedEquation = expectedIsEven
      ? `${expectedPairs} + ${expectedPairs} = ${candidate.totalTokens}`
      : `${expectedPairs} + ${expectedPairs} + 1 = ${candidate.totalTokens}`

    if (candidate.equation !== expectedEquation) {
      errors.push(`equation must be '${expectedEquation}', got '${candidate.equation}'.`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function assertValidNC2OA3Item(item: unknown): asserts item is NC2OA3Item {
  const result = validateNC2OA3Item(item)
  if (!result.valid) {
    throw new Error(`NC2OA3Item Validation Error:\n - ${result.errors.join("\n - ")}`)
  }
}

// ============================================================================
// NC.2.OA.4: Rectangular Arrays (up to 5x5)
// ============================================================================

export interface NC2OA4Item {
  id: string
  standard: "NC.2.OA.4"
  label: string
  targetRows: number // 1..5
  targetCols: number // 1..5
  totalTokens: number // targetRows * targetCols (up to 25)
  context: string // e.g. "cookies", "muffins", "tiles"
  itemSingular?: string // e.g. "cookie", "muffin"
  narrative: string // Contextual narrative prompt
  repeatedAdditionEquation: string // Row equation by default, e.g. "4 + 4 + 4 = 12"
  equationRow: string // e.g. "4 + 4 + 4 = 12"
  equationCol: string // e.g. "3 + 3 + 3 + 3 = 12"
  icon?: string // Visual emoji / token representation
}

export interface CreateNC2OA4ItemParams {
  id: string
  label?: string
  targetRows: number
  targetCols: number
  context: string
  itemSingular?: string
  narrative: string
  icon?: string
}

/**
 * Factory helper to construct a verified NC2OA4Item with auto-computed math fields.
 */
export function createNC2OA4Item(params: CreateNC2OA4ItemParams): NC2OA4Item {
  const totalTokens = params.targetRows * params.targetCols
  const equationRow = `${Array(params.targetRows).fill(params.targetCols).join(" + ")} = ${totalTokens}`
  const equationCol = `${Array(params.targetCols).fill(params.targetRows).join(" + ")} = ${totalTokens}`
  const repeatedAdditionEquation = equationRow
  const label =
    params.label ?? `${params.targetRows}x${params.targetCols} (${totalTokens} ${params.context})`

  const item: NC2OA4Item = {
    id: params.id,
    standard: "NC.2.OA.4",
    label,
    targetRows: params.targetRows,
    targetCols: params.targetCols,
    totalTokens,
    context: params.context,
    itemSingular: params.itemSingular,
    narrative: params.narrative,
    repeatedAdditionEquation,
    equationRow,
    equationCol,
    icon: params.icon,
  }

  assertValidNC2OA4Item(item)
  return item
}

/**
 * Validates whether an object strictly adheres to NC.2.OA.4 curriculum bounds.
 */
export function validateNC2OA4Item(item: unknown): ValidationResult {
  const errors: string[] = []

  if (!item || typeof item !== "object") {
    return { valid: false, errors: ["Item must be a non-null object."] }
  }

  const candidate = item as Partial<NC2OA4Item>

  // 1. Standard identifier
  if (candidate.standard !== "NC.2.OA.4") {
    errors.push(`Standard must be 'NC.2.OA.4', got '${candidate.standard}'.`)
  }

  // 2. ID and Strings
  if (!candidate.id || typeof candidate.id !== "string" || candidate.id.trim().length === 0) {
    errors.push("Item 'id' must be a non-empty string.")
  }
  if (
    !candidate.context ||
    typeof candidate.context !== "string" ||
    candidate.context.trim().length === 0
  ) {
    errors.push("Item 'context' must be a non-empty string.")
  }
  if (
    !candidate.narrative ||
    typeof candidate.narrative !== "string" ||
    candidate.narrative.trim().length === 0
  ) {
    errors.push("Item 'narrative' must be a non-empty string.")
  }

  // 3. Grid dimension bounds (1..5 rows, 1..5 cols per NC.2.OA.4 standard)
  let validDims = true
  if (typeof candidate.targetRows !== "number" || !Number.isInteger(candidate.targetRows)) {
    errors.push("targetRows must be an integer.")
    validDims = false
  } else if (candidate.targetRows < 1 || candidate.targetRows > 5) {
    errors.push(`targetRows must be between 1 and 5, got ${candidate.targetRows}.`)
    validDims = false
  }

  if (typeof candidate.targetCols !== "number" || !Number.isInteger(candidate.targetCols)) {
    errors.push("targetCols must be an integer.")
    validDims = false
  } else if (candidate.targetCols < 1 || candidate.targetCols > 5) {
    errors.push(`targetCols must be between 1 and 5, got ${candidate.targetCols}.`)
    validDims = false
  }

  if (validDims && candidate.targetRows && candidate.targetCols) {
    const expectedTotal = candidate.targetRows * candidate.targetCols
    if (candidate.totalTokens !== expectedTotal) {
      errors.push(
        `totalTokens must equal targetRows * targetCols (${expectedTotal}), got ${candidate.totalTokens}.`,
      )
    }

    const expectedEquationRow = `${Array(candidate.targetRows).fill(candidate.targetCols).join(" + ")} = ${expectedTotal}`
    const expectedEquationCol = `${Array(candidate.targetCols).fill(candidate.targetRows).join(" + ")} = ${expectedTotal}`

    if (candidate.equationRow !== expectedEquationRow) {
      errors.push(`equationRow must be '${expectedEquationRow}', got '${candidate.equationRow}'.`)
    }

    if (candidate.equationCol !== expectedEquationCol) {
      errors.push(`equationCol must be '${expectedEquationCol}', got '${candidate.equationCol}'.`)
    }

    if (
      candidate.repeatedAdditionEquation !== candidate.equationRow &&
      candidate.repeatedAdditionEquation !== candidate.equationCol
    ) {
      errors.push(
        `repeatedAdditionEquation must match equationRow ('${expectedEquationRow}') or equationCol ('${expectedEquationCol}').`,
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function assertValidNC2OA4Item(item: unknown): asserts item is NC2OA4Item {
  const result = validateNC2OA4Item(item)
  if (!result.valid) {
    throw new Error(`NC2OA4Item Validation Error:\n - ${result.errors.join("\n - ")}`)
  }
}

// ============================================================================
// NC.2.G.3: Partitioning Circles and Rectangles (Halves, Thirds, Fourths)
// ============================================================================

export type GeometryShapeType = "rectangle" | "circle"
export type GeometryShareCount = 2 | 3 | 4 // Halves, Thirds, Fourths

export interface NC2GItem {
  id: string
  standard: "NC.2.G.3"
  label: string
  shapeType: GeometryShapeType
  targetShares: GeometryShareCount
  context: string // e.g. "brownies", "sheet cake", "pizza", "fruit tart"
  itemSingular?: string // e.g. "brownie", "slice", "wedge"
  narrative: string // Contextual narrative prompt
  verbalShareName: "halves" | "thirds" | "fourths"
  equation: string // e.g. "2 halves = 1 whole"
  icon?: string // Visual emoji representation
}

export interface CreateNC2GItemParams {
  id: string
  label?: string
  shapeType: GeometryShapeType
  targetShares: GeometryShareCount
  context: string
  itemSingular?: string
  narrative: string
  verbalShareName?: "halves" | "thirds" | "fourths"
  equation?: string
  icon?: string
}

/**
 * Factory helper to construct a verified NC2GItem with auto-computed math fields.
 */
export function createNC2GItem(params: CreateNC2GItemParams): NC2GItem {
  const verbalShareName =
    params.verbalShareName ??
    (params.targetShares === 2 ? "halves" : params.targetShares === 3 ? "thirds" : "fourths")
  const equation = params.equation ?? `${params.targetShares} ${verbalShareName} = 1 whole`
  const label = params.label ?? `${params.targetShares} ${verbalShareName} (${params.context})`

  const item: NC2GItem = {
    id: params.id,
    standard: "NC.2.G.3",
    label,
    shapeType: params.shapeType,
    targetShares: params.targetShares,
    context: params.context,
    itemSingular: params.itemSingular,
    narrative: params.narrative,
    verbalShareName,
    equation,
    icon: params.icon,
  }

  assertValidNC2GItem(item)
  return item
}

/**
 * Validates whether an object strictly adheres to NC.2.G.3 curriculum bounds.
 */
export function validateNC2GItem(item: unknown): ValidationResult {
  const errors: string[] = []

  if (!item || typeof item !== "object") {
    return { valid: false, errors: ["Item must be a non-null object."] }
  }

  const candidate = item as Partial<NC2GItem>

  // 1. Standard identifier
  if (candidate.standard !== "NC.2.G.3") {
    errors.push(`Standard must be 'NC.2.G.3', got '${candidate.standard}'.`)
  }

  // 2. ID and Strings
  if (!candidate.id || typeof candidate.id !== "string" || candidate.id.trim().length === 0) {
    errors.push("Item 'id' must be a non-empty string.")
  }
  if (
    !candidate.context ||
    typeof candidate.context !== "string" ||
    candidate.context.trim().length === 0
  ) {
    errors.push("Item 'context' must be a non-empty string.")
  }
  if (
    !candidate.narrative ||
    typeof candidate.narrative !== "string" ||
    candidate.narrative.trim().length === 0
  ) {
    errors.push("Item 'narrative' must be a non-empty string.")
  } else if (candidate.narrative.trim().length < 10) {
    errors.push("Item 'narrative' must be at least 10 characters.")
  }

  // 3. Shape type bounds ("rectangle" | "circle")
  if (candidate.shapeType !== "rectangle" && candidate.shapeType !== "circle") {
    errors.push(`shapeType must be 'rectangle' or 'circle', got '${candidate.shapeType}'.`)
  }

  // 4. Target shares bounds (2 | 3 | 4 per NC.2.G.3 standard)
  let validShares = true
  if (typeof candidate.targetShares !== "number" || !Number.isInteger(candidate.targetShares)) {
    errors.push("targetShares must be an integer.")
    validShares = false
  } else if (candidate.targetShares < 2 || candidate.targetShares > 4) {
    errors.push(`targetShares must be 2, 3, or 4, got ${candidate.targetShares}.`)
    validShares = false
  }

  // 5. Verbal share names and equation bounds
  const validVerbalNames = ["halves", "thirds", "fourths"] as const
  if (
    !candidate.verbalShareName ||
    !validVerbalNames.includes(candidate.verbalShareName as "halves" | "thirds" | "fourths")
  ) {
    errors.push(
      `verbalShareName must be 'halves', 'thirds', or 'fourths', got '${candidate.verbalShareName}'.`,
    )
  } else if (validShares && candidate.targetShares) {
    const expectedVerbal =
      candidate.targetShares === 2 ? "halves" : candidate.targetShares === 3 ? "thirds" : "fourths"

    if (candidate.verbalShareName !== expectedVerbal) {
      errors.push(
        `verbalShareName must be '${expectedVerbal}' for targetShares ${candidate.targetShares}, got '${candidate.verbalShareName}'.`,
      )
    }

    const expectedEquation = `${candidate.targetShares} ${expectedVerbal} = 1 whole`
    if (candidate.equation !== expectedEquation) {
      errors.push(`equation must be '${expectedEquation}', got '${candidate.equation}'.`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function assertValidNC2GItem(item: unknown): asserts item is NC2GItem {
  const result = validateNC2GItem(item)
  if (!result.valid) {
    throw new Error(`NC2GItem Validation Error:\n - ${result.errors.join("\n - ")}`)
  }
}

// ============================================================================
// Batch Validation Utilities
// ============================================================================

export interface BatchValidationResult {
  valid: boolean
  total: number
  failures: { id?: string; index: number; errors: string[] }[]
}

export function validateCurriculumBatch<T extends { id?: string }>(
  items: T[],
  validator: (item: T) => ValidationResult,
): BatchValidationResult {
  const failures: { id?: string; index: number; errors: string[] }[] = []

  items.forEach((item, index) => {
    const res = validator(item)
    if (!res.valid) {
      failures.push({
        id: item.id,
        index,
        errors: res.errors,
      })
    }
  })

  return {
    valid: failures.length === 0,
    total: items.length,
    failures,
  }
}
