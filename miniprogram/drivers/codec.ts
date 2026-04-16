type Dict = Record<string, unknown>

export function asDict(raw: unknown): Dict {
  if (!raw || typeof raw !== 'object') {
    return {}
  }
  return raw as Dict
}

export function readString(raw: unknown, keys: string[], fallback = ''): string {
  const dict = asDict(raw)
  for (const key of keys) {
    const value = dict[key]
    if (typeof value === 'string') {
      return value
    }
  }
  return fallback
}

export function readNumber(raw: unknown, keys: string[], fallback = 0): number {
  const dict = asDict(raw)
  for (const key of keys) {
    const value = dict[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim()) {
      const converted = Number(value)
      if (Number.isFinite(converted)) {
        return converted
      }
    }
  }
  return fallback
}

export function readBoolean(raw: unknown, keys: string[], fallback = false): boolean {
  const dict = asDict(raw)
  for (const key of keys) {
    const value = dict[key]
    if (typeof value === 'boolean') {
      return value
    }
  }
  return fallback
}

export function readStringArray(raw: unknown, keys: string[]): string[] {
  const dict = asDict(raw)
  for (const key of keys) {
    const value = dict[key]
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string')
    }
  }
  return []
}
