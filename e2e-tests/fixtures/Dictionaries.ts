import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator';

export enum DictionaryType {
  CommandDictionary = 'Command Dictionary',
  ChannelDictionary = 'Channel Dictionary',
  ParameterDictionary = 'Parameter Dictionary',
  SequenceAdaptation = 'Sequence Adaptation',
}

export const COMMAND_DICTIONARY_PATH = 'e2e-tests/data/command-dictionary.xml';

export class Dictionaries {
  channelDictionaryBuffer: Buffer;
  channelDictionaryName: string;
  channelDictionaryPath: string = 'e2e-tests/data/channel-dictionary.xml';
  channelDictionaryTable: Locator;
  channelDictionaryTableRow: Locator;
  channelDictionaryTableRowDeleteButton: Locator;
  commandDictionaryBuffer: Buffer;
  commandDictionaryName: string;
  commandDictionaryTable: Locator;
  commandDictionaryTableRow: Locator;
  commandDictionaryTableRowDeleteButton: Locator;
  confirmModal: Locator;
  confirmModalDeleteButton: Locator;
  createButton: Locator;
  inputFile: Locator;
  parameterDictionaryBuffer: Buffer;
  parameterDictionaryName: string;
  parameterDictionaryPath: string = 'e2e-tests/data/parameter-dictionary.xml';
  parameterDictionaryTable: Locator;
  parameterDictionaryTableRow: Locator;
  parameterDictionaryTableRowDeleteButton: Locator;
  sequenceAdaptationBuffer: Buffer;
  sequenceAdaptationName: string;
  sequenceAdaptationNameInputField: Locator;
  sequenceAdaptationPath: string = 'e2e-tests/data/sequence-adaptation.js';
  sequenceAdaptationTable: Locator;
  sequenceAdaptationTableRow: Locator;
  sequenceAdaptationTableRowDeleteButton: Locator;
  sequenceAdaptationTableRows: Locator;

  constructor(public page: Page) {
    this.channelDictionaryName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });
    this.channelDictionaryBuffer = this.readDictionary(this.channelDictionaryName, this.channelDictionaryPath);
    this.commandDictionaryName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });
    this.commandDictionaryBuffer = this.readDictionary(this.commandDictionaryName, COMMAND_DICTIONARY_PATH);
    this.parameterDictionaryName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });
    this.parameterDictionaryBuffer = this.readDictionary(this.parameterDictionaryName, this.parameterDictionaryPath);
    this.sequenceAdaptationName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });
    this.sequenceAdaptationBuffer = this.readDictionary(this.sequenceAdaptationName, this.sequenceAdaptationPath);

    this.page = page;
  }

  async createChannelDictionary(): Promise<void> {
    await this.updatePage(this.page, DictionaryType.ChannelDictionary, this.channelDictionaryName);

    await this.createDictionary(
      this.channelDictionaryBuffer,
      this.channelDictionaryName,
      this.channelDictionaryTable,
      this.channelDictionaryTableRow,
      DictionaryType.ChannelDictionary,
    );
  }

  async createCommandDictionary(): Promise<void> {
    await this.updatePage(this.page, DictionaryType.CommandDictionary, this.commandDictionaryName);

    await this.createDictionary(
      this.commandDictionaryBuffer,
      this.commandDictionaryName,
      this.commandDictionaryTable,
      this.commandDictionaryTableRow,
      DictionaryType.CommandDictionary,
    );
  }

  async createDictionary(
    dictionaryBuffer: Buffer,
    dictionaryName: string,
    table: Locator,
    tableRow: Locator,
    type: DictionaryType,
  ): Promise<void> {
    await this.fillInputFile(dictionaryBuffer, dictionaryName, type);

    if (type === DictionaryType.SequenceAdaptation) {
      await expect(this.sequenceAdaptationNameInputField).toBeVisible();
      await this.sequenceAdaptationNameInputField.fill(this.sequenceAdaptationName);
    }

    await this.createButton.click();
    await this.filterTable(table, dictionaryName, type);
    await tableRow.waitFor({ state: 'attached' });
    await tableRow.waitFor({ state: 'visible' });
    await expect(tableRow).toBeVisible();
  }

  async createParameterDictionary(): Promise<void> {
    await this.updatePage(this.page, DictionaryType.ParameterDictionary, this.parameterDictionaryName);

    await this.createDictionary(
      this.parameterDictionaryBuffer,
      this.parameterDictionaryName,
      this.parameterDictionaryTable,
      this.parameterDictionaryTableRow,
      DictionaryType.ParameterDictionary,
    );
  }

  async createSequenceAdaptation(): Promise<void> {
    await this.updatePage(this.page, DictionaryType.SequenceAdaptation, this.sequenceAdaptationName);

    await this.createDictionary(
      this.sequenceAdaptationBuffer,
      this.sequenceAdaptationName,
      this.sequenceAdaptationTable,
      this.sequenceAdaptationTableRow,
      DictionaryType.SequenceAdaptation,
    );
  }

  async deleteChannelDictionary(): Promise<void> {
    await this.updatePage(this.page, DictionaryType.ChannelDictionary, this.channelDictionaryName);

    await this.filterTable(this.channelDictionaryTable, this.channelDictionaryName, DictionaryType.ChannelDictionary);
    await this.deleteDictionary(this.channelDictionaryTableRow, this.channelDictionaryTableRowDeleteButton);
  }

  async deleteCommandDictionary(): Promise<void> {
    await this.updatePage(this.page, DictionaryType.CommandDictionary, this.commandDictionaryName);
    await this.filterTable(this.commandDictionaryTable, this.commandDictionaryName, DictionaryType.CommandDictionary);

    await this.deleteDictionary(this.commandDictionaryTableRow, this.commandDictionaryTableRowDeleteButton);
  }

  /**
   * @note Automatically cascade deletes any dependent expansion rules and expansion sets.
   */
  private async deleteDictionary(tableRow: Locator, tableRowDeleteButton: Locator) {
    await expect(tableRow).toBeVisible();

    await tableRow.hover();
    await expect(tableRow.locator('.actions-cell')).toBeVisible();
    await tableRowDeleteButton.waitFor({ state: 'attached' });
    await tableRowDeleteButton.waitFor({ state: 'visible' });
    await expect(tableRowDeleteButton).toBeVisible();

    await expect(this.confirmModal).not.toBeVisible();
    await tableRowDeleteButton.click({ position: { x: 2, y: 2 } });
    await this.confirmModal.waitFor({ state: 'attached' });
    await this.confirmModal.waitFor({ state: 'visible' });
    await expect(this.confirmModal).toBeVisible();

    await expect(this.confirmModalDeleteButton).toBeVisible();
    await this.confirmModalDeleteButton.click();

    await tableRow.waitFor({ state: 'detached' });
    await tableRow.waitFor({ state: 'hidden' });
    await expect(tableRow).not.toBeVisible();
  }

  async deleteParameterDictionary(): Promise<void> {
    await this.updatePage(this.page, DictionaryType.ParameterDictionary, this.parameterDictionaryName);

    await this.filterTable(
      this.parameterDictionaryTable,
      this.parameterDictionaryName,
      DictionaryType.ParameterDictionary,
    );
    await this.deleteDictionary(this.parameterDictionaryTableRow, this.parameterDictionaryTableRowDeleteButton);
  }

  async deleteSequenceAdaptation(): Promise<void> {
    await this.updatePage(this.page, DictionaryType.SequenceAdaptation, this.sequenceAdaptationName);

    await this.filterTable(
      this.sequenceAdaptationTable,
      this.sequenceAdaptationName,
      DictionaryType.SequenceAdaptation,
    );
    await this.deleteDictionary(this.sequenceAdaptationTableRow, this.sequenceAdaptationTableRowDeleteButton);
  }

  private async fillInputFile(dictionaryBuffer: Buffer, dictionaryName: string, type: DictionaryType) {
    let mimeType: string;
    let name: string;

    if (type === DictionaryType.SequenceAdaptation) {
      mimeType = 'application/x-javascript';
      name = dictionaryName + '.js';
    } else {
      mimeType = 'application/xml';
      name = dictionaryName + '.xml';
    }

    await this.inputFile.focus();
    await this.inputFile.setInputFiles({
      buffer: dictionaryBuffer,
      mimeType,
      name,
    });
    await this.inputFile.evaluate(e => e.blur());
  }

  private async filterTable(table: Locator, dictionaryName: string, type: DictionaryType) {
    await table.waitFor({ state: 'attached' });
    await table.waitFor({ state: 'visible' });
    let nameColumnHeader: Locator | undefined = undefined;

    if (type === DictionaryType.SequenceAdaptation) {
      nameColumnHeader = table.getByRole('columnheader', { name: 'Name' });
    } else {
      nameColumnHeader = table.getByRole('columnheader', { name: 'Mission' });
    }

    await nameColumnHeader.hover();

    const filterIcon = await nameColumnHeader.locator('.ag-icon-filter');
    await expect(filterIcon).toBeVisible();
    await filterIcon.click();
    await this.page.locator('.ag-popup').getByRole('textbox', { name: 'Filter Value' }).first().fill(dictionaryName);
    await expect(table.getByRole('row', { name: dictionaryName })).toBeVisible();
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(250);
  }

  async goto() {
    await this.page.goto('/dictionaries', { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(250);
  }

  readDictionary(dictionaryName: string, dictionaryPath: string): Buffer {
    const dictionaryFile = readFileSync(dictionaryPath)
      .toString()
      .replace(/GENERIC/, dictionaryName);
    const dictionary = dictionaryFile.toString().replace(/GENERIC/, dictionaryName);

    return Buffer.from(dictionary);
  }

  async updatePage(page: Page, dictionaryType: DictionaryType, dictionaryName?: string | undefined): Promise<void> {
    this.page = page;
    this.confirmModal = this.page.locator(`.modal:has-text("Delete ${dictionaryType}")`);
    this.confirmModalDeleteButton = this.confirmModal.getByRole('button', { name: 'Delete' });
    this.createButton = this.page.locator(`button:has-text("Create")`);
    this.inputFile = this.page.locator('input[name="file"]');

    this.channelDictionaryTable = this.page.locator('.panel:has-text("Channel Dictionaries")').getByRole('treegrid');
    this.channelDictionaryTableRow = this.channelDictionaryTable.getByRole('row', { name: dictionaryName });
    this.channelDictionaryTableRowDeleteButton = this.channelDictionaryTableRow
      .getByRole('gridcell')
      .getByRole('button', { name: `Delete ${DictionaryType.ChannelDictionary}` });

    this.commandDictionaryTable = this.page.locator('.panel:has-text("Command Dictionaries")').getByRole('treegrid');
    this.commandDictionaryTableRow = this.commandDictionaryTable.getByRole('row', { name: dictionaryName });
    this.commandDictionaryTableRowDeleteButton = this.commandDictionaryTable
      .getByRole('gridcell')
      .getByRole('button', { name: `Delete ${DictionaryType.CommandDictionary}` });

    this.parameterDictionaryTable = this.page
      .locator('.panel:has-text("Parameter Dictionaries")')
      .getByRole('treegrid');
    this.parameterDictionaryTableRow = this.parameterDictionaryTable.getByRole('row', { name: dictionaryName });
    this.parameterDictionaryTableRowDeleteButton = this.parameterDictionaryTable
      .getByRole('gridcell')
      .getByRole('button', { name: `Delete ${DictionaryType.ParameterDictionary}` });

    this.sequenceAdaptationTable = this.page.locator('.panel:has-text("Sequence Adaptations")').getByRole('treegrid');
    this.sequenceAdaptationTableRow = this.sequenceAdaptationTable.getByRole('row', { name: dictionaryName });
    this.sequenceAdaptationTableRowDeleteButton = this.sequenceAdaptationTable
      .getByRole('gridcell')
      .getByRole('button', { name: `Delete ${DictionaryType.SequenceAdaptation}` });
    this.sequenceAdaptationNameInputField = this.page.locator(`input[name="sequenceAdaptationName"]`);
  }
}
