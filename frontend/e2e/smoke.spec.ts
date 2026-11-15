import { expect, test } from '@playwright/test'

test('the root opens the catalog with the demo notice', async ({ page }) => {
  await page.route('**/api/programs', (route) => route.fulfill({ json: [] }))
  await page.goto('/')

  await expect(page).toHaveURL(/\/programs$/)
  await expect(page).toHaveTitle('ApplyFlow')
  await expect(page.getByRole('heading', { level: 1, name: 'Find a program' })).toBeVisible()
  await expect(page.getByText(/Payments are simulated/)).toBeVisible()
})

test('a deep link is served by the app, not a 404', async ({ page }) => {
  const response = await page.goto('/applications')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveURL(/\/login/)
})
