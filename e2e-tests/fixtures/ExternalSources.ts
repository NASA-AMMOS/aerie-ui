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
  deselectEventButton: Locator;
  deselectSourceButton: Locator;
  externalEventSelectedForm: Locator;
  externalEventTableHeaderDuration: Locator;
  externalEventTableHeaderEventType: Locator;
  externalEventTableHeaderID: Locator;
  externalEventTableHeaderSourceID: Locator;
  externalEventTableRow: Locator;
  externalSourceFileName: string = 'example-external-source.json';
  externalSourceFilePath: string = 'e2e-tests/data/example-external-source.json';
  externalSourceFilePathMissingField: string = 'e2e-tests/data/example-external-source-missing-field.json';
  externalSourceFilePathSyntaxError: string = 'e2e-tests/data/example-external-source-syntax-error.json';
  externalSourceId: string;
  externalSourceKey: string = 'DSN_CONTACT_CONFIRMED:DSNCONFIRMED_04.json';
  externalSourceSelectedForm: Locator;
  externalSourceTableRow: Locator;
  externalSourceUpload: Locator;
  externalSourcesTable: Locator;
  inputFile: Locator;
  nameInput: Locator;
  panelExternalEventsTable: Locator;
  saveButton: Locator;
  selectEventTableView: Locator;
  tableRowExternalSourceId: Locator;
  timelineHeader: Locator;
  toggleTimeline: Locator;
  uploadButton: Locator;
  viewContainedEventTypes: Locator;
  viewEventSourceMetadata: Locator;

  constructor(public page: Page) {
    this.externalSourceId = '';
    this.updatePage(page);
  }

  async close() {
    await this.closeButton.click();
  }

  async deleteSource(sourceName: string | undefined) {
    const source: string = sourceName !== undefined ? sourceName : 'example-external-source.json';
    // Assumes a source has already been uploaded and it is the first row in the table
    await this.selectSource(source);
    await this.deleteSourceButton.click();
    await this.deleteSourceButtonConfirmation.click();
    await this.page.getByText('External Source Deleted').waitFor({ state: 'visible' });
  }

  async fillInputFile(externalSourceFilePath: string) {
    await this.inputFile.focus();
    await this.inputFile.setInputFiles(externalSourceFilePath);
    await this.inputFile.evaluate(e => e.blur());
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
    this.tableRowExternalSourceId = page.locator(`.ag-row:has-text("${this.externalSourceFilePath}") > div >> nth=0`);
    this.externalEventSelectedForm = page.locator('.external-event-form-container');
    this.externalSourceSelectedForm = page.locator('.selected-external-source-details');
    this.alertError = page.locator('.alert-error');
    this.deselectEventButton = page.locator('[name="DeselectEvent"]');
    this.deselectSourceButton = page.getByLabel('Deselect Source');
    this.deleteSourceButton = page.getByRole('button', { exact: true, name: 'Delete external source' });
    this.deleteSourceButtonConfirmation = page.getByRole('button', { exact: true, name: 'Delete' });
    this.selectEventTableView = page.locator('[name="SelectEventViewType"]');
    this.timelineHeader = page.getByText(
      'Sat Jan 20 2024 19:00:00 GMT-0500 (Eastern Standard Time) Sat Jan 27 2024 19:00',
    );
    this.externalEventTableHeaderID = page.getByText('External Event ID');
    this.externalEventTableHeaderEventType = page.getByText('Event Type', { exact: true });
    this.externalEventTableHeaderSourceID = page.getByText('Source ID');
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
