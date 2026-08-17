/** Remove null/undefined values recursively so tools don't waste tokens on empty fields. */
export function stripNulls<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(stripNulls) as T
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => [k, stripNulls(v)])
    ) as T
  }
  return obj
}
