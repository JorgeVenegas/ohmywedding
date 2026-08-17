import type { ComponentEntry, ComponentRef, InlineComponent } from "./page-config"

export type { InlineComponent }

export function isComponentRef(entry: ComponentEntry): entry is ComponentRef {
  return "$ref" in entry
}

/**
 * Resolves a ComponentEntry to its InlineComponent definition.
 * $ref entries are looked up in sharedComponents; inline entries pass through.
 * Returns null if a $ref points to a missing registry entry.
 */
export function resolveComponent(
  entry: ComponentEntry,
  sharedComponents: Record<string, InlineComponent> = {}
): InlineComponent | null {
  if (isComponentRef(entry)) {
    return sharedComponents[entry.$ref] ?? null
  }
  return entry
}

/**
 * Resolves an entire components array, filtering out unresolvable $refs.
 */
export function resolveComponents(
  entries: ComponentEntry[],
  sharedComponents: Record<string, InlineComponent> = {}
): InlineComponent[] {
  return entries
    .map((e) => resolveComponent(e, sharedComponents))
    .filter((c): c is InlineComponent => c !== null)
}
