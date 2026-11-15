import type { Program } from '../../api/schemas'
import { filterPrograms, isOpen, parseCatalogSearch } from './filter'

const program = (overrides: Partial<Program>): Program => ({
  id: 'p',
  university: 'Technical University of Munich',
  name: 'MSc Informatics',
  country: 'Germany',
  degree: 'MASTER',
  applicationFee: 75,
  currency: 'EUR',
  deadline: '2027-05-31',
  ...overrides,
})

const now = new Date('2026-11-15T12:00:00Z')
const catalog: Program[] = [
  program({ id: 'tum', deadline: '2027-05-31' }),
  program({
    id: 'lmu',
    university: 'Ludwig-Maximilians-Universität München',
    name: 'MSc Data Science',
    deadline: '2027-01-15',
  }),
  program({
    id: 'polimi',
    university: 'Politecnico di Milano',
    name: 'BSc Computer Engineering',
    country: 'Italy',
    degree: 'BACHELOR',
    deadline: '2026-04-15',
  }),
  program({
    id: 'wiut',
    university: 'Westminster International University in Tashkent',
    name: 'BSc Software Engineering',
    country: 'Uzbekistan',
    degree: 'BACHELOR',
    currency: 'USD',
    deadline: '2026-11-15',
  }),
  program({ id: 'old', university: 'Old University', name: 'MSc Physics', deadline: '2026-11-14' }),
]

describe('isOpen', () => {
  it('treats the deadline day (UTC) as open and the day before as closed', () => {
    expect(isOpen(program({ deadline: '2026-11-15' }), now)).toBe(true)
    expect(isOpen(program({ deadline: '2026-11-14' }), now)).toBe(false)
  })
})

describe('filterPrograms', () => {
  const ids = (list: Program[]) => list.map((p) => p.id)

  it('lists open programs by nearest deadline, then closed ones newest first', () => {
    expect(ids(filterPrograms(catalog, {}, now))).toEqual(['wiut', 'lmu', 'tum', 'old', 'polimi'])
  })

  it('searches university and program, ignoring case, accents and surrounding spaces', () => {
    expect(ids(filterPrograms(catalog, { q: '  munchen ' }, now))).toEqual(['lmu'])
    expect(ids(filterPrograms(catalog, { q: 'INFORMATICS' }, now))).toEqual(['tum'])
    expect(ids(filterPrograms(catalog, { q: 'software tashkent' }, now))).toEqual(['wiut'])
  })

  it('filters by country, degree and open status together', () => {
    expect(ids(filterPrograms(catalog, { country: 'Germany', open: true }, now))).toEqual(['lmu', 'tum'])
    expect(ids(filterPrograms(catalog, { degree: 'BACHELOR' }, now))).toEqual(['wiut', 'polimi'])
    expect(ids(filterPrograms(catalog, { country: 'Narnia' }, now))).toEqual([])
  })
})

describe('parseCatalogSearch', () => {
  it('keeps valid values, including the numbers the router produces from the URL', () => {
    expect(parseCatalogSearch({ q: 'data', country: 'Germany', degree: 'MASTER', open: 1 })).toEqual({
      q: 'data',
      country: 'Germany',
      degree: 'MASTER',
      open: true,
    })
    expect(parseCatalogSearch({ q: 123, open: 'true' })).toEqual({ q: '123', open: true })
  })

  it('drops unknown or malformed values instead of failing', () => {
    expect(parseCatalogSearch({ degree: 'DIPLOMA', open: 'yes', country: ['x'], q: { a: 1 } })).toEqual({})
    expect(parseCatalogSearch({ q: '   ', country: '' })).toEqual({})
    expect(parseCatalogSearch({ q: 'x'.repeat(500) }).q).toHaveLength(100)
  })
})
