import { expect, type Locator, type Page } from '@playwright/test';
import { getOptionValueFromText } from '../utilities/selectors.js';

export class ExpansionRules {
  readonly cancelButton: Locator;
  readonly closeButton: Locator;
  readonly confirmModal: Locator;
  readonly confirmModalDeleteButton: Locator;
  readonly inputActivityType: Locator;
  readonly inputActivityTypeSelector: string = 'select[name="activityType"]';
  readonly inputCommandDictionary: Locator;
  readonly inputCommandDictionarySelector: string = 'select[name="commandDictionary"]';
  readonly inputEditor: Locator;
  readonly inputModel: Locator;
  readonly inputModelSelector: string = 'select[name="modelId"]';
  readonly newButton: Locator;
  readonly page: Page;
  readonly ruleActivityType = 'PeelBanana';
  readonly ruleLogic: string = `export default function(): ExpansionReturn { return [FSW_CMD_0("ON", true, 1.0)]; }`;
  readonly rulesNavButton: Locator;
  readonly saveButton: Locator;
  readonly tableRow: Locator;
  readonly tableRowDeleteButton: Locator;

  constructor(page: Page) {
    this.cancelButton = page.locator(`button:has-text("Cancel")`);
    this.closeButton = page.locator(`button:has-text("Close")`);
    this.confirmModal = page.locator(`.modal:has-text("Delete Expansion Rule")`);
    this.confirmModalDeleteButton = page.locator(
      `.modal:has-text("Delete Expansion Rule") >> button:has-text("Delete")`,
    );
    this.inputActivityType = page.locator(this.inputActivityTypeSelector);
    this.inputCommandDictionary = page.locator(this.inputCommandDictionarySelector);
    this.inputEditor = page.locator('.panel >> textarea.inputarea');
    this.inputModel = page.locator(this.inputModelSelector);
    this.newButton = page.locator(`button:has-text("New")`);
    this.page = page;
    this.rulesNavButton = page.locator(`.nav-button:has-text("Rules")`);
    this.saveButton = page.locator(`button:has-text("Save")`);
    this.tableRow = page.locator(`tr:has-text("${this.ruleActivityType}")`); // TODO: This row might not be unique.
    this.tableRowDeleteButton = page.locator(
      `tr:has-text("${this.ruleActivityType}") >> button[aria-label="Delete Rule"]`,
    );
  }

  async createExpansionRule(baseURL: string | undefined, commandDictionaryName: string, modelName: string) {
    await this.goto();
    await expect(this.newButton).not.toBeDisabled();
    await this.newButton.click();
    await this.page.waitForURL(`${baseURL}/expansion/rules/new`);
    await expect(this.saveButton).toBeDisabled();
    await this.selectCommandDictionary(commandDictionaryName);
    await this.selectModel(modelName);
    await this.selectActivityType();
    await this.fillInputEditor();
    await expect(this.saveButton).not.toBeDisabled();
    await this.saveButton.click();
    await this.page.waitForURL(`${baseURL}/expansion/rules/edit/*`);
    await expect(this.saveButton).not.toBeDisabled();
    await expect(this.closeButton).not.toBeDisabled();
    await this.closeButton.click();
    await this.page.waitForURL(`${baseURL}/expansion/rules`);
  }

  async deleteExpansionRule() {
    await this.goto();
    await expect(this.tableRow).toBeVisible();
    await expect(this.tableRowDeleteButton).not.toBeVisible();

    await this.tableRow.hover();
    await this.tableRowDeleteButton.waitFor({ state: 'visible' });
    await expect(this.tableRowDeleteButton).toBeVisible();

    await expect(this.confirmModal).not.toBeVisible();
    await this.tableRowDeleteButton.click();
    await this.confirmModal.waitFor({ state: 'attached' });
    await expect(this.confirmModal).toBeVisible();

    await expect(this.confirmModalDeleteButton).toBeVisible();
    await this.confirmModalDeleteButton.click();
    await this.tableRow.waitFor({ state: 'detached' });
    await expect(this.tableRow).not.toBeVisible();
  }

  async fillInputEditor() {
    await this.inputEditor.focus();
    await this.inputEditor.fill(this.ruleLogic);
    await this.inputEditor.evaluate(e => e.blur());
  }

  async goto() {
    await this.page.goto('/plans');
    await this.page.goto('/expansion/rules', { waitUntil: 'networkidle' });
    await expect(this.rulesNavButton).toHaveClass(/selected/);
  }

  async selectActivityType() {
    await this.page.waitForSelector(`option:has-text("${this.ruleActivityType}")`, { state: 'attached' });
    const value = await getOptionValueFromText(this.page, this.inputActivityTypeSelector, this.ruleActivityType);
    await this.inputActivityType.focus();
    await this.inputActivityType.selectOption(value);
    await this.inputActivityType.evaluate(e => e.blur());
  }

  async selectCommandDictionary(commandDictionaryName: string) {
    await this.page.waitForSelector(`option:has-text("${commandDictionaryName} - 1.0.0")`, { state: 'attached' });
    const value = await getOptionValueFromText(this.page, this.inputCommandDictionarySelector, commandDictionaryName);
    await this.inputCommandDictionary.focus();
    await this.inputCommandDictionary.selectOption(value);
    await this.inputCommandDictionary.evaluate(e => e.blur());
  }

  async selectModel(modelName: string) {
    await this.page.waitForSelector(`option:has-text("${modelName}")`, { state: 'attached' });
    const value = await getOptionValueFromText(this.page, this.inputModelSelector, modelName);
    await this.inputModel.focus();
    await this.inputModel.selectOption(value);
    await this.inputModel.evaluate(e => e.blur());
  }
}
