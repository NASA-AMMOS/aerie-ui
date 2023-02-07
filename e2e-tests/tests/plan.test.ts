import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { Constraints } from '../fixtures/Constraints.js';
import { Models } from '../fixtures/Models.js';
import { Plan } from '../fixtures/Plan.js';
import { Plans } from '../fixtures/Plans.js';
import { SchedulingConditions } from '../fixtures/SchedulingConditions.js';
import { SchedulingGoals } from '../fixtures/SchedulingGoals.js';

let constraints: Constraints;
let context: BrowserContext;
let models: Models;
let page: Page;
let plan: Plan;
let plans: Plans;
let schedulingConditions: SchedulingConditions;
let schedulingGoals: SchedulingGoals;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();

  models = new Models(page);
  plans = new Plans(page, models);
  constraints = new Constraints(page, models);
  schedulingConditions = new SchedulingConditions(page, models);
  schedulingGoals = new SchedulingGoals(page, models);
  plan = new Plan(page, plans, constraints, schedulingGoals, schedulingConditions);

  await models.goto();
  await models.createModel();
  await plans.goto();
  await plans.createPlan();
  await plan.goto();
});

test.afterAll(async () => {
  await plans.goto();
  await plans.deletePlan();
  await models.goto();
  await models.deleteModel();
  await page.close();
  await context.close();
});

test.describe.serial.only('Plan', () => {
  test('Error page should not be visible, and the plan title should be visible in the top navigation bar', async () => {
    await expect(plan.appError).not.toBeVisible();
    await expect(plan.planTitle).toBeVisible();
  });

  test('Initially the View layout should be displayed', async () => {
    await expect(plan.panelActivityForm).toBeVisible();
    await expect(plan.panelActivityTable).toBeVisible();
    await expect(plan.panelActivityTypes).toBeVisible();
    await expect(plan.panelTimeline).toBeVisible();
  });

  test(`Clicking on 'Constraints' in the grid menu should show the constraints panel`, async () => {
    await expect(plan.panelConstraints).not.toBeVisible();
    await plan.showPanel('Constraints');
    await expect(plan.panelConstraints).toBeVisible();
  });

  test(`Clicking on 'Constraint Violations' in the grid menu should show the constraint violations panel`, async () => {
    await expect(plan.panelConstraintViolations).not.toBeVisible();
    await plan.showPanel('Constraint Violations');
    await expect(plan.panelConstraintViolations).toBeVisible();
  });

  test(`Clicking on 'Expansion' in the grid menu should show the expansion panel`, async () => {
    await expect(plan.panelExpansion).not.toBeVisible();
    await plan.showPanel('Expansion');
    await expect(plan.panelExpansion).toBeVisible();
  });

  test(`Clicking on 'Scheduling Goals' in the grid menu should show the scheduling goals panel`, async () => {
    await expect(plan.panelSchedulingGoals).not.toBeVisible();
    await plan.showPanel('Scheduling Goals');
    await expect(plan.panelSchedulingGoals).toBeVisible();
  });

  test(`Clicking on 'Scheduling Conditions' in the grid menu should show the scheduling conditions panel`, async () => {
    await expect(plan.panelSchedulingConditions).not.toBeVisible();
    await plan.showPanel('Scheduling Conditions');
    await expect(plan.panelSchedulingConditions).toBeVisible();
  });

  test(`Clicking on 'Simulation' in the grid menu should show the simulation panel`, async () => {
    await expect(plan.panelSimulation).not.toBeVisible();
    await plan.showPanel('Simulation');
    await expect(plan.panelSimulation).toBeVisible();
  });

  test(`Clicking on 'Timeline Editor' in the grid menu should show the timeline editor panel`, async () => {
    await expect(plan.panelTimelineEditor).not.toBeVisible();
    await plan.showPanel('Timeline Editor');
    await expect(plan.panelTimelineEditor).toBeVisible();
  });

  test(`Clicking on 'View Editor' in the grid menu should show the view editor panel`, async () => {
    await expect(plan.panelViewEditor).not.toBeVisible();
    await plan.showPanel('View Editor');
    await expect(plan.panelViewEditor).toBeVisible();
  });

  test(`Clicking on 'Default View' in the top navigation bar should toggle the view menu`, async () => {
    await expect(plan.navButtonViewMenu).not.toBeVisible();
    plan.navButtonView.click();
    await expect(plan.navButtonViewMenu).toBeVisible();
    plan.navButtonView.click();
    await expect(plan.navButtonViewMenu).not.toBeVisible();
  });

  test(`Clicking on 'Saved Views' in the view menu should pop up a SavedViewsModal`, async () => {
    await expect(plan.navButtonViewMenu).not.toBeVisible();
    plan.navButtonView.click();
    await expect(plan.navButtonViewMenu).toBeVisible();
    await expect(plan.navButtonViewSavedViewsMenuButton).toBeVisible();
    await plan.navButtonViewSavedViewsMenuButton.click();
    await expect(page.locator('.modal .modal-header:has-text("Saved Views")')).toBeVisible();
  });

  test(`Clicking on 'Save As' in the view menu should pop up a CreateViewModal`, async () => {
    await expect(plan.navButtonViewMenu).not.toBeVisible();
    plan.navButtonView.click();
    await expect(plan.navButtonViewMenu).toBeVisible();
    await expect(plan.navButtonViewSaveAsMenuButton).toBeVisible();
    await plan.navButtonViewSaveAsMenuButton.click();
    await expect(page.locator('.modal .modal-header:has-text("Save new view")')).toBeVisible();
  });
});
