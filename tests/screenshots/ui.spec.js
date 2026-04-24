import { test } from '@playwright/test';
import { mkdirSync } from 'fs';

const LOCALES = ['en', 'uk'];

const SCENARIOS = [
  { mode: 'labour',      tabId: 'contractions', tabIndex: 0 },
  { mode: 'labour',      tabId: 'hydration',    tabIndex: 1 },
  { mode: 'labour',      tabId: 'relief',       tabIndex: 2 },
  { mode: 'expectation', tabId: 'expecting',    tabIndex: 0 },
  { mode: 'expectation', tabId: 'hydration',    tabIndex: 1 },
  { mode: 'expectation', tabId: 'relief',       tabIndex: 2 },
];

function buildStorage(locale, mode) {
  const now = Date.now();
  return {
    luna_locale: locale,
    luna_mode: mode,
    luna_due_date: '2026-08-15',
    luna_countdown_unit: 'wks_days',
    lc_di: '15',
    lc_iv: JSON.stringify([5, 15, 30]),
    lc_dc: '3',
    lc_ld: String(now - 2 * 60 * 1000),
    lc_c4: JSON.stringify([
      { start: now - 30 * 60 * 1000, duration: 52, time: '12:30 PM' },
      { start: now - 23 * 60 * 1000, duration: 48, time: '12:37 PM' },
      { start: now - 16 * 60 * 1000, duration: 55, time: '12:44 PM' },
      { start: now -  9 * 60 * 1000, duration: 60, time: '12:51 PM' },
      { start: now -  2 * 60 * 1000, duration: 58, time: '12:58 PM' },
    ]),
    luna_todos: JSON.stringify([
      { id: 't1', text: 'Pack hospital bag',  priority: 'high',   done: false, createdAt: now - 86400000 },
      { id: 't2', text: 'Install car seat',   priority: 'medium', done: false, createdAt: now - 172800000 },
      { id: 't3', text: 'Prepare birth plan', priority: 'high',   done: true,  createdAt: now - 259200000 },
    ]),
  };
}

for (const locale of LOCALES) {
  for (const { mode, tabId, tabIndex } of SCENARIOS) {
    test(`${locale}/${mode}/${tabId}`, async ({ page }) => {
      const storage = buildStorage(locale, mode);

      await page.addInitScript((s) => {
        for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
      }, storage);

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      if (tabIndex > 0) {
        await page.locator(`[data-testid="tab-${tabId}"]`).click();
        await page.waitForTimeout(200);
      }

      mkdirSync(`screenshots/${locale}/${mode}`, { recursive: true });
      await page.screenshot({
        path: `screenshots/${locale}/${mode}/${tabId}.png`,
        fullPage: false,
      });
    });
  }
}

for (const locale of LOCALES) {
  test(`${locale}/settings`, async ({ page }) => {
    const storage = buildStorage(locale, 'labour');

    await page.addInitScript((s) => {
      for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
    }, storage);

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.locator('h2').waitFor({ state: 'visible' });

    mkdirSync(`screenshots/${locale}`, { recursive: true });
    await page.screenshot({
      path: `screenshots/${locale}/settings.png`,
      fullPage: false,
    });
  });
}
