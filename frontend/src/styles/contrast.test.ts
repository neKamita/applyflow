// @vitest-environment node
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

// Checks every text/ground pair the components use against WCAG 2.2 AA, in both themes,
// straight from tokens.css so the numbers cannot drift from what ships.

type Palette = Record<string, string>

function block(selector: string): Palette {
  const start = css.indexOf(selector)
  if (start < 0) throw new Error(`Selector ${selector} not found in tokens.css`)
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  const palette: Palette = {}
  for (const match of body.matchAll(/--(color-[\w-]+):\s*([^;]+);/g)) {
    const [, name, value] = match
    if (name && value) palette[name] = value.trim()
  }
  return palette
}

function resolve(palette: Palette, name: string): [number, number, number] {
  const value = palette[name]
  if (!value) throw new Error(`Token --${name} is not defined`)
  const ref = /^var\(--([\w-]+)\)$/.exec(value)
  if (ref?.[1]) return resolve(palette, ref[1])
  const oklch = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(value)
  if (!oklch) throw new Error(`Token --${name} is not a plain oklch() colour: ${value}`)
  return [Number(oklch[1]), Number(oklch[2]), Number(oklch[3])]
}

// OKLCH -> linear sRGB (Björn Ottosson's OKLab matrices), clamped to the sRGB gamut.
function luminance([l, c, h]: [number, number, number]): number {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  const r = clamp(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_)
  const g = clamp(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_)
  const bl = clamp(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_)
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl
}

function contrast(palette: Palette, fg: string, bg: string): number {
  const [hi, lo] = [luminance(resolve(palette, fg)), luminance(resolve(palette, bg))].sort((x, y) => y - x)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

const text: [string, string][] = [
  ['color-ink', 'color-paper'],
  ['color-ink', 'color-panel'],
  ['color-ink', 'color-sunken'],
  ['color-ink-muted', 'color-paper'],
  ['color-ink-muted', 'color-panel'],
  ['color-ink-muted', 'color-sunken'],
  ['color-on-cover', 'color-cover'],
  ['color-on-cover-muted', 'color-cover'],
  ['color-on-cover', 'color-cover-raised'],
  ['color-on-primary', 'color-primary'],
  ['color-on-primary', 'color-primary-hover'],
  ...(['submitted', 'paid', 'failed'] as const).flatMap((s): [string, string][] => [
    [`color-stamp-${s}`, 'color-paper'],
    [`color-stamp-${s}`, 'color-panel'],
    [`color-stamp-${s}`, `color-stamp-${s}-soft`],
  ]),
]

// Non-text UI boundaries: focus ring, input borders (WCAG 1.4.11, 3:1).
const ui: [string, string][] = [
  ['color-focus', 'color-paper'],
  ['color-focus', 'color-panel'],
  ['color-line-strong', 'color-panel'],
  ['color-line-strong', 'color-paper'],
]
// The guilloche band is decorative (aria-hidden), so WCAG 1.4.11 does not apply to it.

const themes = {
  light: block(':root {'),
  dark: block(":root[data-theme='dark'] {"),
}

describe.each(Object.entries(themes))('%s theme', (_theme, palette) => {
  it.each(text)('%s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrast(palette, fg, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(ui)('%s on %s is at least 3:1', (fg, bg) => {
    expect(contrast(palette, fg, bg)).toBeGreaterThanOrEqual(3)
  })
})

it('dark tokens are identical in the media query and the data-theme override', () => {
  expect(block(":root:not([data-theme='light']) {")).toEqual(themes.dark)
})

it('the conversion matches known values: white on black is 21:1', () => {
  const palette = { 'color-white': 'oklch(1 0 0)', 'color-black': 'oklch(0 0 0)' }
  expect(contrast(palette, 'color-white', 'color-black')).toBeCloseTo(21, 1)
})
