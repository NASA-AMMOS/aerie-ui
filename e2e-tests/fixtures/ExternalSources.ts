import { type Locator, type Page } from '@playwright/test';
export class ExternalSources {
  alertError: Locator;
  closeButton: Locator;
  deleteSourceButton: Locator;
  deleteSourceButtonConfirmation: Locator;
  derivationTestFile1: string = 'e2e-tests/data/external-event-derivation-1.json';
  derivationTestFile2: string = 'e2e-tests/data/external-event-derivation-2.json';
  derivationTestFile3: string = 'e2e-tests/data/external-event-derivation-3.json';
  derivationTestFile4: string = 'e2e-tests/data/external-event-derivation-4.json';
  derivationTestFileKey1: string = 'Derivation_Test_00.json';
  derivationTestFileKey2: string = 'Derivation_Test_01.json';
  derivationTestFileKey3: string = 'Derivation_Test_02.json';
  derivationTestFileKey4: string = 'Derivation_Test_03.json';
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
  externalSourceTableRow: Locator;
  externalSourceUpload: Locator;
  externalSourcesTable: Locator;
  inputFile: Locator;
  nameInput: Locator;
  panelExternalEventsTable: Locator;
  saveButton: Locator;
  selectEventTableView: Locator;
  timelineHeader: Locator;
  toastTimeout: number = 5500; // How long to wait for a toast to disappear - they should take 5000ms, 500 extra for buffer
  toggleTimeline: Locator;
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
    // Assumes a source has already been uploaded and it is the first row in the table
    await this.selectSource(sourceName);
    await this.deleteSourceButton.click();
    await this.deleteSourceButtonConfirmation.click();
    await this.page.getByText('External Source Deleted').waitFor({ state: 'visible' });
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

  async getNonZeroPixelsOnCanvas() {
    let nonZeroPixels: number[] = [];
    const pixelData = await this.getCanvasPixelData();
    if (pixelData !== null) {
      const pixelArray: number[] = Array.from(pixelData);
      const pixelSet = new Set<number>(pixelArray);
      nonZeroPixels = Array.from(pixelSet);
    }
    return nonZeroPixels;
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
    if (!this.page.getByRole('gridcell', { name: sourceName }).first().isVisible()) {
      await this.selectSourceFilter();
    }
    await this.page.getByRole('gridcell', { name: sourceName }).first().click();
  }

  async selectSourceFilter() {
    // Always selects all sources as the filter
    await this.page.getByPlaceholder('Filter by Source Type').click();
    await this.page.locator('#source-filters-select-all').click();
    await this.page.keyboard.press('Escape'); // Un-focus the filter menu
  }

  async updatePage(page: Page): Promise<void> {
    this.externalSourceTableRow = page.locator(`.ag-row:has-text("${this.externalSourceKey}")`);
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
    this.timelineHeader = page.getByText(
      'Fri Dec 31 2021 19:00:00 GMT-0500 (Eastern Standard Time) Sat Jan 01 2022 19:00',
    );
    this.externalEventTableHeaderEventType = page.getByText('Event Type', { exact: true });
    this.externalEventTableHeaderDuration = page.getByText('Duration');
    this.toggleTimeline = page.getByRole('radio', { name: 'Timeline' });
    this.viewContainedEventTypes = page.getByRole('button', { name: 'View Contained Event Types' });
    this.viewEventSourceMetadata = page.getByRole('button', { name: 'View Event Source Metadata' });
    this.panelExternalEventsTable = page.locator('[data-component-name="ExternalEventsTablePanel"]');
  }

  async uploadExternalSource(inputFilePath: string = this.externalSourceFilePath, waitForSuccess: boolean = true) {
    await this.fillInputFile(inputFilePath);
    await this.uploadButton.click();
    if (waitForSuccess === true) {
      await this.page.getByText('External Source Created').waitFor({ state: 'visible' });
    }
  }
}
