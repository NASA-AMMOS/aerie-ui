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
const extendedTimeout = 50000;

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
  await plan.goto();
  await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
  await plan.externalSourceManageButton.click();
  await page.waitForTimeout(1000); // Arbitrary wait timing, allows derivation group linking table to populate
  if ((await page.getByText('No Derivation Groups Linked To This Plan').isVisible()) === false) {
    // De-link Example External Source
    if (
      (await page.getByRole('row', { name: 'Example External Source' }).getByRole('checkbox').isVisible()) &&
      (await page.getByRole('row', { name: 'Example External Source' }).getByRole('checkbox').isChecked()) === true
    ) {
      await page.getByRole('row', { name: 'Example External Source' }).getByRole('checkbox').click();
    }
    // De-link Derivation Test
    if (
      (await page.getByRole('row', { name: 'Derivation Test' }).getByRole('checkbox').isVisible()) &&
      (await page.getByRole('row', { name: 'Derivation Test' }).getByRole('checkbox').isChecked()) === true
    ) {
      await page.getByRole('row', { name: 'Derivation Test' }).getByRole('checkbox').click();
    }
  }
  await page.getByRole('button', { name: 'Close' }).click();

  await externalSources.goto();
  await externalSources.selectSourceFilter();
  await page.waitForTimeout(1000); // Arbitrary wait timing, allows external sources table to populate
  if (await page.getByRole('gridcell', { name: 'example-external-source.json' }).first().isVisible()) {
    await externalSources.deleteSource();
    await page.getByText('External Source Deleted').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await page.waitForTimeout(1000); // Arbitrary wait timing to avoid failing deletions
  }

  if (await page.getByRole('gridcell', { name: 'Derivation_Test_00.json' }).first().isVisible()) {
    await externalSources.deleteSource('Derivation_Test_00.json');
    await page.getByText('External Source Deleted').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await page.waitForTimeout(1000); // Arbitrary wait timing to avoid failing deletions
  }

  if (await page.getByRole('gridcell', { name: 'Derivation_Test_01.json' }).first().isVisible()) {
    await externalSources.deleteSource('Derivation_Test_01.json');
    await page.getByText('External Source Deleted').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await page.waitForTimeout(1000); // Arbitrary wait timing to avoid failing deletions
  }

  if (await page.getByRole('gridcell', { name: 'Derivation_Test_02.json' }).first().isVisible()) {
    await externalSources.deleteSource('Derivation_Test_02.json');
    await page.getByText('External Source Deleted').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await page.waitForTimeout(1000); // Arbitrary wait timing to avoid failing deletions
  }

  if (await page.getByRole('gridcell', { name: 'Derivation_Test_03.json' }).first().isVisible()) {
    await externalSources.deleteSource('Derivation_Test_03.json');
    await page.getByText('External Source Deleted').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await page.waitForTimeout(1000); // Arbitrary wait timing to avoid failing deletions
  }

  await plans.goto();
  await plans.deletePlan();
  await models.goto();
  await models.deleteModel();
  await page.close();
  await context.close();
});

test.describe.serial('Plan External Sources', () => {
  test('Derivation groups can be linked/unlinked to a plan', async () => {
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await plan.externalSourceManageButton.click();
    await page.getByRole('row', { name: 'Example External Source' }).getByRole('checkbox').click();
    await page.getByText('No Derivation Groups Found').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await expect(page.getByText('Derivation Group Linked Successfully')).toBeVisible();
    await page.getByRole('row', { name: 'Example External Source' }).getByRole('checkbox').click();
    await expect(page.getByText('Derivation Group Disassociated Successfully')).toBeVisible();
  });

  test('Linked derivation groups should be expandable in panel', async () => {
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    // Link derivation group to plan if it isn't already
    if ((await page.getByText('No Derivation Groups Linked To This Plan').isVisible()) === true) {
      await plan.externalSourceManageButton.click();
      await page.getByText('No Derivation Groups Found').waitFor({ state: 'hidden', timeout: extendedTimeout });
      await page.getByRole('row', { name: 'Example External Source' }).getByRole('checkbox').click();
      await expect(page.getByText('Derivation Group Linked Successfully')).toBeVisible();
    } else {
      await plan.externalSourceManageButton.click();
    }
    // Wait until the sources are loaded
    await page
      .locator('div')
      .filter({ hasText: /^No sources in this group\. Delete Empty Derivation Group$/ })
      .locator('p')
      .waitFor({ state: 'hidden', timeout: extendedTimeout });
    // Expand all collapse buttons and validate fields appear
    await expect(page.getByRole('gridcell', { name: 'Example External Source' })).toBeVisible();
    await page.getByLabel('View Derivation Group').click();
    await page.getByRole('button', { name: 'ExampleExternalSource:example' }).click();
    await page
      .getByText('Key: ExampleExternalSource:example-external-source.json')
      .waitFor({ state: 'visible', timeout: extendedTimeout });
    await expect(page.getByText('Key: ExampleExternalSource:example-external-source.json').first()).toBeVisible();
    await expect(page.getByText('Source Type: Example External Source').first()).toBeVisible();
    await expect(page.getByText('Start Time: 2024-01-21T00:00:00+00:').first()).toBeVisible();
    await expect(page.getByText('End Time: 2024-01-28T00:00:00+00:').first()).toBeVisible();
    await expect(page.getByText('Valid At: 2024-01-19T00:00:00+00:').first()).toBeVisible();
    await expect(page.getByText('Created At', { exact: false }).first()).toBeVisible();
  });

  test('Derivation group can be expanded in modal', async () => {
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await plan.externalSourceManageButton.click();
    await page
      .getByRole('row', { name: 'Example External Source' })
      .getByRole('checkbox')
      .waitFor({ state: 'visible', timeout: extendedTimeout });
    await page.getByRole('row', { name: 'Example External Source' }).first().hover();
    await page
      .getByRole('row', { name: 'Example External Source' })
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
      .waitFor({ state: 'hidden', timeout: extendedTimeout });
    // Expand all collapse buttons to validate fields appear
    await expect(page.getByRole('button', { name: 'example-external-source.json 4' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'example-external-source.json 4' }).first().click();
    await expect(
      page.locator('#svelte-modal').getByText('Key: ExampleExternalSource:example-external-source.json'),
    ).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Source Type: Example External Source')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Start Time: 2024-01-21T00:00:00+00:')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('End Time: 2024-01-28T00:00:00+00:')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Valid At: 2024-01-19T00:00:00+00:')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Created At')).toBeVisible();
  });

  test('Cards should be shown when a file is added or deleted from a plans linked derivation group', async () => {
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    // Allow stores to load
    await page
      .getByText('No Derivation Groups Linked To This Plan')
      .waitFor({ state: 'hidden', timeout: extendedTimeout });
    await expect(
      page.getByText('New files matching source types and derivation groups in the current plan'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await plan.externalSourceManageButton.click();
    await page
      .getByRole('row', { name: 'Example External Source' })
      .getByRole('checkbox')
      .waitFor({ state: 'visible', timeout: extendedTimeout });
    await page
      .locator('div')
      .filter({ hasText: /^No sources in this group\. Delete Empty Derivation Group$/ })
      .locator('p')
      .waitFor({ state: 'hidden', timeout: extendedTimeout });
    await page.waitForTimeout(3000); // Arbitrary wait timing, allows the store to load for determining if the checkbox should already be checked (it should be)
    await page.getByRole('row', { name: 'Example External Source' }).getByRole('checkbox').click();
    await expect(page.getByText('Derivation Group Disassociated Successfully')).toBeVisible();
    await externalSources.goto();
    await externalSources.deleteSource();
    await plan.goto();
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await expect(page.getByText('Deleted files organized by source type and derivation group')).toBeVisible();
  });

  test('External events are derived from a multi-source derivation group', async () => {
    await externalSources.goto();
    // Upload all derivation test files
    await externalSources.uploadExternalSource(externalSources.derivationTestFile1);
    await externalSources.deselectSourceButton.click();
    await page.getByText('External Source Created').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await externalSources.uploadExternalSource(externalSources.derivationTestFile2);
    await externalSources.deselectSourceButton.click();
    await page.getByText('External Source Created').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await externalSources.uploadExternalSource(externalSources.derivationTestFile3);
    await externalSources.deselectSourceButton.click();
    await page.getByText('External Source Created').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await externalSources.uploadExternalSource(externalSources.derivationTestFile4);
    await plan.goto();
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await plan.externalSourceManageButton.click();
    await page.getByRole('row', { name: 'Derivation Test' }).getByRole('checkbox').click();
    await page
      .getByText('Derivation Group Linked Successfully')
      .waitFor({ state: 'visible', timeout: extendedTimeout });
    await page.getByRole('button', { name: 'Close' }).click();
    await page.getByText('Selected Activity').click();
    await page.getByRole('menuitem', { name: 'External Events Table' }).click();

    await page
      .locator('div')
      .filter({ hasText: /^No sources in this group\. Delete Empty Derivation Group$/ })
      .locator('p')
      .waitFor({ state: 'hidden', timeout: extendedTimeout });

    const dismissCardCount: number = await page.getByRole('button', { name: 'Dismiss' }).count();
    for (let i = 0; i < dismissCardCount; i++) {
      await page.getByRole('button', { name: 'Dismiss' }).first().click();
    }

    // Check on event counts in the panel
    await page.getByRole('button', { exact: false, name: 'Derivation group Default' }).click();
    await expect(page.getByRole('button', { name: 'Derivation_Test_00.json' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Derivation_Test_01.json' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Derivation_Test_02.json' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Derivation_Test_03.json' })).toBeVisible();

    // Check on specific events in the table
    await expect(page.getByRole('gridcell', { exact: true, name: '1' })).toBeVisible();
    await expect(page.getByRole('gridcell', { exact: true, name: '9' })).toBeVisible();
    await expect(page.getByRole('gridcell', { exact: true, name: '3' })).toBeVisible();
    await expect(page.getByRole('gridcell', { exact: true, name: '5' })).toBeVisible();
    await expect(page.getByRole('gridcell', { exact: true, name: '6' })).toBeVisible();
    await expect(page.getByRole('gridcell', { exact: true, name: '2' })).toBeVisible();
    await expect(page.getByRole('gridcell', { exact: true, name: '8' })).toBeVisible();

    // Expand all derivation folders on timeline
    await plan.goto(); // Refreshing is a workaround to newly linked derivation groups not consistently showing on the timeline at first
    await page.locator('button').filter({ hasText: 'DerivationA' }).click();
    await page.locator('button').filter({ hasText: 'DerivationB' }).click();
    await page.locator('button').filter({ hasText: 'DerivationC' }).click();

    // Check derived events on the timeline
    await expect(page.getByRole('button', { exact: true, name: '1' })).toBeVisible();
    await expect(page.getByRole('button', { exact: true, name: '3' })).toBeVisible();
    await expect(page.getByRole('button', { exact: true, name: '2' })).toBeVisible();
    await expect(page.getByRole('button', { exact: true, name: '8' })).toBeVisible();
    await expect(page.getByRole('button', { exact: true, name: '9' })).toBeVisible();
    await expect(page.getByRole('button', { exact: true, name: '5' })).toBeVisible();
    await expect(page.getByRole('button', { exact: true, name: '6' })).toBeVisible();
  });
});
