const { test, expect } = require('@playwright/test')

const TEST_EMAIL = `e2e-test+${Date.now()}@absoluteapplabs.com`
const TEST_PASS  = 'TestPass123!'
const TEST_CO    = 'E2E Test Company'

// ── LANDING PAGE ───────────────────────────────────────────────────────────
test.describe('Landing Page', () => {
  test('loads with correct title and hero', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Absolute AIChat/)
    await expect(page.locator('h1')).toContainText('visitor')
    await expect(page.locator('nav')).toBeVisible()
  })

  test('nav links work', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="#features"]')
    await expect(page.locator('#features')).toBeVisible()
    await page.click('a[href="#pricing"]')
    await expect(page.locator('#pricing')).toBeVisible()
  })

  test('Get started CTA links to register', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Get started free')
    await expect(page).toHaveURL(/\/auth\/register/)
  })

  test('Sign in link goes to login', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Sign in')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('pricing section shows 3 plans', async ({ page }) => {
    await page.goto('/')
    const plans = page.locator('#pricing .plan-card')
    await expect(plans).toHaveCount(3)
  })
})

// ── REGISTER ───────────────────────────────────────────────────────────────
test.describe('Registration Flow', () => {
  test('completes 3-step wizard and lands on dashboard', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.locator('h1')).toContainText('Create your account')

    // Step 1
    await page.fill('input[placeholder="Bala"]',         'E2E')
    await page.fill('input[placeholder="K"]',            'Test')
    await page.fill('input[placeholder*="company"]',      TEST_CO)
    await page.fill('input[type="email"]',               TEST_EMAIL)
    await page.fill('input[type="password"]',            TEST_PASS)
    await page.click('button:has-text("Create account")')

    // Step 2 should appear
    await expect(page.locator('h1')).toContainText('Tell us about', { timeout: 8000 })
    await page.fill('textarea', 'We are an E2E test company for automation testing.')
    await page.click('button:has-text("Continue")')

    // Step 3 should appear
    await expect(page.locator('h1')).toContainText('Connect your AI', { timeout: 5000 })
    // Skip API key — click skip
    await page.click('text=Skip for now')

    // Should land on dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.locator('text=Overview')).toBeVisible()
  })

  test('shows error on duplicate email', async ({ page }) => {
    await page.goto('/auth/register')
    await page.fill('input[placeholder="Bala"]',      'Dup')
    await page.fill('input[placeholder="K"]',         'User')
    await page.fill('input[placeholder*="company"]',  'Dup Co')
    await page.fill('input[type="email"]',            TEST_EMAIL)
    await page.fill('input[type="password"]',         TEST_PASS)
    await page.click('button:has-text("Create account")')
    await expect(page.locator('text=already')).toBeVisible({ timeout: 5000 })
  })
})

// ── LOGIN ──────────────────────────────────────────────────────────────────
test.describe('Login', () => {
  test('valid credentials redirect to dashboard', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('h1')).toContainText('Welcome back')
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASS)
    await page.click('button:has-text("Sign in")')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 })
  })

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button:has-text("Sign in")')
    await expect(page.locator('[style*="FFF0EE"]')).toBeVisible({ timeout: 5000 })
  })

  test('register link navigates to register page', async ({ page }) => {
    await page.goto('/auth/login')
    await page.click('text=Create one free')
    await expect(page).toHaveURL(/\/auth\/register/)
  })
})

// ── DASHBOARD ──────────────────────────────────────────────────────────────
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each dashboard test
    await page.goto('/auth/login')
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASS)
    await page.click('button:has-text("Sign in")')
    await page.waitForURL(/\/dashboard/, { timeout: 8000 })
  })

  test('overview page loads with stats', async ({ page }) => {
    await expect(page.locator('text=Monthly Usage')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
  })

  test('leads page loads', async ({ page }) => {
    await page.click('text=Leads')
    await expect(page).toHaveURL(/\/dashboard\/leads/)
    await expect(page.locator('h1, [data-title]').first()).toBeVisible()
  })

  test('conversations page loads', async ({ page }) => {
    await page.click('text=Chats')
    await expect(page).toHaveURL(/\/dashboard\/conversations/)
  })

  test('live page loads with toggle', async ({ page }) => {
    await page.click('text=Live')
    await expect(page).toHaveURL(/\/dashboard\/live/)
    await expect(page.locator('text=Online')).toBeVisible()
  })

  test('knowledge base page loads', async ({ page }) => {
    await page.click('text=Knowledge Base')
    await expect(page).toHaveURL(/\/dashboard\/knowledge/)
  })

  test('API usage page loads', async ({ page }) => {
    await page.click('text=API')
    await expect(page).toHaveURL(/\/dashboard\/api-usage/)
  })

  test('embed code page loads', async ({ page }) => {
    await page.click('text=Embed Code')
    await expect(page).toHaveURL(/\/dashboard\/embed/)
    await expect(page.locator('text=widget.js')).toBeVisible()
  })

  test('settings page loads', async ({ page }) => {
    await page.click('text=Settings')
    await expect(page).toHaveURL(/\/dashboard\/settings/)
  })

  test('team page loads', async ({ page }) => {
    await page.click('text=Team')
    await expect(page).toHaveURL(/\/dashboard\/team/)
  })

  test('sign out works', async ({ page }) => {
    await page.click('text=Sign out')
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 })
  })
})

// ── SUPERADMIN ─────────────────────────────────────────────────────────────
test.describe('Superadmin', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/superadmin/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('valid credentials access dashboard', async ({ page }) => {
    await page.goto('/superadmin/login')
    await page.fill('input[type="email"]',    process.env.SUPERADMIN_EMAIL || '')
    await page.fill('input[type="password"]', process.env.SUPERADMIN_PASSWORD || '')
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")')
    await expect(page).toHaveURL(/\/superadmin\/dashboard/, { timeout: 8000 })
  })

  test('superadmin dashboard shows platform stats', async ({ page }) => {
    await page.goto('/superadmin/login')
    await page.fill('input[type="email"]',    process.env.SUPERADMIN_EMAIL || '')
    await page.fill('input[type="password"]', process.env.SUPERADMIN_PASSWORD || '')
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")')
    await page.waitForURL(/\/superadmin\/dashboard/, { timeout: 8000 })
    await expect(page.locator('text=Tenants')).toBeVisible()
  })
})

// ── WIDGET ─────────────────────────────────────────────────────────────────
test.describe('Widget', () => {
  test('chat bubble appears on homepage', async ({ page }) => {
    await page.goto('https://aichat.absoluteapplabs.com')
    // Wait for widget to load
    await page.waitForTimeout(3000)
    const bubble = page.locator('#kaali-bubble')
    await expect(bubble).toBeVisible({ timeout: 10000 })
  })

  test('widget panel opens on bubble click', async ({ page }) => {
    await page.goto('https://aichat.absoluteapplabs.com')
    await page.waitForTimeout(3000)
    await page.click('#kaali-bubble')
    await expect(page.locator('#kaali-panel')).toBeVisible({ timeout: 5000 })
  })
})
