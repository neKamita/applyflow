export const DEFAULT_RETURN_TO = '/programs'

// Any C0 control character or DEL. URL parsing silently strips tabs and newlines, which would let
// "/\t/evil.example" become "//evil.example".
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/

/**
 * Turns an untrusted `returnTo` value into a same-origin path, or the default page.
 *
 * Checks the raw value and then the parsed, normalised path: dot segments are resolved during
 * parsing, so "/a/..//evil.example" passes every raw check but normalises to "//evil.example".
 */
export function safeReturnTo(value: unknown, origin: string): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.includes('\\') || CONTROL.test(value)) {
    return DEFAULT_RETURN_TO
  }

  let url: URL
  try {
    url = new URL(value, origin)
  } catch {
    return DEFAULT_RETURN_TO
  }
  if (url.origin !== origin) return DEFAULT_RETURN_TO

  const path = url.pathname
  let decoded: string
  try {
    decoded = decodeURIComponent(path)
  } catch {
    return DEFAULT_RETURN_TO
  }
  if (path.startsWith('//') || decoded.startsWith('//') || decoded.includes('\\')) {
    return DEFAULT_RETURN_TO
  }

  return `${path}${url.search}${url.hash}`
}
