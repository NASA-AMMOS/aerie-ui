import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator';

type DictionaryType = 'Command Dictionary' | 'Channel Dictionary' | 'Parameter Dictionary';

export class Dictionaries {
  commandDictionaryBuffer: Buffer;
  commandDictionaryName: string;
  commandDictionaryPath: string = 'e2e-tests/data/command-dictionary.xml';
  confirmModal: Locator;
  confirmModalDeleteButton: Locator;
  createButton: Locator;
  inputFile: Locator;
  tableRow: Locator;
  tableRowDeleteButton: Locator;

  constructor(public page: Page) {
    this.commandDictionaryName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });
    this.commandDictionaryBuffer = this.readDictionary(this.commandDictionaryName, this.commandDictionaryPath);

    this.page = page;
  }

  async createCommandDictionary(): Promise<void> {
    this.updatePage(this.commandDictionaryName, 'Command Dictionary');

    await this.createDictionary(this.commandDictionaryBuffer, this.commandDictionaryName);
  }

  async createDictionary(dictionaryBuffer: Buffer, dictionaryName: string): Promise<void> {
    await expect(this.tableRow).not.toBeVisible();
    await this.fillInputFile(dictionaryBuffer, dictionaryName);
    await this.createButton.click();
    await this.tableRow.waitFor({ state: 'attached' });
    await this.tableRow.waitFor({ state: 'visible' });
    await expect(this.tableRow).toBeVisible();
  }

  async deleteCommandDictionary(): Promise<void> {
    this.updatePage(this.commandDictionaryName, 'Command Dictionary');

    await this.deleteDictionary();
  }

  /**
   * @note Automatically cascade deletes any dependent expansion rules and expansion sets.
   */
  async deleteDictionary() {
    await expect(this.tableRow).toBeVisible();
    await expect(this.tableRowDeleteButton).not.toBeVisible();

    await this.tableRow.hover();
    await this.tableRowDeleteButton.waitFor({ state: 'attached' });
    await this.tableRowDeleteButton.waitFor({ state: 'visible' });
    await expect(this.tableRowDeleteButton).toBeVisible();

    await expect(this.confirmModal).not.toBeVisible();
    await this.tableRowDeleteButton.click();
    await this.confirmModal.waitFor({ state: 'attached' });
    await this.confirmModal.waitFor({ state: 'visible' });
    await expect(this.confirmModal).toBeVisible();

    await expect(this.confirmModalDeleteButton).toBeVisible();
    await this.confirmModalDeleteButton.click();
    await this.tableRow.waitFor({ state: 'detached' });
    await this.tableRow.waitFor({ state: 'hidden' });
    await expect(this.tableRow).not.toBeVisible();
  }

  async fillInputFile(dictionaryBuffer: Buffer, dictionaryName: string) {
    await this.inputFile.focus();
    await this.inputFile.setInputFiles({
      buffer: dictionaryBuffer,
      mimeType: 'application/xml',
      name: dictionaryName,
    });
    await this.inputFile.evaluate(e => e.blur());
  }

  async goto() {
    await this.page.goto('/dictionaries', { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(250);
  }

  readDictionary(dictionaryName: string, dictionaryPath: string): Buffer {
    const dictionaryFile = readFileSync(dictionaryPath)
      .toString()
      .replace(/GENERIC/, dictionaryName);
    const dictionaryXml = dictionaryFile.toString().replace(/GENERIC/, dictionaryName);

    return Buffer.from(dictionaryXml);
  }

  updatePage(dictionaryName: string, dictionaryType: DictionaryType): void {
    this.confirmModal = this.page.locator(`.modal:has-text("Delete ${dictionaryType}")`);
    this.confirmModalDeleteButton = this.page.locator(
      `.modal:has-text("Delete ${dictionaryType}") >> button:has-text("Delete")`,
    );
    this.createButton = this.page.locator(`button:has-text("Create")`);
    this.inputFile = this.page.locator('input[name="file"]');
    this.tableRow = this.page.locator(`.ag-row:has-text("${dictionaryName}")`);
    this.tableRowDeleteButton = this.page.locator(
      `.ag-row:has-text("${dictionaryName}") >> button[aria-label="Delete ${dictionaryType}"]`,
    );
  }
}
