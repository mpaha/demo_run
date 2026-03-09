import { test, expect } from '@playwright/test';

test.describe('Tetris E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with title and start overlay', async ({ page }) => {
    await expect(page.locator('h1.title')).toHaveText('TETRIS');
    const overlay = page.locator('.start-panel');
    await expect(overlay).toBeVisible();
    await expect(overlay.locator('.start-btn')).toHaveText('START');
  });

  test('start game hides overlay and shows score/level/lines at 0', async ({ page }) => {
    await page.click('.start-btn');
    await expect(page.locator('.start-panel')).not.toBeVisible();
    await expect(page.locator('.board')).toBeVisible();

    // Score, Level, Lines should all show 0
    const sidebar = page.locator('.sidebar').last();
    const stats = sidebar.locator('.stat');
    await expect(stats.nth(0)).toHaveText('0'); // score
    await expect(stats.nth(1)).toHaveText('0'); // level
    await expect(stats.nth(2)).toHaveText('0'); // lines
  });

  test('keyboard controls do not crash and pause works', async ({ page }) => {
    await page.click('.start-btn');
    await expect(page.locator('.board')).toBeVisible();

    // Press movement keys
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');

    // Game should still be running (board visible, no overlay)
    await expect(page.locator('.board')).toBeVisible();
    await expect(page.locator('.overlay')).not.toBeVisible();

    // Pause
    await page.keyboard.press('p');
    await expect(page.locator('.overlay-text')).toHaveText('PAUSED');

    // Unpause
    await page.keyboard.press('p');
    await expect(page.locator('.overlay')).not.toBeVisible();
  });

  test('hold piece with C key', async ({ page }) => {
    await page.click('.start-btn');

    // Before holding, HOLD panel shows "-"
    await expect(page.locator('.empty-hold')).toHaveText('-');

    // Press C to hold
    await page.keyboard.press('c');

    // The empty-hold "-" should be gone, replaced by a preview
    await expect(page.locator('.empty-hold')).not.toBeVisible();
    await expect(page.locator('.sidebar-left .preview')).toBeVisible();
  });

  test('hard drop spam leads to game over', async ({ page }) => {
    await page.click('.start-btn');
    await expect(page.locator('.board')).toBeVisible();

    // Spam space to hard-drop pieces until game over
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(50);
    }

    // Game over overlay should appear
    await expect(page.locator('.overlay-text')).toHaveText('GAME OVER', { timeout: 10000 });
    await expect(page.locator('.final-score')).toBeVisible();
    await expect(page.locator('button:has-text("PLAY AGAIN")')).toBeVisible();
  });

  test('leaderboard toggle', async ({ page }) => {
    // Click TOP SCORES button
    await page.click('.leaderboard-btn');
    await expect(page.locator('.leaderboard')).toBeVisible();
    await expect(page.locator('.leaderboard h2')).toHaveText('LEADERBOARD');
  });
});
