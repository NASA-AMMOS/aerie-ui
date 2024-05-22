import test, { type BrowserContext, type Page } from '@playwright/test';
import { Dictionaries } from '../fixtures/Dictionaries.js';
let context: BrowserContext;
let dictionaries: Dictionaries;
let page: Page;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();
  dictionaries = new Dictionaries(page);
  await dictionaries.goto();
});

test.afterAll(async () => {
  await page.close();
  await context.close();
});

test.describe('Dictionaries', () => {
  test.describe.serial('Channel Dictionary', () => {
    test('Create channel dictionary', async () => {
      await dictionaries.createChannelDictionary();
    });

    test('Delete channel dictionary', async () => {
      await dictionaries.deleteChannelDictionary();
    });
  });

  test.describe.serial('Command Dictionary', () => {
    test('Create command dictionary', async () => {
      await dictionaries.createCommandDictionary();
    });

    test('Delete command dictionary', async () => {
      await dictionaries.deleteCommandDictionary();
    });
  });
});
