import test, { expect, type BrowserContext, type Page } from '@playwright/test';
import { Constraints } from '../fixtures/Constraints.js';
import { ExternalSources } from '../fixtures/ExternalSources.js';
import { Models } from '../fixtures/Models.js';
import { PanelNames, Plan } from '../fixtures/Plan.js';
import { Plans } from '../fixtures/Plans.js';
import { SchedulingConditions } from '../fixtures/SchedulingConditions.js';
import { SchedulingGoals } from '../fixtures/SchedulingGoals.js';

let constraints: Constraints;
let context: BrowserContext;
let externalSources: ExternalSources;
let models: Models;
let page: Page;
let plan: Plan;
let plans: Plans;
let schedulingConditions: SchedulingConditions;
let schedulingGoals: SchedulingGoals;

test.beforeEach(async () => {
  await plan.goto(); // Refresh page to reset the view
});

test.beforeAll(async ({ baseURL, browser }) => {
  context = await browser.newContext();
  page = await context.newPage();

  models = new Models(page);
  plans = new Plans(page, models);
  constraints = new Constraints(page);
  schedulingConditions = new SchedulingConditions(page);
  schedulingGoals = new SchedulingGoals(page);
  plan = new Plan(page, plans, constraints, schedulingGoals, schedulingConditions);
  externalSources = new ExternalSources(page);

  await models.goto();
  await models.createModel(baseURL);
  await plans.goto();
  await plans.createPlan();
  await externalSources.goto();
  await externalSources.uploadExternalSource();
  await plan.goto();
});

//test.afterEach(async () => {});

test.afterAll(async () => {
  await externalSources.goto();
  await externalSources.deleteSource();
  await plans.goto();
  await plans.deletePlan();
  await models.goto();
  await models.deleteModel();
  await page.close();
  await context.close();
});

test.describe.serial('Plan External Sources', () => {
  test('Link a derivation group to a plan', async () => {
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await plan.externalSourceManageButton.click();
    await page.getByRole('row', { name: 'Default DSN Contact E2E Test' }).getByRole('checkbox').click();
    await expect(page.getByText('Derivation Group Linked Successfully')).toBeVisible();
  });

  test('Linked derivation groups should be expandable in panel', async () => {
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    // Wait until the sources are loaded
    await page
      .locator('div')
      .filter({ hasText: /^No sources in this group\. Delete Empty Derivation Group$/ })
      .locator('p')
      .waitFor({ state: 'hidden' });
    // Expand all collapse buttons and validate fields appear
    await expect(page.getByRole('button', { name: 'DSN Contact E2E Test' })).toBeVisible();
    await page.getByRole('button', { name: 'Derivation group Default 12' }).first().click();
    await page.getByRole('button', { name: 'example-dsn-contacts.json 12' }).first().click();
    await page.getByRole('button', { name: 'View Contained Event Types' }).first().click();
    await expect(page.getByText('Key: example-dsn-contacts.json').first()).toBeVisible();
    await expect(page.getByText('Source Type: DSN Contact E2E').first()).toBeVisible();
    await expect(page.getByText('Start Time: 2024-01-21T00:00:00+00:').first()).toBeVisible();
    await expect(page.getByText('End Time: 2024-01-28T00:00:00+00:').first()).toBeVisible();
    await expect(page.getByText('Valid At: 2024-01-19T00:00:00+00:').first()).toBeVisible();
    await expect(page.getByText('Created At', { exact: false }).first()).toBeVisible();
  });

  test('Derivation group can be expanded in modal', async () => {
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await plan.externalSourceManageButton.click();
    await page
      .getByRole('row', { name: 'Default DSN Contact E2E Test' })
      .getByRole('checkbox')
      .waitFor({ state: 'visible' });
    await page.getByRole('row', { name: 'Default DSN Contact E2E Test' }).first().hover();
    await page
      .getByRole('row', { name: 'Default DSN Contact E2E Test' })
      .getByLabel('View Derivation Group')
      .first()
      .click();
    await expect(
      page
        .locator('div')
        .filter({ hasText: /^Sources in 'Default'$/ })
        .first(),
    ).toBeVisible();
    await page
      .locator('div')
      .filter({ hasText: /^No sources in this group\. Delete Empty Derivation Group$/ })
      .locator('p')
      .waitFor({ state: 'hidden' });
    // Expand all collapse buttons to validate fields appear
    await expect(page.getByRole('button', { name: 'example-dsn-contacts.json 12' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'example-dsn-contacts.json 12' }).first().click();
    await expect(page.locator('#svelte-modal').getByText('Key: example-dsn-contacts.json')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Source Type: DSN Contact E2E')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Start Time: 2024-01-21T00:00:00+00:')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('End Time: 2024-01-28T00:00:00+00:')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Valid At: 2024-01-19T00:00:00+00:')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Created At')).toBeVisible();
  });

  test('Cards should be shown when a file is added or deleted from a plans linked derivation group', async () => {
    await externalSources.goto();
    await externalSources.uploadExternalSource();
    await plan.goto();
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    // Allow stores to load
    await page.getByText('No Derivation Groups Linked To This Plan').waitFor({ state: 'hidden' });
    await expect(
      page.getByText('New files matching source types and derivation groups in the current plan'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Dismiss' }).click();

    await externalSources.goto();
    await externalSources.deleteSource();
    await plan.goto();
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await page.getByText('No Derivation Groups Linked To This Plan').waitFor({ state: 'hidden' });
    await expect(page.getByText('Deleted files organized by source type and derivation group')).toBeVisible();
  });

  test('Unlink a derivation group to a plan', async () => {
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await plan.externalSourceManageButton.click();
    await page
      .getByRole('row', { name: 'Default DSN Contact E2E Test' })
      .getByRole('checkbox')
      .waitFor({ state: 'visible' });
    await page
      .locator('div')
      .filter({ hasText: /^No sources in this group\. Delete Empty Derivation Group$/ })
      .locator('p')
      .waitFor({ state: 'hidden' });
    await page.waitForTimeout(3000); // Arbitrary wait timing, allows the store to load for determining if the checkbox should already be checked (it should be)
    await page.getByRole('row', { name: 'Default DSN Contact E2E Test' }).getByRole('checkbox').click();
    await expect(page.getByText('Derivation Group Disassociated Successfully')).toBeVisible();
  });
});
