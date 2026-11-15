// @vitest-environment node
import { readFileSync } from 'node:fs'
import securityHeaders from '../../security-headers.json' with { type: 'json' }

const nginx = readFileSync(new URL('../../nginx/security-headers.conf', import.meta.url), 'utf8')
const template = readFileSync(new URL('../../nginx/templates/default.conf.template', import.meta.url), 'utf8')

describe('security headers', () => {
  it('nginx sends exactly the headers that vite preview sends', () => {
    const fromNginx = Object.fromEntries(
      [...nginx.matchAll(/^add_header ([\w-]+) "([^"]*)" always;$/gm)].map((match): [string, string] => [
        match[1] ?? '',
        match[2] ?? '',
      ]),
    )
    expect(fromNginx).toEqual(securityHeaders)
  })

  it('every nginx location includes the security headers', () => {
    const locations = template.split(/\n\s*location /).slice(1)
    expect(locations.length).toBeGreaterThanOrEqual(4)
    for (const block of locations) {
      expect(block).toContain('include /etc/nginx/security-headers.conf;')
    }
  })

  it('the CSP allows no inline or third-party scripts and no framing', () => {
    const csp = securityHeaders['Content-Security-Policy']
    expect(csp).toContain("script-src 'self';")
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|https?:/)
    expect(csp).toContain("frame-ancestors 'none'")
  })
})
