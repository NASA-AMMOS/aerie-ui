import { type Locator, type Page } from '@playwright/test';
export class ExternalSources {
  alertError: Locator;
  closeButton: Locator;
  deleteSourceButton: Locator;
  deleteSourceButtonConfirmation: Locator;
  deselectEventButton: Locator;
  deselectSourceButton: Locator;
  externalEventSelectedForm: Locator;
  externalEventTableRow: Locator;
  externalSourceFilePath: string = 'e2e-tests/data/example-dsn-contacts.json';
  externalSourceId: string;
  externalSourceKey: string = 'DSN_CONTACT_CONFIRMED:DSNCONFIRMED_04.json';
  externalSourceSelectedForm: Locator;
  externalSourceTableRow: Locator;
  externalSourceUpload: Locator;
  externalSourcesTable: Locator;
  inputFile: Locator;
  nameInput: Locator;
  saveButton: Locator;
  selectEventTableView: Locator;
  tableRowExternalSourceId: Locator;
  uploadButton: Locator;

  constructor(public page: Page) {
    this.externalSourceId = '';
    this.updatePage(page);
  }

  async close() {
    await this.closeButton.click();
  }

  async deleteSource() {
    // Assumes a source has already been uploaded and it is the first row in the table
    await this.selectSource();
    await this.deleteSourceButton.click();
    await this.deleteSourceButtonConfirmation.click();
  }

  async fillInputFile(externalSourceFilePath: string = this.externalSourceFilePath) {
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
    await this.page.getByRole('gridcell', { name: 'DSNContact:79/MMS/MMS3:54:X/' }).click();
  }

  async selectSource() {
    // Always selects the first source with the example's source type in the table
    await this.selectSourceFilter();
    await this.page.getByRole('gridcell', { name: 'DSN Contact Confirmed' }).first().click();
  }

  async selectSourceFilter() {
    // Always selects the first source filter possible in the dropdown
    await this.page.getByRole('button', { name: 'Filter External Sources' }).click();
    await this.page.getByPlaceholder('Filter by Source Type').click();
    await this.page.getByRole('button', { name: 'DSN Contact Confirmed' }).click();
  }

  updatePage(page: Page): void {
    this.externalSourceTableRow = page.locator(`.ag-row:has-text("${this.externalSourceKey}")`);
    this.inputFile = page.locator('input[name="file"]');
    this.uploadButton = page.getByRole('button', { name: 'Upload' });
    this.tableRowExternalSourceId = page.locator(`.ag-row:has-text("${this.externalSourceFilePath}") > div >> nth=0`);
    this.externalEventSelectedForm = page.locator('.external-event-form-container');
    this.externalSourceSelectedForm = page.locator('.selected-external-source-details');
    this.alertError = page.locator('.alert-error');
    this.deselectEventButton = page.locator('[name="DeselectEvent"]');
    this.deselectSourceButton = page.locator('[name="DeselectSource"]');

    this.deleteSourceButton = page.getByRole('button', { name: 'Delete external source' });
    this.deleteSourceButtonConfirmation = page.getByRole('button', { name: 'Delete', exact: true });
    this.selectEventTableView = page.locator('[name="SelectEventViewType"]');
  }

  async uploadExternalSource() {
    await this.fillInputFile();
    await this.uploadButton.click();
  }
}
