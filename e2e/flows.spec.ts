import { expect, test, type Page } from '@playwright/test';

async function onDay(page: Page, iso: string) {
  await page.clock.setFixedTime(new Date(`${iso}T10:00:00`));
}

test.describe('bootcamp home', () => {
  test('Nov 25 shows Day 1, the countdown, objectives, ordered activities, Continue Studying and 7 day cards', async ({ page }) => {
    await onDay(page, '2026-11-25');
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Day 1 of 7');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Arrays, strings and hashing');
    await expect(page.locator('.hero-side')).toContainText('7 days remaining');
    await expect(page.getByRole('heading', { name: /Today’s objectives/ })).toBeVisible();
    const list = page.locator('#today-activities');
    for (const title of ['Frequency maps', '1. Two Sum', '13. Roman to Integer', 'OOP challenge: Phone book', 'End-of-day review']) await expect(list).toContainText(title);
    await expect(list.locator('.badge', { hasText: 'Core' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue Studying' })).toHaveAttribute('href', '/study/d1-lesson-hashing-frequency-maps');
    await expect(page.locator('.day-card')).toHaveCount(7);
    await expect(page.locator('.day-card.featured')).toContainText('Day 1');
  });

  test('hours setting defers optional work and persists', async ({ page }) => {
    await onDay(page, '2026-11-25');
    await page.goto('/');
    await page.getByLabel('Hours available per day').selectOption('4');
    await expect(page.locator('.hero-meta')).toContainText(/deferred to fit 4 h/);
    await page.reload();
    await expect(page.getByLabel('Hours available per day')).toHaveValue('4');
    await expect(page.locator('.plan-row.deferred').first()).toBeVisible();
  });

  test('a problem solved earlier becomes a retention check; completing a problem needs a recorded status', async ({ page }) => {
    await onDay(page, '2026-11-21');
    await page.goto('/tracker/1');
    await page.getByRole('group', { name: 'Problem status' }).getByRole('button', { name: 'Solved Independently' }).click();
    await onDay(page, '2026-11-25');
    await page.goto('/');
    await expect(page.locator('#today-activities')).toContainText('Retention check: 1. Two Sum');
    await page.goto('/study/d1-lc-1');
    await expect(page.locator('.callout', { hasText: 'Retention check' })).toBeVisible();
    const complete = page.getByRole('button', { name: 'Complete & Continue' });
    await expect(complete).toBeDisabled();
    await page.getByRole('group', { name: 'Problem status' }).getByRole('button', { name: 'Solved With Help' }).click();
    await expect(complete).toBeEnabled();
    await complete.click();
    await expect(page).toHaveURL(/\/study\/d1-lc-13$/);
    // The failed retention comes back in the next day's mistake review.
    await onDay(page, '2026-11-26');
    await page.goto('/study/d2-review-mistakes');
    await expect(page.locator('.player-body')).toContainText('1. Two Sum');
  });

  test('interview day shows the checklist; after the date there is no fake countdown', async ({ page }) => {
    await onDay(page, '2026-12-02');
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Interview-day checklist' })).toBeVisible();
    await onDay(page, '2026-12-09');
    await page.goto('/');
    await expect(page.locator('.hero')).toContainText(/Interview was 7 days ago/);
    await expect(page.locator('.hero')).not.toContainText('remaining');
  });
});

test.describe('tracker persistence and review', () => {
  test('recording "Solved With Help" persists across reload and feeds the review queue', async ({ page }) => {
    await onDay(page, '2026-11-21');
    await page.goto('/tracker/49');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('49. Group Anagrams');
    await expect(page.getByRole('link', { name: 'Canonical keys' }).or(page.getByText('Grouping with canonical keys')).first()).toBeVisible();
    await page.getByRole('button', { name: 'Solved With Help' }).click();
    await page.getByLabel(/Approach you used/).fill('tuple of 26 counts as key');
    await page.getByLabel('Time complexity').fill('O(n·k)');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Solved With Help' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByLabel(/Approach you used/)).toHaveValue('tuple of 26 counts as key');
    await expect(page.getByLabel('Time complexity')).toHaveValue('O(n·k)');

    // Next day it is due for review and tracked separately from independent solves.
    await onDay(page, '2026-11-22');
    await page.goto('/review');
    await expect(page.locator('section', { hasText: 'Due now' })).toContainText('49. Group Anagrams');
    await expect(page.locator('section', { hasText: 'Solved with help (1)' })).toContainText('Group Anagrams');
  });

  test('rescheduling moves a problem to a new day', async ({ page }) => {
    await onDay(page, '2026-11-21');
    await page.goto('/tracker/1');
    await page.getByLabel('Move to date').fill('2026-11-23');
    await expect(page.getByText(/Rescheduled to/)).toBeVisible();
    await page.goto('/tracker');
    await expect(page.getByRole('region', { name: 'Mon, Nov 23' })).toContainText('1. Two Sum');
    await expect(page.getByRole('region', { name: 'Sat, Nov 21' })).not.toContainText('1. Two Sum');
  });
});

test.describe('learning tools', () => {
  test('lesson knowledge check gives feedback and lesson can be completed', async ({ page }) => {
    await page.goto('/learn/hashing/canonical-keys');
    await expect(page.getByRole('heading', { name: /What is this concept/ })).toBeVisible();
    await page.locator('#check .choice').first().click();
    await expect(page.locator('#check [role="status"]').first()).toBeVisible();
    await page.getByRole('button', { name: 'Mark complete' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();
  });

  test('visualizer steps forward', async ({ page }) => {
    await page.goto('/learn/linked-lists/reverse');
    const viz = page.locator('.viz');
    await expect(viz).toContainText('Step 1 of 4');
    await viz.getByRole('button', { name: 'Next' }).click();
    await expect(viz).toContainText('Step 2 of 4');
  });

  test('Big-O drill hides the derivation until submitted', async ({ page }) => {
    await page.goto('/big-o/sliding-window-amortized');
    await expect(page.getByText('Step-by-step derivation')).toHaveCount(0);
    await page.getByRole('group', { name: 'Time complexity' }).getByRole('button', { name: 'O(n²)' }).click();
    await page.getByRole('group', { name: 'Space complexity' }).getByRole('button').first().click();
    await page.locator('.choice').first().click();
    await page.getByLabel(/Explain why/).fill('for loop with a nested while loop over the string');
    await page.getByRole('button', { name: 'Submit analysis' }).click();
    await expect(page.getByText('Step-by-step derivation')).toBeVisible();
    await expect(page.getByText(/Time: O\(n\)/)).toBeVisible();
    await expect(page.getByText(/Common trap/)).toBeVisible();
  });

  test('decoder requires commitment before revealing guidance; digit task is labeled', async ({ page }) => {
    await page.goto('/patterns/decoder');
    const card = page.locator('#decode-digit-groups');
    await expect(card).toContainText(/Candidate-reported problem reconstruction/);
    const reveal = card.getByRole('button', { name: /Reveal guided explanation/ });
    await expect(reveal).toBeDisabled();
    await card.locator('.tok', { hasText: 'rearranging' }).click();
    await card.getByLabel(/Input/).fill('list of ints');
    await card.getByLabel('Expected output').fill('groups');
    await card.getByRole('group', { name: /data structure/ }).getByRole('button').first().click();
    await card.getByRole('group', { name: /algorithmic pattern/ }).getByRole('button').first().click();
    await card.getByRole('group', { name: /time complexity/ }).getByRole('button').first().click();
    await reveal.click();
    await expect(card).toContainText('Guided explanation');
  });

  test('searching "permutation" finds definition, lessons and problems', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('searchbox', { name: /Search lessons/ }).fill('permutation');
    await page.getByRole('searchbox', { name: /Search lessons/ }).press('Enter');
    await expect(page).toHaveURL(/\/search\?q=permutation/);
    await expect(page.getByRole('heading', { name: 'Definitions' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Permutation', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '46. Permutations' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Permutations and factorials/ })).toBeVisible();
  });

  test('no horizontal page scroll on key pages', async ({ page }) => {
    for (const path of ['/', '/study/d1-lc-13', '/study/d4-visual-recursion-call-stack', '/study/d1-vocab-hashing', '/learn/recursion/permutations', '/tracker', '/dictionary', '/big-o/group-anagrams-count', '/mock/digit-buckets']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(1);
      // Content clipped inside the main column counts too (it would be cut off rather than scroll).
      const clipped = await page.evaluate(() => { const m = document.querySelector('main')!; return m.scrollWidth - m.clientWidth; });
      expect(clipped, `${path} main`).toBeLessThanOrEqual(1);
    }
  });
});

test.describe('navigation and focused exercises', () => {
  test('mobile drawer opens from the menu button, closes with Escape and on navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'drawer is mobile-only');
    await page.goto('/');
    const menu = page.getByRole('button', { name: 'Open navigation' });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('link', { name: 'LeetCode Tracker' })).toBeHidden();
    await menu.click();
    await expect(page.getByRole('link', { name: 'LeetCode Tracker' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('link', { name: 'LeetCode Tracker' })).toBeHidden();
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('link', { name: 'LeetCode Tracker' }).click();
    await expect(page).toHaveURL(/\/tracker$/);
    await expect(page.getByRole('link', { name: 'LeetCode Tracker' })).toBeHidden();
  });

  test('desktop sidebar marks the active section', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'desktop sidebar');
    await page.goto('/big-o/sum-list');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Big-O Lab' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Bootcamp' })).not.toHaveAttribute('aria-current', 'page');
    await expect(nav).toContainText('Reference Library');
    await page.goto('/study/d1-lc-13');
    await expect(nav.getByRole('link', { name: 'Bootcamp' })).toHaveAttribute('aria-current', 'page');
  });

  test('pattern deep link opens exactly that exercise; others stay collapsed', async ({ page }) => {
    await page.goto('/patterns#count-subarrays-k');
    await expect(page.locator('#count-subarrays-k .exercise-head')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.exercise-head[aria-expanded="true"]')).toHaveCount(1);
    await expect(page.locator('#count-subarrays-k')).toContainText('Values can be negative');
    await page.locator('#list-cycle .exercise-head').click();
    await expect(page.locator('#list-cycle .exercise-head')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#count-subarrays-k .exercise-head')).toHaveAttribute('aria-expanded', 'false');
  });

  test('mock session steps through one question at a time and keeps answers', async ({ page }) => {
    await page.goto('/mock/digit-buckets');
    await expect(page.getByText('0/10 steps answered').first()).toBeVisible();
    await page.getByRole('textbox', { name: 'Clarify the problem' }).fill('Group numbers by digit multiset; ask about negatives.');
    await page.getByRole('button', { name: /Next step/ }).click();
    await expect(page.getByRole('textbox', { name: 'Inputs and outputs' })).toBeVisible();
    await expect(page.getByText('1/10 steps answered').first()).toBeVisible();
    await page.getByRole('button', { name: /Back/ }).click();
    await expect(page.getByRole('textbox', { name: 'Clarify the problem' })).toHaveValue(/digit multiset/);
    await page.getByRole('button', { name: 'Reveal talking points' }).click();
    await expect(page.getByText('Talking points')).toBeVisible();
  });

  test('lesson table of contents highlights the section being read', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'TOC is hidden on small screens');
    await page.goto('/learn/hashing/canonical-keys#complexity');
    await expect(page.locator('.lesson-toc a[aria-current="true"]')).toContainText('Time and space complexity');
  });
});

