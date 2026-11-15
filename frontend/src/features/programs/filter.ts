import { degree as degreeSchema, type Degree, type Program } from '../../api/schemas'
import { daysUntil } from '../../ui/format'

export interface CatalogSearch {
  q?: string | undefined
  country?: string | undefined
  degree?: Degree | undefined
  open?: boolean | undefined
}

const MAX_QUERY = 100

/** Open while the deadline is not before today's UTC date, the backend's rule (Program.java). */
export function isOpen(program: Program, now: Date): boolean {
  return daysUntil(program.deadline, now) >= 0
}

/** Lower case without accents, so "munchen" finds "München". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function filterPrograms(programs: readonly Program[], search: CatalogSearch, now: Date): Program[] {
  const words = fold(search.q ?? '')
    .split(/\s+/)
    .filter(Boolean)

  const matches = programs.filter((program) => {
    if (search.country && program.country !== search.country) return false
    if (search.degree && program.degree !== search.degree) return false
    if (search.open && !isOpen(program, now)) return false
    const haystack = fold(`${program.university} ${program.name}`)
    return words.every((word) => haystack.includes(word))
  })

  return matches.sort((a, b) => {
    const aOpen = isOpen(a, now)
    const bOpen = isOpen(b, now)
    if (aOpen !== bOpen) return aOpen ? -1 : 1
    // Open: nearest deadline first. Closed: most recently closed first.
    return aOpen ? a.deadline.localeCompare(b.deadline) : b.deadline.localeCompare(a.deadline)
  })
}

function text(value: unknown): string | undefined {
  // The router JSON-parses search values, so "?q=123" arrives as a number.
  const raw = typeof value === 'number' ? String(value) : value
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim().slice(0, MAX_QUERY)
  return trimmed === '' ? undefined : trimmed
}

/**
 * URL search params -> filters. Anything unknown or malformed is dropped, never an error.
 *
 * Every key is returned, invalid ones as undefined: the router merges the raw parent search into a
 * route's validated search, so a key that is merely left out would come back unvalidated.
 */
export function parseCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const degree = degreeSchema.safeParse(search.degree)
  const open = search.open === true || search.open === 1 || search.open === '1' || search.open === 'true'
  return {
    q: text(search.q),
    country: text(search.country),
    degree: degree.success ? degree.data : undefined,
    open: open ? true : undefined,
  }
}
