import { DEFAULT_RETURN_TO, safeReturnTo } from './returnTo'

const origin = 'https://app.example'

describe('safeReturnTo', () => {
  it.each([
    ['/applications', '/applications'],
    ['/programs?country=Germany&degree=MASTER', '/programs?country=Germany&degree=MASTER'],
    ['/applications/55740d4e#timeline', '/applications/55740d4e#timeline'],
    ['/programs/../applications', '/applications'],
  ])('keeps same-origin path %s', (input, expected) => {
    expect(safeReturnTo(input, origin)).toBe(expected)
  })

  it.each([
    '//evil.example',
    '/\\evil.example',
    'https://evil.example',
    'javascript:alert(1)',
    '/%2F%2Fevil.example',
    '\t//evil.example',
    '/\t/evil.example',
    // Found by the verification court: dot segments normalise into a protocol-relative URL.
    '/a/..//evil.example',
    '/.//evil.example',
    '/x/%2e%2e//evil.example',
    '/a/../\\evil.example',
    '/a/..//evil.example?x=1#h',
    'evil.example',
    '',
  ])('rejects %j', (input) => {
    expect(safeReturnTo(input, origin)).toBe(DEFAULT_RETURN_TO)
  })

  it.each([undefined, null, 42, ['/applications'], { path: '/x' }])('rejects non-string %j', (input) => {
    expect(safeReturnTo(input, origin)).toBe(DEFAULT_RETURN_TO)
  })

  it('rejects malformed percent-encoding instead of throwing', () => {
    expect(safeReturnTo('/programs/%E0%A4%A', origin)).toBe(DEFAULT_RETURN_TO)
  })
})
