import test, { expect, type BrowserContext, type Page } from '@playwright/test';
import { Constraints } from '../fixtures/Constraints.js';
import { ExternalSources } from '../fixtures/ExternalSources.js';
import { Models } from '../fixtures/Models.js';
import { PanelNames, Plan } from '../fixtures/Plan.js';
import { Plans } from '../fixtures/Plans.js';
import { SchedulingConditions } from '../fixtures/SchedulingConditions.js';
import { SchedulingGoals } from '../fixtures/SchedulingGoals.js';
import { User } from '../fixtures/User.js';

let constraints: Constraints;
let context: BrowserContext;
let externalSources: ExternalSources;
let models: Models;
let page: Page;
let plan: Plan;
let plans: Plans;
let schedulingConditions: SchedulingConditions;
let schedulingGoals: SchedulingGoals;
let userA: User;
let userB: User;
const extendedTimeout = 5000;

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
});

test.afterAll(async () => {
  await plans.goto();
  await plans.deletePlan();
  await models.goto();
  await models.deleteModel();

  await externalSources.goto();
  await externalSources.selectSourceFilter();
  await page.waitForTimeout(500); // Arbitrary wait timing, allows external sources table to populate
  // Cleanup all test files that *may* have been uploaded
  if (await page.getByRole('gridcell', { name: externalSources.externalSourceFileName }).first().isVisible()) {
    await externalSources.deleteSource(externalSources.externalSourceFileName);
    await page.getByText('External Source Deleted').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await page
      .getByRole('gridcell', { name: externalSources.externalSourceFileName })
      .first()
      .waitFor({ state: 'hidden', timeout: extendedTimeout });
  }

  if (await page.getByRole('gridcell', { name: externalSources.derivationTestFile1 }).first().isVisible()) {
    await externalSources.deleteSource(externalSources.derivationTestFile1);
    await page.getByText('External Source Deleted').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await page
      .getByRole('gridcell', { name: externalSources.derivationTestFile1 })
      .first()
      .waitFor({ state: 'hidden', timeout: extendedTimeout });
  }

  if (await page.getByRole('gridcell', { name: externalSources.derivationTestFile2 }).first().isVisible()) {
    await externalSources.deleteSource(externalSources.derivationTestFile2);
    await page.getByText('External Source Deleted').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await page
      .getByRole('gridcell', { name: externalSources.derivationTestFile2 })
      .first()
      .waitFor({ state: 'hidden', timeout: extendedTimeout });
  }

  if (await page.getByRole('gridcell', { name: externalSources.derivationTestFile3 }).first().isVisible()) {
    await externalSources.deleteSource(externalSources.derivationTestFile3);
    await page.getByText('External Source Deleted').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await page
      .getByRole('gridcell', { name: externalSources.derivationTestFile3 })
      .first()
      .waitFor({ state: 'hidden', timeout: extendedTimeout });
  }

  if (await page.getByRole('gridcell', { name: externalSources.derivationTestFile4 }).first().isVisible()) {
    await externalSources.deleteSource(externalSources.derivationTestFile4);
    await page.getByText('External Source Deleted').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await page
      .getByRole('gridcell', { name: externalSources.derivationTestFile4 })
      .first()
      .waitFor({ state: 'hidden', timeout: extendedTimeout });
  }

  await page.close();
  await context.close();
});

test.describe.serial('Plan External Sources', () => {
  test('Derivation groups can be linked/unlinked to a plan', async () => {
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await plan.externalSourceManageButton.click();
    await page.getByText('No Derivation Groups Found').waitFor({ state: 'hidden', timeout: extendedTimeout });
    await page.getByRole('row', { name: externalSources.exampleSourceType }).getByRole('checkbox').click();
    await expect(page.getByText('Derivation Group Linked Successfully')).toBeVisible();
    await page.getByRole('row', { name: externalSources.exampleSourceType }).getByRole('checkbox').click();
    await expect(page.getByText('Derivation Group Disassociated Successfully')).toBeVisible();
  });

  test('Zero-duration events are properly drawn in the timeline', async () => {
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await plan.externalSourceManageButton.click();

    // Link *only* the derivation group with the 0-duration source
    const checkboxCount: number = await page.getByRole('checkbox').count();
    for (let index = 1; index < checkboxCount; index++) {
      if (await page.getByRole('checkbox').first().isChecked()) {
        await page.getByRole('checkbox').first().check();
      }
    }
    page.getByRole('row', { name: externalSources.exampleSourceType }).getByRole('checkbox').click();
    await expect(page.getByText('Derivation Group Linked Successfully')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await page.waitForTimeout(externalSources.toastTimeout);

    // Retrieve pixel data from the timeline canvas
    const linkedNonZeroPixels: number[] = [];
    const beforePixelData = externalSources.getCanvasPixelData();
    if (beforePixelData !== null) {
      let index = 0;
      let currentPixel = beforePixelData[index];
      while (currentPixel !== undefined) {
        if (currentPixel !== 0) {
          linkedNonZeroPixels.push(currentPixel);
        }
        index = index + 1;
        currentPixel = beforePixelData[index];
      }
    }

    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await plan.externalSourceManageButton.click();

    // Disassociate previously linked source so nothing appears on timeline
    page.getByRole('row', { name: externalSources.exampleSourceType }).getByRole('checkbox').click();
    await expect(page.getByText('Derivation Group Disassociated Successfully')).toBeVisible();
    await page.waitForTimeout(externalSources.toastTimeout);
    await page.getByRole('button', { name: 'Close' }).click();

    const disassociatedNonZeroPixels: number[] = [];
    const afterPixelData = externalSources.getCanvasPixelData();
    if (afterPixelData !== null) {
      let index = 0;
      let currentPixel = afterPixelData[index];
      while (currentPixel !== undefined) {
        if (currentPixel !== 0) {
          disassociatedNonZeroPixels.push(currentPixel);
        }
        index = index + 1;
        currentPixel = afterPixelData[index];
      }
    }

    // Validate that removing the derivation group shrank the amount of drawn pixels (should be 0, but just in case check greaterThan)
    expect(linkedNonZeroPixels.length).toBeGreaterThan(disassociatedNonZeroPixels.length);
  });

  test('Cards should be shown when a file is added or deleted from a plans linked derivation group', async () => {
    // Upload a test file and link its derivation group to the plan
    await externalSources.goto();
    await externalSources.uploadExternalSource(externalSources.derivationTestFile1);
    await plan.goto();
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await plan.externalSourceManageButton.click();
    await page.getByRole('row', { name: externalSources.exampleDerivationSourceType }).getByRole('checkbox').click();
    await page
      .getByText('Derivation Group Linked Successfully')
      .waitFor({ state: 'visible', timeout: extendedTimeout });

    // Upload another test
    await externalSources.goto();
    await externalSources.uploadExternalSource(externalSources.derivationTestFile2);
    await page.getByText('External Source Created').waitFor({ state: 'hidden', timeout: externalSources.toastTimeout }); // Wait for toast to go away to stall for processes to finish
    await plan.goto();
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);

    // Allow stores to load, validate 'new source' card appears
    await page
      .getByText('New files matching source types and derivation groups in the current plan')
      .waitFor({ state: 'visible', timeout: extendedTimeout });
    await expect(page.locator('p').filter({ hasText: /^Derivation_Test_00\.json$/ })).toBeVisible();
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await plan.externalSourceManageButton.click();
    await page
      .getByRole('row', { name: externalSources.exampleDerivationSourceType })
      .getByRole('checkbox')
      .waitFor({ state: 'visible', timeout: extendedTimeout });
    await page
      .locator('div')
      .filter({ hasText: /^No sources in this group\. Delete Empty Derivation Group$/ })
      .locator('p')
      .waitFor({ state: 'hidden', timeout: extendedTimeout });
    await page.waitForTimeout(3000); // Arbitrary wait timing, allows the store to load for determining if the checkbox should already be checked (it should be)
    if (
      await page
        .getByRole('row', { name: externalSources.exampleDerivationSourceType })
        .getByRole('checkbox')
        .isChecked()
    ) {
      await page.getByRole('row', { name: externalSources.exampleDerivationSourceType }).getByRole('checkbox').click();
      await expect(page.getByText('Derivation Group Disassociated Successfully')).toBeVisible();
    }
    await externalSources.goto();
    await externalSources.deleteSource(externalSources.derivationTestFileKey1);
    await externalSources.deleteSource(externalSources.derivationTestFileKey2);
    await plan.goto();
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await expect(page.getByText('Deleted files organized by source type and derivation group')).toBeVisible();
    await expect(page.getByText(externalSources.derivationTestFileKey1).first()).toBeVisible();
  });

  test('External events are derived from a multi-source derivation group', async () => {
    await externalSources.goto();
    // Upload all derivation test files
    await externalSources.uploadExternalSource(externalSources.derivationTestFile1);
    await externalSources.deselectSourceButton.click();
    await page.getByText('External Source Created').waitFor({ state: 'hidden', timeout: externalSources.toastTimeout });
    await externalSources.uploadExternalSource(externalSources.derivationTestFile2);
    await externalSources.deselectSourceButton.click();
    await page.getByText('External Source Created').waitFor({ state: 'hidden', timeout: externalSources.toastTimeout });
    await externalSources.uploadExternalSource(externalSources.derivationTestFile3);
    await externalSources.deselectSourceButton.click();
    await page.getByText('External Source Created').waitFor({ state: 'hidden', timeout: externalSources.toastTimeout });
    await externalSources.uploadExternalSource(externalSources.derivationTestFile4);
    await plan.goto();
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await plan.externalSourceManageButton.click();
    await page.getByRole('row', { name: 'Derivation Test' }).getByRole('checkbox').click();
    await page
      .getByText('Derivation Group Linked Successfully')
      .waitFor({ state: 'visible', timeout: externalSources.toastTimeout });
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
    await page.getByRole('button', { exact: false, name: 'Derivation group Derivation Test Default' }).click();
    await expect(page.getByRole('button', { name: externalSources.derivationTestFileKey1 })).toHaveCount(1);
    await expect(page.getByRole('button', { name: externalSources.derivationTestFileKey2 })).toHaveCount(1);
    await expect(page.getByRole('button', { name: externalSources.derivationTestFileKey3 })).toHaveCount(1);
    await expect(page.getByRole('button', { name: externalSources.derivationTestFileKey4 })).toHaveCount(1);

    await expect(externalSources.panelExternalEventsTable.getByRole('gridcell')).toHaveCount(35); // Should match exactly for the amount of rows we expect - there are 7 derived events from these sources and there are 5 columns in the table

    // Check on specific events in the table
    const expectedData = [
      '1DerivationA',
      '9DerivationC',
      '3DerivationB',
      '5DerivationC',
      '6DerivationC',
      '2DerivationB',
      '8DerivationB',
    ];
    for (let index = 1; index < expectedData.length; index++) {
      const row = await page.locator('role=row').nth(index + 1);
      await expect(row).toContainText(expectedData[index - 1]);
    }
  });

  test('Linked derivation groups should be expandable in panel', async () => {
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    // Link derivation group to plan if it isn't already
    if ((await page.getByText('No Derivation Groups Linked To This Plan').isVisible()) === true) {
      await plan.externalSourceManageButton.click();
      await page.getByText('No Derivation Groups Found').waitFor({ state: 'hidden', timeout: extendedTimeout });
      await page.getByRole('row', { name: externalSources.exampleSourceType }).getByRole('checkbox').click();
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
    await expect(page.getByRole('gridcell', { exact: true, name: externalSources.exampleSourceType })).toBeVisible();
    await page
      .getByRole('row', { name: 'Example External Source Default Example External Source' })
      .getByLabel('View Derivation Group')
      .click();
    await page.getByRole('button', { name: 'ExampleExternalSource:example' }).click();
    await page
      .locator('#svelte-modal')
      .getByText('Key: ExampleExternalSource:example-external-source.json')
      .waitFor({ state: 'visible', timeout: extendedTimeout });
    await expect(
      page.locator('#svelte-modal').getByText('Key: ExampleExternalSource:example-external-source.json').first(),
    ).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Source Type: Example External Source').first()).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Start Time: 2022-001T00:00:00').first()).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('End Time: 2022-002T00:00:00').first()).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Valid At: 2022-001T00:00:00').first()).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Created At', { exact: false }).first()).toBeVisible();
  });

  test('Derivation group can be expanded in modal', async () => {
    await plan.showPanel(PanelNames.EXTERNAL_SOURCES);
    await plan.externalSourceManageButton.click();
    await page
      .getByRole('row', { name: externalSources.exampleSourceType })
      .getByRole('checkbox')
      .waitFor({ state: 'visible', timeout: extendedTimeout });
    await page.getByRole('row', { name: externalSources.exampleSourceType }).first().hover();
    await page
      .getByRole('row', { name: externalSources.exampleSourceType })
      .getByLabel('View Derivation Group')
      .first()
      .click();
    await expect(
      page
        .locator('div')
        .filter({ hasText: /^Sources in 'Example External Source Default'$/ })
        .first(),
    ).toBeVisible();
    await page
      .locator('div')
      .filter({ hasText: /^No sources in this group\. Delete Empty Derivation Group$/ })
      .locator('p')
      .waitFor({ state: 'hidden', timeout: extendedTimeout });
    // Expand all collapse buttons to validate fields appear
    await expect(page.getByRole('button', { name: 'example-external-source.json 1' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'example-external-source.json 1' }).first().click();
    await expect(
      page.locator('#svelte-modal').getByText('Key: ExampleExternalSource:example-external-source.json'),
    ).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Source Type: Example External Source')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Start Time: 2022-001T00:00:00')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('End Time: 2022-002T00:00:00')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Valid At: 2022-001T00:00:00')).toBeVisible();
    await expect(page.locator('#svelte-modal').getByText('Created At')).toBeVisible();
  });

  test('External source plan view should reset when the user is changed', async ({ baseURL }) => {
    await models.goto(); // Navigate to any page so we can setup users
    userA = new User(page, 'userA');
    userB = new User(page, 'userB');

    await userB.logout(baseURL);
    await userA.login(baseURL);

    // Change settings for userA
    await plan.goto();
    await page.getByText('External Events').click({
      button: 'right',
    });
    await page.getByText('Edit Row').click();
    await page.getByLabel('Group according to external').click();
    await page.locator('form').filter({ hasText: 'Height px' }).getByRole('spinbutton').fill('25');
    await page.locator('form').filter({ hasText: 'Height px' }).getByRole('spinbutton').press('Enter');
    await page.getByLabel('Never show labels').click();

    // Logout and switch user
    await userA.logout(baseURL);
    await userB.login(baseURL);
    await plan.goto();

    // Validate settings are reset
    await page.getByText('External Events').click({
      button: 'right',
    });
    await page.getByText('Edit Row').click();
    await expect(page.getByLabel('Group according to external')).not.toBeChecked();
    await expect(page.getByLabel('Group according to event type')).toBeChecked();
    await expect(page.locator('form').filter({ hasText: 'Height px' }).getByRole('spinbutton')).toHaveValue('16');
    await expect(page.getByLabel('Never show labels')).not.toBeChecked();
    await expect(page.getByLabel('Show labels that do not')).toBeChecked();
  });
});
