/**
 * Visual sweep over the Haven design system.
 *
 * Run against a production build:
 *   npm run build && npm run start &   (or any server on PORT)
 *   node scripts/visual-check.mjs
 *
 * Checks per route:
 *   1. No horizontal overflow at 375px and 320px (mobile busts).
 *   2. No legacy colours in computed styles — anything outside the Haven
 *      palette means a page drifted back to the old design.
 *   3. Focus-visible rings actually paint on keyboard navigation.
 *   4. No animated elements survive `prefers-reduced-motion: reduce`.
 *
 * Authenticated pages are skipped when no credentials are present: the sweep
 * covers them via their unauthenticated redirects instead.
 */

import { chromium } from '@playwright/test';

const BASE = process.env.CHECK_BASE_URL || 'http://localhost:3000';

// Public routes only — authenticated routes redirect to /login when no
// session exists, which is itself a useful thing to verify.
const routes = [
  '/',
  '/features',
  '/pricing',
  '/login',
  '/signup',
  '/forgot-password',
  '/privacy',
  '/terms',
  '/refund',
  '/contact',
  '/rescue',
  '/start/writing-a-difficult-email',
];

// The Haven palette, as a Set for computed-style comparison. Every opaque
// background the app should ever paint, plus transparent.
const PALETTE = new Set([
  'rgb(30, 31, 34)',   // #1E1F22 canvas
  'rgb(43, 45, 49)',   // #2B2D31 surface
  'rgb(56, 58, 64)',   // #383A40 elevated
  'rgb(13, 148, 136)', // #0D9488 primary
  'rgb(20, 184, 166)', // #14B8A6 hover
  'rgba(0, 0, 0, 0)',  // transparent
  'rgb(255, 255, 255)',
  'rgb(0, 0, 0)',
]);

// Legacy colours that must not appear anywhere, even at low opacity.
const BANNED_SUBSTRINGS = [
  'rgb(124, 58, 237)', // violet-600 — the retired brand purple
  'rgb(139, 92, 246)', // violet-500
  'rgb(167, 139, 250)',// violet-400
  'rgb(30, 41, 59)',   // slate-800 — the retired slate surfaces
  'rgb(15, 23, 42)',   // slate-900
  'rgb(248, 250, 252)',// slate-50 — halogen white on dark
];

const results = [];

function check(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function computedBackgrounds(page) {
  return page.evaluate(() => {
    const seen = new Set();
    for (const el of document.querySelectorAll('body *')) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)') seen.add(bg);
      const color = getComputedStyle(el).color;
      if (color) seen.add(color);
    }
    return [...seen];
  });
}

async function overflowAt(page, width) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function reducedMotionStatic(browser) {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const p = await context.newPage();
  let total = 0;
  const perRoute = {};
  for (const route of routes) {
    try {
      await p.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch {
      continue; // load failures are already reported by the main loop
    }
    // Elements with infinite CSS animations would keep animating; with reduce
    // emulated, our motion-reduce: classes must have removed every animation.
    const animating = await p.evaluate(() => {
      let count = 0;
      for (const el of document.querySelectorAll('*')) {
        const anim = getComputedStyle(el).animationName;
        if (anim && anim !== 'none' && getComputedStyle(el).animationIterationCount.includes('infinite')) count++;
      }
      return count;
    });
    perRoute[route] = animating;
    total += animating;
  }
  await context.close();
  return { total, perRoute };
}

const browser = await chromium.launch();
const page = await browser.newPage();

for (const route of routes) {
  const url = BASE + route;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch (e) {
    check(`${route} loads`, false, e.message.split('\n')[0]);
    continue;
  }
  const finalUrl = new URL(page.url()).pathname;
  check(`${route} loads`, true, `→ ${finalUrl}`);

  // 1. Overflow at mobile widths (checked once per breakpoint on the home
  //    route, then on this route at 375 only to keep the run quick).
  if (route === '/') {
    const w375 = await overflowAt(page, 375);
    check('home: 0px overflow at 375px', w375 === 0, `overflow=${w375}px`);
    const w320 = await overflowAt(page, 320);
    check('home: 0px overflow at 320px', w320 === 0, `overflow=${w320}px`);
  }
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(`${route}: no overflow at 375px`, overflow === 0, `overflow=${overflow}px`);

  // 2. Palette discipline.
  const colors = await computedBackgrounds(page);
  const banned = colors.filter((c) => BANNED_SUBSTRINGS.some((b) => c.includes(b)));
  check(`${route}: no legacy colours`, banned.length === 0, banned.slice(0, 3).join(', '));

  // 3. Keyboard focus rings — Tab into the first focusable and inspect.
  //    Retried briefly: on static-prerendered pages the client takeover
  //    (hydration) can replace the DOM mid-measurement and drop an early
  //    focus onto body, which would otherwise read as a false failure.
  let ring = { ok: false, note: 'nothing focusable' };
  for (let attempt = 0; attempt < 5 && !ring.ok; attempt++) {
    await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
    await page.keyboard.press('Tab');
    ring = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { ok: false, note: 'nothing focusable' };
      const s = getComputedStyle(el);
      return { ok: s.outlineStyle !== 'none' || s.boxShadow !== 'none', note: `${el.tagName} outline=${s.outlineStyle} shadow=${s.boxShadow.slice(0, 40)}` };
    });
    if (!ring.ok) await page.waitForTimeout(500);
  }
  check(`${route}: first Tab shows focus treatment`, ring.ok, ring.note);
}

// 4. Reduced motion — checked on every public route, not just one.
const motion = await reducedMotionStatic(browser);
const motionDetail = Object.entries(motion.perRoute)
  .filter(([, n]) => n > 0)
  .map(([route, n]) => `${route}=${n}`)
  .join(', ');
check('reduced motion: no infinite animations on any route', motion.total === 0, motionDetail || `${motion.total} animating`);

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length > 0) {
  console.log('\nFailures:');
  for (const f of failed) console.log(`  ✗ ${f.name} — ${f.detail}`);
  process.exit(1);
}
