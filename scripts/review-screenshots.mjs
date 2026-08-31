/**
 * Design review screenshot script.
 * Run with: node scripts/review-screenshots.mjs
 *
 * Opens a browser, waits for you to log in (30s), then captures all pages.
 */
import { chromium } from '@playwright/test'
import { mkdir } from 'fs/promises'

const BASE = 'http://localhost:3000'
const OUT = '.design/masa-redesign/screenshots'
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
]

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext()
const page = await context.newPage()

await page.goto(`${BASE}/login`)
console.log('\n👤 Log in to the app in the browser window that just opened.')
console.log('   Script will continue automatically once you are logged in.\n')

// Wait until the URL is no longer /login (i.e. user successfully authenticated)
await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 120_000 })
console.log('✓ Logged in. Taking screenshots...\n')

// Discover a real trip ID from the trips page
await page.goto(`${BASE}/trips`)
await page.waitForLoadState('networkidle')

const tripLink = await page.$('a[href^="/trips/"]')
const tripHref = tripLink ? await tripLink.getAttribute('href') : null
const tripId = tripHref?.match(/\/trips\/([^/]+)/)?.[1]

const PAGES = [
  { slug: 'trips', url: `${BASE}/trips` },
  ...(tripId ? [
    { slug: 'dashboard', url: `${BASE}/trips/${tripId}` },
    { slug: 'expenses', url: `${BASE}/trips/${tripId}/expenses` },
    { slug: 'members', url: `${BASE}/trips/${tripId}/members` },
    { slug: 'wallet', url: `${BASE}/trips/${tripId}/wallet` },
    { slug: 'settle', url: `${BASE}/trips/${tripId}/settle` },
  ] : []),
]

for (const { slug, url } of PAGES) {
  for (const { name, width, height } of VIEWPORTS) {
    await page.setViewportSize({ width, height })
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    const file = `${OUT}/review-${slug}-${name}-${width}.png`
    await page.screenshot({ path: file, fullPage: true })
    console.log(`✓ ${file}`)
  }
}

// Dark mode pass (mobile only)
await page.evaluate(() => document.documentElement.classList.add('dark'))
for (const { slug, url } of PAGES.slice(0, 3)) {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  const file = `${OUT}/review-${slug}-dark-mobile-375.png`
  await page.screenshot({ path: file, fullPage: true })
  console.log(`✓ ${file}`)
}

await browser.close()
console.log('\n✅ Done. Screenshots saved to', OUT)
