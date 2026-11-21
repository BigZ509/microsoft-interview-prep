import { expect, test } from '@playwright/test';

/**
 * The full daily loop on Nov 21:
 * learn a concept → understand terminology → identify the pattern → analyze Big-O
 * → solve the assigned LeetCode problem → record progress → revisit a miss.
 */
test('learn → vocabulary → pattern → Big-O → solve → record → review', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-21T10:00:00'));
  const step = (label: string) => page.locator('.seq-step', { hasText: label });

  // 1. Start from the dashboard and open today's canonical-keys lesson.
  await page.goto('/');
  await expect(step('Learn')).toContainText('0/9');
  await page.locator('#today-lessons').getByRole('link', { name: /Grouping with canonical keys/ }).click();
  await expect(page).toHaveURL(/\/learn\/hashing\/canonical-keys/);
  await page.locator('#check .choice').nth(1).click(); // Q1: correct answer is B ('eilnst')
  await expect(page.locator('#check [role="status"]').first()).toContainText('Correct');
  await page.getByRole('button', { name: 'Mark complete' }).click();

  // 2. Terminology: the term page teaches the decision checks, then a knowledge check.
  await page.goto('/dictionary/canonical-key');
  await expect(page.getByText('Check before choosing')).toBeVisible();
  await page.locator('.choice').nth(1).click();

  // 3. Pattern recognition with a reason.
  await page.goto('/patterns');
  const sc = page.locator('#group-digit-perms');
  await sc.getByRole('button', { name: 'Backtracking' }).click(); // the keyword trap
  await sc.getByLabel(/Why does this pattern fit/).fill('it says rearrangements so generate permutations');
  await sc.getByRole('button', { name: 'Check my reasoning' }).click();
  await expect(sc).toContainText('A different pattern fits better');

  // 4. Big-O drill.
  await page.goto('/big-o/group-anagrams-count');
  await page.getByRole('group', { name: 'Time complexity' }).getByRole('button', { name: 'O(n · k)', exact: true }).click();
  await page.getByRole('group', { name: 'Space complexity' }).getByRole('button', { name: 'O(n · k)', exact: true }).click();
  await page.locator('.choice').nth(1).click();
  await page.getByLabel(/Explain why/).fill('n words, each counted in O(k); the 26-slot key is constant');
  await page.getByRole('button', { name: 'Submit analysis' }).click();
  await expect(page.getByText('Time: O(n · k)')).toBeVisible();

  // 5–6. Prep page → LeetCode link → record the result.
  await page.goto('/tracker/49');
  await expect(page.getByRole('link', { name: /Open on LeetCode/ })).toHaveAttribute('href', 'https://leetcode.com/problems/group-anagrams/');
  await expect(page.getByRole('link', { name: /Grouping with canonical keys/ })).toBeVisible(); // prerequisite lesson
  await page.getByRole('button', { name: 'Solved Independently' }).click();
  await page.getByLabel(/Approach you used/).fill('defaultdict(list) keyed by tuple of 26 counts');

  // Dashboard reflects every step.
  await page.goto('/');
  await expect(step('Learn')).toContainText('1/9');
  await expect(step('Understand vocabulary')).toContainText('1/7');
  await expect(step('Analyze complexity')).toContainText('1/6');
  await expect(step('Recognize pattern')).toContainText('1/3');
  await expect(step('Solve on LeetCode')).toContainText('1/3');

  // 7. The missed pattern is queued for review; retrying it keeps the miss history.
  await page.goto('/review');
  await expect(page.locator('section', { hasText: 'Due now' })).toContainText('Group a list of three-digit integers');
  await page.goto('/patterns');
  await expect(sc).toContainText('Last: revisit'); // the earlier miss is remembered; the card is ready for a new attempt
  await sc.getByRole('button', { name: 'Hash map' }).click();
  await sc.getByLabel(/Why does this pattern fit/).fill('group by a canonical digit-count key');
  await sc.getByRole('button', { name: 'Check my reasoning' }).click();
  await expect(sc).toContainText('Strong choice');
  await page.goto('/review');
  await expect(page.locator('section', { hasText: 'Recovered' })).toContainText('missed 1×');
  await page.goto('/');
  await expect(step('Learn')).toContainText('1/9'); // earlier progress intact
  await expect(step('Solve on LeetCode')).toContainText('1/3');
});
