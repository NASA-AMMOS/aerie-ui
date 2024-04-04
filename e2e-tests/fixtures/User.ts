import { type Page } from '@playwright/test';
import { adjectives, names, uniqueNamesGenerator } from 'unique-names-generator';
import { AppNav } from './AppNav.js';

export async function performLogin(page, baseURL, username = 'test') {
  await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill('test');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`${baseURL}/plans`);
}

export class User {
  appNav: AppNav;

  constructor(
    public page: Page,
    public username: string,
  ) {
    this.appNav = new AppNav(page);
    this.username = username || this.createUsername();
    this.updatePage(page);
  }

  createUsername() {
    return uniqueNamesGenerator({ dictionaries: [names, adjectives] });
  }

  async login(baseURL: string | undefined, username = this.username) {
    await performLogin(this.page, baseURL, username);
  }

  async logout(baseURL: string | undefined) {
    await this.appNav.appMenuButton.click();
    await this.appNav.appMenu.waitFor({ state: 'attached' });
    await this.appNav.appMenu.waitFor({ state: 'visible' });
    await this.appNav.appMenuItemLogout.click();
    await this.page.waitForURL(`${baseURL}/login`);
  }

  async switchRole(role: string = 'aerie_admin') {
    await this.page.locator('.nav select').selectOption(role);
    await this.page.waitForTimeout(500);
  }

  updatePage(page: Page): void {
    // this.confirmModal = page.locator(`.modal:has-text("Delete View")`);
    // this.confirmModalDeleteButton = page.locator(`.modal:has-text("Delete View") >> button:has-text("Delete")`);
    // this.navButtonView = page.locator('.view-menu-button');
    // this.navButtonViewMenu = page.locator(`.view-menu`);
    // this.navButtonViewMenuTitle = page.locator(`.view-menu-button .nav-button-title`);
    // this.navButtonViewSaveAsMenuButton = page.locator(`.view-menu .menu-item:has-text("Save as")`);
    // this.navButtonViewUploadViewMenuButton = page.locator(`.view-menu .menu-item:has-text("Upload view file")`);
    // this.navButtonViewSavedViewsMenuButton = page.locator(`.view-menu .menu-item:has-text("Browse saved views")`);
    // this.navButtonViewRenameViewMenuButton = page.locator(`.view-menu .menu-item:has-text("Rename view")`);
    // this.renameViewMenuSaveViewButton = page.locator('.modal .st-button:has-text("Save View")');
    // this.saveAsMenuSaveAsButton = page.locator('.modal .st-button:has-text("Save View")');
    // this.tableRowSelector = (viewName: string) => page.locator(`.ag-row:has-text("${viewName}")`);
    // this.tableRowDeleteButtonSelector = (viewName: string) =>
    //   page.locator(`.ag-row:has-text("${viewName}") >> button[aria-label="Delete View"]`);
  }
}
