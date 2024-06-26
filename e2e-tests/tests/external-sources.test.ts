import test, { expect, type BrowserContext, type Page } from '@playwright/test';
import { ExternalSources } from '../fixtures/ExternalSources';

let page: Page;
let context: BrowserContext;
let externalSources: ExternalSources;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();
  externalSources = new ExternalSources(page);
  await externalSources.goto();
});

test.afterEach(async () => {
  //await externalSources.deleteAllExternalSources(); TODO - this function is currently not implemented
});

test.afterAll(async () => {
  //await externalSources.deleteAllExternalSources(); TODO - this function is currently not implemented
  await page.close();
  await context.close();
});

test.describe.serial('External Sources', () => {
  test('Uploading an external source', async () => {
    await externalSources.uploadExternalSource();
    await expect(page.getByText('External Source Created')).toBeVisible();
  });

  test('Upload button should be enabled after entering a filepath', async () => {
    await externalSources.fillInputFile('');
    await expect(externalSources.uploadButton).not.toBeVisible();
    await externalSources.fillInputFile();
    await expect(externalSources.uploadButton).toBeVisible();
    await externalSources.fillInputFile('');
  });

  test('External event form should be shown when an event is selected', async () => {
    await page.getByRole('button', { name: 'Filter External Sources' }).click();
    await page.getByPlaceholder('Filter by Source Type').click();
    await page.getByRole('button', { name: 'Select 1 external source type' }).click();
    await page.getByRole('gridcell', { name: '1', exact: true }).nth(1).click();
    await page.getByRole('gridcell', { name: 'DSNContact:79/MMS/MMS3:54:X/' }).click();
    await expect(page.locator('#svelte div').filter({ hasText: 'Selected Event' }).nth(3)).toBeVisible();
    await expect(externalSources.inputFile).not.toBeVisible();
  });

  test('External source form should be shown when a source is selected', async () => {
    await page.getByRole('button', { name: 'Filter External Sources' }).click();
    await page.getByPlaceholder('Filter by Source Type').click();
    await page.getByRole('button', { name: 'Select 1 external source type' }).click();
    await page.getByRole('gridcell', { name: '1', exact: true }).nth(1).click();
    await expect(page.locator('.external-source-header-title-value')).toBeVisible();
    await expect(externalSources.externalEventSelectedForm).not.toBeVisible();
    await expect(externalSources.inputFile).not.toBeVisible();
  });

  test('External source deselection should be shown when an event is selected', async () => {
    await page.getByRole('button', { name: 'Filter External Sources' }).click();
    await page.getByPlaceholder('Filter by Source Type').click();
    await page.getByRole('button', { name: 'Select 1 external source type' }).click();
    await page.getByRole('gridcell', { name: '1', exact: true }).nth(1).click();
    await expect(page.getByLabel('Deselect source')).toBeVisible();
  });

  test('External event deselection should be shown when a source is selected', async () => {
    await page.getByRole('button', { name: 'Filter External Sources' }).click();
    await page.getByPlaceholder('Filter by Source Type').click();
    await page.getByRole('button', { name: 'Select 1 external source type' }).click();
    await page.getByRole('gridcell', { name: '1', exact: true }).nth(1).click();
    await page.getByRole('gridcell', { name: 'DSNContact:79/MMS/MMS3:54:X/' }).click();
    await expect(page.getByLabel('Deselect event')).toBeVisible();
  });

  test('External source upload form should be shown when no source or event is selected and no source has been set to upload', async () => {
    await expect(externalSources.inputFile).toBeVisible();
    await expect(externalSources.externalEventSelectedForm).not.toBeVisible();
    await expect(externalSources.externalSourceSelectedForm).not.toBeVisible();
  });
});
