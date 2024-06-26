import { type Locator, type Page } from '@playwright/test';
export class ExternalSources {
  alertError: Locator;
  closeButton: Locator;
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
    //await expect(this.page).toHaveURL('.*/models$'); TODO
  }

  /** TODO - How do we get a valid user to allow us to then use the Hasura API?
  async deleteAllExternalSources() {
    // TODO - is this kind of awkward since we haven't really implemented a delete yet...?
  }
  **/

  async fillInputFile(externalSourceFilePath: string = this.externalSourceFilePath) {
    await this.inputFile.focus();
    await this.inputFile.setInputFiles(externalSourceFilePath);
    console.log(this.inputFile);
    await this.inputFile.evaluate(e => e.blur());
  }

  async goto() {
    await this.page.goto('/external-sources', { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(250);
  }

  async selectEvent() {
    // Switch to the event table to click the row
    await this.selectEventTableView.selectOption({ value: 'table' });
    await this.externalEventTableRow.click();
  }

  async selectSource() {
    await this.externalSourceTableRow.click();
  }

  updatePage(page: Page): void {
    this.externalSourceTableRow = page.locator(`.ag-row:has-text("${this.externalSourceKey}")`); // TODO - validate this, this should match the row in the table that the newly uploaded external source goes to
    this.inputFile = page.locator('input[name="file"]');

    this.uploadButton = page.getByRole('button', { name: 'Upload' }); // TODO - validate this, SHOULD be correct!
    this.tableRowExternalSourceId = page.locator(`.ag-row:has-text("${this.externalSourceFilePath}") > div >> nth=0`); // TODO - this probably needs to be updated
    this.externalEventSelectedForm = page.locator('.external-event-form-container');
    this.externalSourceSelectedForm = page.locator('.selected-external-source-details');
    this.alertError = page.locator('.alert-error');
    this.deselectEventButton = page.locator('[name="DeselectEvent"]');
    this.deselectSourceButton = page.locator('[name="DeselectSource"]');
    this.selectEventTableView = page.locator('[name="SelectEventViewType"]');
  }

  async uploadExternalSource() {
    await this.fillInputFile();
    await this.uploadButton.click();
    /**
    // TODO - do these waited conditions make sense for external sources?
    await this.externalSourceTableRow.waitFor({ state: 'attached' });
    await this.externalSourceTableRow.waitFor({ state: 'visible' });
    await expect(this.externalSourceTableRow).toBeVisible();
    await expect(this.tableRowExternalSourceId).toBeVisible();
    const el = await this.tableRowExternalSourceId.elementHandle();
    if (el) {
      this.externalSourceId = (await el.textContent()) as string;
    }
      **/
  }
}
