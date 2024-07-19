import test, { expect, type BrowserContext, type Page } from '@playwright/test';
import { Constraints } from '../fixtures/Constraints.js';
import { ExternalSources } from '../fixtures/ExternalSources.js';
import { Models } from '../fixtures/Models.js';
import { Plan } from '../fixtures/Plan.js';
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
    await page.locator('.grid-menu').first().click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('menuitem', { name: 'External Sources' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Select derivation groups to').click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('row', { name: 'Default DSN Contact E2E Test' }).getByRole('checkbox').check();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Derivation Group Linked Successfully')).toBeVisible();
  });
  test('Derivation group can be expanded in modal', async () => {
    await page.locator('.grid-menu').first().click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('menuitem', { name: 'External Sources' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Select derivation groups to').click();
    await page
      .getByRole('row', { name: 'Default DSN Contact E2E Test' })
      .getByRole('checkbox')
      .waitFor({ state: 'visible' });

    await page.hover('.ag-row');
    await page.getByLabel('View Derivation Group').click();
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
    await expect(page.getByRole('button', { name: 'example-dsn-contacts.json 12' })).toBeVisible();
    await page.getByRole('button', { name: 'example-dsn-contacts.json 12' }).click();
    await expect(page.locator('#svelte-modal').getByText('Key: example-dsn-contacts.json')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Source Type: DSN Contact E2E')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Start Time: 2024-01-21T00:00:00+00:')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('End Time: 2024-01-28T00:00:00+00:')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Valid At: 2024-01-19T00:00:00+00:')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Created At')).toBeVisible();
  });
  test('New file card should be shown when a new file is uploaded to a linked derivation group', async () => {
    await externalSources.goto();
    await externalSources.uploadExternalSource();
    await plan.goto();
    await page.locator('.grid-menu').first().click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('menuitem', { name: 'External Sources' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByText('No Derivation Groups Linked To This Plan').waitFor({ state: 'hidden' });
    await expect(page.getByText('new file has been uploaded')).toBeVisible();
  });
  test('Unlink a derivation group to a plan', async () => {
    await page.locator('.grid-menu').first().click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('menuitem', { name: 'External Sources' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Select derivation groups to').click();
    await page
      .getByRole('row', { name: 'Default DSN Contact E2E Test' })
      .getByRole('checkbox')
      .waitFor({ state: 'visible' });

    await page.getByRole('row', { name: 'Default DSN Contact E2E Test' }).getByRole('checkbox').uncheck();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Derivation Group Disassociated Successfully')).toBeVisible();
  });
});
