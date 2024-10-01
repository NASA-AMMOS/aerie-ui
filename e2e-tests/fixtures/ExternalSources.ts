import { expect, type Locator, type Page } from '@playwright/test';
export class ExternalSources {
  alertError: Locator;
  closeButton: Locator;
  deleteSourceButton: Locator;
  deleteSourceButtonConfirmation: Locator;
  derivationTestFile1: string = 'e2e-tests/data/external-event-derivation-1.json';
  derivationTestFile2: string = 'e2e-tests/data/external-event-derivation-2.json';
  derivationTestFile3: string = 'e2e-tests/data/external-event-derivation-3.json';
  derivationTestFile4: string = 'e2e-tests/data/external-event-derivation-4.json';
  derivationTestFileKey1: string = 'external-event-derivation-1.json';
  derivationTestFileKey2: string = 'external-event-derivation-2.json';
  derivationTestFileKey3: string = 'external-event-derivation-3.json';
  derivationTestFileKey4: string = 'external-event-derivation-4.json';
  deselectEventButton: Locator;
  deselectSourceButton: Locator;
  exampleDerivationSourceType: string = 'Derivation Test';
  exampleSourceType: string = 'Example External Source';
  externalEventSelectedForm: Locator;
  externalEventTableHeaderDuration: Locator;
  externalEventTableHeaderEventType: Locator;
  externalEventTableRow: Locator;
  externalSourceFileName: string = 'example-external-source.json';
  externalSourceFilePath: string = 'e2e-tests/data/example-external-source.json';
  externalSourceFilePathMissingField: string = 'e2e-tests/data/example-external-source-missing-field.json';
  externalSourceFilePathSyntaxError: string = 'e2e-tests/data/example-external-source-syntax-error.json';
  externalSourceSelectedForm: Locator;
  externalSourceUpload: Locator;
  externalSourcesTable: Locator;
  inputFile: Locator;
  nameInput: Locator;
  panelExternalEventsTable: Locator;
  saveButton: Locator;
  selectEventTableView: Locator;
  toastTimeout: number = 5500; // How long to wait for a toast to disappear - they should take 5000ms, 500 extra for buffer
  uploadButton: Locator;
  viewContainedEventTypes: Locator;
  viewEventSourceMetadata: Locator;

  constructor(public page: Page) {
    this.updatePage(page);
  }

  async close() {
    await this.closeButton.click();
  }

  async deleteSource(sourceName: string) {
    await this.selectSource(sourceName);
    await this.deleteSourceButton.click();
    await this.deleteSourceButtonConfirmation.click();
    await expect(this.externalSourcesTable.getByText(sourceName)).not.toBeVisible();
  }

  async fillInputFile(externalSourceFilePath: string) {
    await this.inputFile.focus();
    await this.inputFile.setInputFiles(externalSourceFilePath);
    await this.inputFile.evaluate(e => e.blur());
  }

  async getCanvasPixelData() {
    await this.page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (canvas !== null && canvas !== undefined) {
        const context = canvas.getContext('2d');
        if (context !== null && context !== undefined) {
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          return imageData.data;
        }
      }
    });
    return null;
  }

  async goto() {
    await this.page.goto('/external-sources', { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(250);
  }

  async selectEvent() {
    // Assumes the selected source was the test source, and selects the specific event from it
    // NOTE: This may not be the case, and should be re-visited when we implement deletion for External Sources!
    await this.selectSource();
    await this.page.getByRole('gridcell', { name: 'ExampleEvent:1/sc/sc1:1' }).click();
  }

  async selectSource(sourceName: string = 'example-external-source.json') {
    // Always selects the first source with the example's source type in the table
    await this.page.getByRole('gridcell', { name: sourceName }).first().click();
  }

  async updatePage(page: Page): Promise<void> {
    this.inputFile = page.locator('input[name="file"]');
    this.uploadButton = page.getByRole('button', { name: 'Upload' });
    this.externalEventSelectedForm = page.locator('.external-event-form-container');
    this.externalSourceSelectedForm = page.locator('.selected-external-source-details');
    this.alertError = page.locator('.alert-error');
    this.deselectEventButton = page.locator('[name="DeselectEvent"]');
    this.deselectSourceButton = page.getByLabel('Deselect Source');
    this.deleteSourceButton = page.getByRole('button', { exact: true, name: 'Delete external source' });
    this.deleteSourceButtonConfirmation = page.getByRole('button', { exact: true, name: 'Delete' });
    this.selectEventTableView = page.locator('[name="SelectEventViewType"]');
    this.externalEventTableHeaderEventType = page.getByText('Event Type', { exact: true });
    this.externalEventTableHeaderDuration = page.getByText('Duration');
    this.viewContainedEventTypes = page.getByRole('button', { name: 'View Contained Event Types' });
    this.viewEventSourceMetadata = page.getByRole('button', { name: 'View Event Source Metadata' });
    this.panelExternalEventsTable = page.locator('[data-component-name="ExternalEventsTablePanel"]');
    this.externalSourcesTable = page.locator('#external-sources-table');
  }

  async uploadExternalSource(
    inputFilePath: string = this.externalSourceFilePath,
    inputFileName: string = this.externalSourceFileName,
  ) {
    await this.fillInputFile(inputFilePath);
    await this.uploadButton.click();
    await expect(this.externalSourcesTable).toBeVisible();
    await expect(this.externalSourcesTable.getByRole('gridcell', { name: inputFileName })).toBeVisible();
  }
}
