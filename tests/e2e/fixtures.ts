import { test as baseTest } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export const test = baseTest.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() =>
      window.addEventListener('beforeunload', () =>
        (window as any).collectIstanbulCoverage(JSON.stringify((window as any).__coverage__))
      )
    );

    await fs.promises.mkdir('coverage/e2e', { recursive: true });

    await context.exposeBinding('collectIstanbulCoverage', async (_, coverageJSON) => {
      if (coverageJSON) {
        await fs.promises.writeFile(
          path.join('coverage/e2e', `coverage-${Date.now()}.json`),
          coverageJSON
        );
      }
    });

    await use(context);

    for (const page of context.pages()) {
      const coverage = await page.evaluate(() => (window as any).__coverage__);
      if (coverage) {
        await fs.promises.writeFile(
          path.join('coverage/e2e', `coverage-final-${Date.now()}.json`),
          JSON.stringify(coverage)
        );
      }
    }
  },
});

export { expect } from '@playwright/test';
