import test, { expect, type BrowserContext, type Page } from '@playwright/test';
import { ExternalSources } from '../fixtures/ExternalSources';

let page: Page;
let context: BrowserContext;
let externalSources: ExternalSources;

test.beforeEach(async () => {
  await externalSources.goto(); // Refresh page to reset the view
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
    await expect(page.getByText('External Events Table Timeline')).toBeVisible();
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

  test('Selected external source should show metadata in a collapsible', async () => {
    await externalSources.selectSource();
    await externalSources.viewEventSourceMetadata.click();
    await expect(page.getByText('0', { exact: true })).toBeVisible();
    await expect(page.getByText('1', { exact: true })).toBeVisible();
    await expect(page.getByText('2', { exact: true })).toBeVisible();
    await expect(page.getByText('3', { exact: true })).toBeVisible();
    await expect(page.getByText('version')).toBeVisible();
    await expect(page.getByText('wrkcat')).toBeVisible();
  });

  test('Selected external source should show event types in a collapsible', async () => {
    await externalSources.selectSource();
    await externalSources.viewContainedEventTypes.click();
    await expect(page.locator('i')).toBeVisible();
  });

  test('External event table and timeline should be accessible while a source is selected', async () => {
    await externalSources.selectSource();
    await expect(externalSources.externalEventTableHeaderID).toBeVisible();
    await expect(externalSources.externalEventTableHeaderEventType).toBeVisible();
    await expect(externalSources.externalEventTableHeaderSourceID).toBeVisible();
    await expect(externalSources.externalEventTableHeaderDuration).toBeVisible();
    await externalSources.toggleTimeline.click();
    await expect(externalSources.timelineHeader).toBeVisible();
  });

  test('Deleting an external source', async () => {
    await externalSources.deleteSource();
    await expect(page.getByText('External Source Deleted')).toBeVisible();
    await expect(externalSources.inputFile).toBeVisible();
    await expect(externalSources.externalEventSelectedForm).not.toBeVisible();
    await expect(externalSources.externalSourceSelectedForm).not.toBeVisible();
  });
});
