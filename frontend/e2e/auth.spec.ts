import { expect, test, type Page } from '@playwright/test'

// The API is mocked at the network layer: these tests check the browser side (routing, session,
// headers). The full stack is exercised by the compose end-to-end job in Phase 8.

async function trackCspViolations(page: Page): Promise<string[]> {
  const violations: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Content Security Policy')) {
      violations.push(message.text())
    }
  })
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.error(`Content Security Policy violation: ${event.violatedDirective} ${event.blockedURI}`)
    })
  })
  return violations
}

test('protected page -> sign in -> back to the page, with no CSP violations', async ({ page }) => {
  const violations = await trackCspViolations(page)
  await page.route('**/auth/token', (route) =>
    route.fulfill({ json: { accessToken: 'e2e-token', tokenType: 'Bearer', expiresIn: 3600 } }),
  )

  const response = await page.goto('/applications')
  expect(response?.headers()['content-security-policy']).toContain("script-src 'self'")

  await expect(page).toHaveURL(/\/login\?returnTo=%2Fapplications/)
  await page.getByLabel('Username').fill('aziz')
  await page.getByLabel('Password', { exact: true }).fill('aziz-demo-pass')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/applications$/)
  await expect(page.getByRole('heading', { name: 'My applications' })).toBeVisible()

  // A reload keeps the session (sessionStorage), and the token is not in localStorage.
  await page.reload()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([])

  expect(violations, violations.join('\n')).toEqual([])
})

test('a fresh tab is not signed in', async ({ context, page }) => {
  await page.route('**/auth/token', (route) =>
    route.fulfill({ json: { accessToken: 'e2e-token', tokenType: 'Bearer', expiresIn: 3600 } }),
  )
  await page.goto('/login')
  await page.getByLabel('Username').fill('aziz')
  await page.getByLabel('Password', { exact: true }).fill('aziz-demo-pass')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

  const fresh = await context.newPage()
  await fresh.goto('/applications')
  await expect(fresh).toHaveURL(/\/login/)
})
