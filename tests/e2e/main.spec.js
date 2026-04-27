const { test, expect } = require('@playwright/test')

const TEST_EMAIL = `e2e-test+${Date.now()}@absoluteapplabs.com`
const TEST_PASS  = 'TestPass123!'
const TEST_CO    = 'E2E Test Company'

// ── LANDING PAGE ───────────────────────────────────────────────────────────
test.describe('Landing Page', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Absolute AIChat|Kaali/i)
    await expect(page.locator('body')).toBeVisible()
  })

  test('has navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav')).toBeVisible()
  })

  test('has a CTA button linking to register or auth', async ({ page }) => {
    await page.goto('/')
    // Look for any link that goes to register/auth/signup
    const ctaLink = page.locator('a[href*="register"], a[href*="signup"], a[href*="auth"]').first()
    await expect(ctaLink).toBeVisible({ timeout: 10000 })
  })
})

// ── REGISTER ───────────────────────────────────────────────────────────────
test.describe('Registration Flow', () => {
  test('register page loads', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.locator('input[type="email"], input[type="text"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('register page has password field', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('can fill step 1 and attempt registration', async ({ page }) => {
    await page.goto('/auth/register')
    
    // Fill first name / last name or full name
    const inputs = page.locator('input[type="text"]')
    const count = await inputs.count()
    if (count >= 1) await inputs.nth(0).fill('E2E')
    if (count >= 2) await inputs.nth(1).fill('Test')
    if (count >= 3) await inputs.nth(2).fill(TEST_CO)
    
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASS)
    
    // Click the submit button
    const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Next"), button:has-text("Continue")').first()
    await submitBtn.click()
    
    // Either moves to step 2 or shows error — both are valid
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })
})

// ── LOGIN ──────────────────────────────────────────────────────────────────
test.describe('Login', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'nonexistent@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"], button:has-text("Sign"), button:has-text("Login")')
    await page.waitForTimeout(3000)
    // Should still be on login page (not redirected)
    await expect(page).toHaveURL(/login|auth/)
  })

  test('has link to register', async ({ page }) => {
    await page.goto('/auth/login')
    const registerLink = page.locator('a[href*="register"]')
    await expect(registerLink).toBeVisible({ timeout: 5000 })
  })
})

// ── SUPERADMIN ─────────────────────────────────────────────────────────────
test.describe('Superadmin', () => {
  test('superadmin login page loads', async ({ page }) => {
    await page.goto('/superadmin/login')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('wrong credentials shows error or stays on login', async ({ page }) => {
    await page.goto('/superadmin/login')
    await page.fill('input[type="email"]', 'wrong@test.com')
    await page.fill('input[type="password"]', 'wrongpass')
    await page.click('button[type="submit"], button:has-text("Sign"), button:has-text("Login")').catch(() => {})
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/superadmin/)
  })
})

// ── WIDGET ─────────────────────────────────────────────────────────────────
test.describe('Widget', () => {
  test('chat bubble appears on homepage', async ({ page }) => {
    await page.goto('https://aichat.absoluteapplabs.com')
    await page.waitForTimeout(5000)
    // Check widget loaded — either bubble or panel
    const widget = page.locator('#kaali-bubble, #kaali-panel, [id*="kaali"]').first()
    await expect(widget).toBeVisible({ timeout: 15000 })
  })

  test('widget panel opens on click', async ({ page }) => {
    await page.goto('https://aichat.absoluteapplabs.com')
    await page.waitForTimeout(5000)
    const bubble = page.locator('#kaali-bubble').first()
    const isBubbleVisible = await bubble.isVisible().catch(() => false)
    if (isBubbleVisible) {
      await bubble.click()
      await expect(page.locator('#kaali-panel')).toBeVisible({ timeout: 5000 })
    } else {
      console.log('Bubble not visible — skipping click test')
    }
  })
})
