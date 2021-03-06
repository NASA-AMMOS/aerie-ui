import type { Locator, Page } from '@playwright/test';

export class AppNav {
  aboutModal: Locator;
  aboutModalCloseButton: Locator;
  appMenu: Locator;
  appMenuButton: Locator;
  appMenuItemAbout: Locator;
  appMenuItemDictionaries: Locator;
  appMenuItemExpansion: Locator;
  appMenuItemGateway: Locator;
  appMenuItemLogout: Locator;
  appMenuItemModels: Locator;
  appMenuItemPlans: Locator;
  appMenuItemPlayground: Locator;
  appMenuItemScheduling: Locator;

  constructor(public page: Page) {
    this.updatePage(page);
  }

  updatePage(page: Page): void {
    this.aboutModal = page.locator(`.modal:has-text("About")`);
    this.aboutModalCloseButton = page.locator(`.modal:has-text("About") >> button:has-text("Close")`);
    this.appMenu = page.locator('.app-menu > .menu > .menu-slot');
    this.appMenuButton = page.locator('.app-menu');
    this.appMenuItemAbout = page.locator(`.app-menu > .menu > .menu-slot > .menu-item:has-text("About")`);
    this.appMenuItemDictionaries = page.locator(`.app-menu > .menu > .menu-slot > .menu-item:has-text("Dictionaries")`);
    this.appMenuItemExpansion = page.locator(`.app-menu > .menu > .menu-slot > .menu-item:has-text("Expansion")`);
    this.appMenuItemGateway = page.locator(`.app-menu > .menu > .menu-slot > .menu-item:has-text("Gateway")`);
    this.appMenuItemLogout = page.locator(`.app-menu > .menu > .menu-slot > .menu-item:has-text("Logout")`);
    this.appMenuItemModels = page.locator(`.app-menu > .menu > .menu-slot > .menu-item:has-text("Models")`);
    this.appMenuItemPlans = page.locator(`.app-menu > .menu > .menu-slot > .menu-item:has-text("Plans")`);
    this.appMenuItemPlayground = page.locator(
      `.app-menu > .menu > .menu-slot > .menu-item:has-text("GraphQL Playground")`,
    );
    this.appMenuItemScheduling = page.locator(`.app-menu > .menu > .menu-slot > .menu-item:has-text("Scheduling")`);
    this.page = page;
  }
}
