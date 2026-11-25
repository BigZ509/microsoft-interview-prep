import { expect, test, type Page } from '@playwright/test';
import { bootcampDays } from '../content/bootcamp';

/**
 * The bootcamp acceptance criterion: open the platform on a study day, press Continue Studying, and
 * finish the session with Complete & Continue (or Skip for now) — never searching for anything.
 * The date is controlled with page.clock, which useToday() reads through `new Date()`.
 */
async function onDay(page: Page, iso: string) {
  await page.clock.setFixedTime(new Date(`${iso}T10:00:00`));
}

async function expectRealContent(page: Page, id: string) {
  await expect(page.locator('.player-top'), id).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 }).first(), id).toBeVisible();
  const text = (await page.locator('.player-body').innerText()).trim();
  expect(text.length, `${id} renders real content`).toBeGreaterThan(80);
}

test('Day 1: Continue Studying, then Complete & Continue / Skip through to the end-of-day review', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'the full walk runs once, on desktop');
  test.setTimeout(240_000);
  await onDay(page, '2026-11-25');
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Day 1 of 7');
  await page.getByRole('link', { name: 'Continue Studying' }).click();
  await page.waitForURL(/\/study\//);

  const seen = new Map<string, number>();
  let recordedProblem = false;
  let reloaded = false;
  for (let step = 0; step < 80; step++) {
    const url = new URL(page.url());
    if (url.pathname === '/') break;
    const id = url.pathname.split('/').pop()!;
    seen.set(id, (seen.get(id) ?? 0) + 1);
    await expectRealContent(page, id);
    await expect(page.locator('.player-pos')).toContainText('Day 1 · Activity');

    // The resume position survives a reload, and Continue Studying returns to it.
    if (!reloaded && seen.size === 5) {
      reloaded = true;
      await page.reload();
      await expectRealContent(page, id);
      await page.goto('/');
      await expect(page.getByRole('link', { name: 'Continue Studying' })).toHaveAttribute('href', `/study/${id}`);
      await page.getByRole('link', { name: 'Continue Studying' }).click();
      await page.waitForURL(`**/study/${id}`);
      await expectRealContent(page, id);
    }

    const complete = page.getByRole('button', { name: /Complete & Continue|^Continue/ });
    // Gating: a problem needs a recorded status. Record one problem honestly to exercise the gate.
    if (id.startsWith('d1-lc-') && !recordedProblem) {
      await expect(complete).toBeDisabled();
      await expect(page.getByRole('link', { name: /Open on LeetCode/ })).toHaveAttribute('target', '_blank');
      await page.getByRole('button', { name: /Show hint 1/ }).click(); // a hint alone does not unlock it
      await expect(complete).toBeDisabled();
      await page.getByRole('group', { name: 'Problem status' }).getByRole('button', { name: 'Attempted' }).click();
      recordedProblem = true;
    }
    const nextLink = page.locator('.player-next a');
    await expect(nextLink).toBeVisible(); // the next activity is precomputed and linked
    if (await complete.isEnabled()) await complete.click();
    else await page.getByRole('button', { name: 'Skip for now' }).click();
    await page.waitForURL((u) => u.pathname !== `/study/${id}`);
  }

  // Every Day 1 activity was visited; the end-of-day review came last, after skipped items returned.
  const day1 = bootcampDays[0].activities.map((a) => a.id);
  const deferred = await (async () => { await page.goto('/'); return page.locator('.plan-row.deferred').count(); })();
  expect(seen.size).toBeGreaterThanOrEqual(day1.length - deferred);
  expect([...seen.keys()].at(-1)).toBe('d1-wrap-end-of-day');
  expect([...seen.values()].some((n) => n > 1)).toBe(true); // skipped work came back before the review
  await expect(page).toHaveURL(/\/$/);
  // Progress persisted: completed items show as done, and skipped gated items remain to do.
  await page.reload();
  await expect(page.locator('#today-activities .status', { hasText: 'Done' }).first()).toBeVisible();
  await expect(page.locator('#today-activities')).toContainText('Skipped');
});

test('every day’s first activity loads from its day card', async ({ page }) => {
  test.setTimeout(120_000);
  await onDay(page, '2026-11-25');
  for (const d of bootcampDays) {
    await page.goto('/');
    const card = page.getByRole('article', { name: new RegExp(`^Day ${d.day}:`) });
    await expect(card).toBeVisible();
    await card.getByRole('link', { name: /Start|Continue|Review/ }).click();
    await page.waitForURL(`**/study/${d.activities[0].id}`);
    await expectRealContent(page, d.activities[0].id);
    await expect(page.locator('.player-pos')).toContainText(`Day ${d.day} · Activity 1 of`);
  }
});
