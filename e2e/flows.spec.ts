import { expect, test, type Page } from '@playwright/test';

async function onDay(page: Page, iso: string) {
  await page.clock.setFixedTime(new Date(`${iso}T10:00:00`));
}

test.describe('daily dashboard', () => {
  test('shows Nov 21 plan, countdown, sequence and assigned problems', async ({ page }) => {
    await onDay(page, '2026-11-21');
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Day 1 of 12');
    await expect(page.getByText('11', { exact: true }).first()).toBeVisible();
    for (const label of ['Learn', 'Understand vocabulary', 'Analyze complexity', 'Recognize pattern', 'Solve on LeetCode', 'Review']) {
      await expect(page.locator('.seq-step', { hasText: label })).toBeVisible();
    }
    const solve = page.locator('#today-problems');
    await expect(solve).toContainText('Daily target: 3');
    for (const title of ['242. Valid Anagram', '49. Group Anagrams', '1. Two Sum']) await expect(solve).toContainText(title);
    await expect(solve.getByRole('link', { name: /LeetCode/ }).first()).toHaveAttribute('href', /^https:\/\/leetcode\.com\/problems\//);
  });

  test('interview day shows the checklist; after the date there is no fake countdown', async ({ page }) => {
    await onDay(page, '2026-12-02');
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Interview-day checklist' })).toBeVisible();
    await onDay(page, '2026-12-09');
    await page.goto('/');
    await expect(page.locator('.hero')).toContainText(/Interview was 7 days ago/);
    await expect(page.locator('.hero')).not.toContainText('to go');
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

  test('dashboard sequence updates when today’s problem is solved', async ({ page }) => {
    await onDay(page, '2026-11-21');
    await page.goto('/tracker/242');
    await page.getByRole('button', { name: 'Solved Independently' }).click();
    await page.goto('/');
    await expect(page.locator('.seq-step', { hasText: 'Solve on LeetCode' })).toContainText('1/3');
  });

  test('rescheduling moves a problem to a new day', async ({ page }) => {
    await onDay(page, '2026-11-21');
    await page.goto('/tracker/1');
    await page.getByLabel('Move to date').fill('2026-11-23');
    await expect(page.getByText(/Rescheduled to/)).toBeVisible();
    await page.goto('/');
    await expect(page.locator('#today-problems')).not.toContainText('1. Two Sum');
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
    for (const path of ['/', '/learn/recursion/permutations', '/tracker', '/dictionary', '/big-o/group-anagrams-count', '/mock/digit-buckets']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
  });
});
