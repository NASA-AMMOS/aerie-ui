import test, { expect, type BrowserContext, type Page } from '@playwright/test';
import { ExternalSources } from '../fixtures/ExternalSources';

let page: Page;
let context: BrowserContext;
let externalSources: ExternalSources;

/** Note: These tests should probably delete all External Sources & (optionally) re-upload the example source between iterations. Requires deletion to be implemented!
test.afterEach(async () => {
});
*/

test.beforeEach(async () => {
  await externalSources.goto();  // Refresh page to reset the view
});

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();
  externalSources = new ExternalSources(page);
  await externalSources.goto();
});

test.afterAll(async () => {
  await page.close();
  await context.close();
});

test.describe.serial('External Sources', () => {
  test('Uploading an external source', async () => {
    await externalSources.uploadExternalSource();
    await expect(page.getByText('External Source Created')).toBeVisible();
  });

  test('Upload button should be enabled after entering a filepath', async () => {
    await externalSources.fillInputFile();
    await expect(externalSources.uploadButton).toBeVisible();
  });

  test('External event form should be shown when an event is selected', async () => {
    await externalSources.selectEvent();
    await expect(page.locator('#svelte div').filter({ hasText: 'Selected Event' }).nth(3)).toBeVisible();
    await expect(externalSources.inputFile).not.toBeVisible();
  });

  test('External source form should be shown when a source is selected', async () => {
    await externalSources.selectSource();
    await expect(page.locator('.external-source-header-title-value')).toBeVisible();
    await expect(externalSources.externalEventSelectedForm).not.toBeVisible();
    await expect(externalSources.inputFile).not.toBeVisible();
  });

  test('External source deselection should be shown when an event is selected', async () => {
    await externalSources.selectSource();
    await expect(page.getByLabel('Deselect source')).toBeVisible();
  });

  test('External event deselection should be shown when a source is selected', async () => {
    await externalSources.selectEvent();
    await expect(page.getByLabel('Deselect event')).toBeVisible();
  });

  test('External source upload form should be shown when no source or event is selected and no source has been set to upload', async () => {
    await expect(externalSources.inputFile).toBeVisible();
    await expect(externalSources.externalEventSelectedForm).not.toBeVisible();
    await expect(externalSources.externalSourceSelectedForm).not.toBeVisible();
  });
});
