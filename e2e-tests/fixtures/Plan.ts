import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { Constraints } from './Constraints.js';
import { Plans } from './Plans.js';
import { SchedulingConditions } from './SchedulingConditions.js';
import { SchedulingGoals } from './SchedulingGoals.js';

export class Plan {
  activitiesTable: Locator;
  activitiesTableFirstRow: Locator;
  analyzeButton: Locator;
  appError: Locator;
  confirmModal: Locator;
  confirmModalDeleteButton: Locator;
  constraintListItemSelector: string;
  constraintNewButton: Locator;
  gridMenu: Locator;
  gridMenuButton: Locator;
  gridMenuItem: (name: string) => Locator;
  navButtonConstraints: Locator;
  navButtonConstraintsMenu: Locator;
  navButtonExpansion: Locator;
  navButtonExpansionMenu: Locator;
  navButtonScheduling: Locator;
  navButtonSchedulingMenu: Locator;
  navButtonSimulation: Locator;
  navButtonSimulationMenu: Locator;
  navButtonView: Locator;
  navButtonViewMenu: Locator;
  navButtonViewSaveAsMenuButton: Locator;
  navButtonViewSavedViewsMenuButton: Locator;
  panelActivityForm: Locator;
  panelActivityTable: Locator;
  panelActivityTypes: Locator;
  panelConstraintViolations: Locator;
  panelConstraints: Locator;
  panelExpansion: Locator;
  panelSchedulingConditions: Locator;
  panelSchedulingGoals: Locator;
  panelSimulation: Locator;
  panelTimeline: Locator;
  panelTimelineEditor: Locator;
  panelViewEditor: Locator;
  planTitle: Locator;
  scheduleButton: Locator;
  schedulingConditionEnabledCheckbox: Locator;
  schedulingConditionListItemSelector: string;
  schedulingConditionNewButton: Locator;
  schedulingGoalDifferenceBadge: Locator;
  schedulingGoalEnabledCheckbox: Locator;
  schedulingGoalExpand: Locator;
  schedulingGoalListItemSelector: string;
  schedulingGoalNewButton: Locator;
  schedulingSatisfiedActivity: Locator;
  schedulingStatusSelector: (status: string) => string;

  constructor(
    public page: Page,
    public plans: Plans,
    public constraints: Constraints,
    public schedulingGoals: SchedulingGoals,
    public schedulingConditions: SchedulingConditions,
  ) {
    this.constraintListItemSelector = `.constraint-list-item:has-text("${constraints.constraintName}")`;
    this.schedulingConditionListItemSelector = `.scheduling-condition:has-text("${schedulingConditions.conditionName}")`;
    this.schedulingGoalListItemSelector = `.scheduling-goal:has-text("${schedulingGoals.goalName}")`;
    this.schedulingStatusSelector = (status: string) => `.status-badge.${status}`;
    this.updatePage(page);
  }

  async createConstraint(baseURL: string | undefined) {
    const [newConstraintPage] = await Promise.all([this.page.waitForEvent('popup'), this.constraintNewButton.click()]);
    this.constraints.updatePage(newConstraintPage);
    await newConstraintPage.waitForURL(`${baseURL}/constraints/new`);
    await this.constraints.createConstraint(baseURL);
    await newConstraintPage.close();
    this.constraints.updatePage(this.page);
    await this.page.waitForSelector(this.constraintListItemSelector, { state: 'visible', strict: true });
  }

  async createSchedulingCondition(baseURL: string | undefined) {
    const [newSchedulingConditionPage] = await Promise.all([
      this.page.waitForEvent('popup'),
      this.schedulingConditionNewButton.click(),
    ]);
    this.schedulingConditions.updatePage(newSchedulingConditionPage);
    await newSchedulingConditionPage.waitForURL(`${baseURL}/scheduling/conditions/new?modelId=*&&specId=*`);
    await this.schedulingConditions.createSchedulingCondition(baseURL);
    await newSchedulingConditionPage.close();
    this.schedulingConditions.updatePage(this.page);
    await this.page.waitForSelector(this.schedulingConditionListItemSelector, { state: 'visible', strict: true });
  }

  async createSchedulingGoal(baseURL: string | undefined) {
    const [newSchedulingGoalPage] = await Promise.all([
      this.page.waitForEvent('popup'),
      this.schedulingGoalNewButton.click(),
    ]);
    this.schedulingGoals.updatePage(newSchedulingGoalPage);
    await newSchedulingGoalPage.waitForURL(`${baseURL}/scheduling/goals/new?modelId=*&&specId=*`);
    await this.schedulingGoals.createSchedulingGoal(baseURL);
    await newSchedulingGoalPage.close();
    this.schedulingGoals.updatePage(this.page);
    await this.page.waitForSelector(this.schedulingGoalListItemSelector, { state: 'visible', strict: true });
  }

  async deleteAllActivities() {
    await expect(this.confirmModal).not.toBeVisible();

    await this.activitiesTableFirstRow.click({ button: 'right' });
    await this.page.locator('.context-menu > .context-menu-item:has-text("Select All Activities")').click();
    await this.activitiesTableFirstRow.click({ button: 'right' });
    await this.page.locator('.context-menu > .context-menu-item:has-text("Delete 10 Activities")').click();

    await this.confirmModal.waitFor({ state: 'attached' });
    await this.confirmModal.waitFor({ state: 'visible' });
    await expect(this.confirmModal).toBeVisible();
    await expect(this.confirmModalDeleteButton).toBeVisible();
    await this.confirmModalDeleteButton.click();
    await this.page.pause();
    await this.activitiesTableFirstRow.waitFor({ state: 'detached' });
    await this.activitiesTableFirstRow.waitFor({ state: 'hidden' });
    await expect(this.activitiesTableFirstRow).not.toBeVisible();
  }

  /**
   * Wait for Hasura events to finish seeding the database after a model is created.
   * If we do not wait then navigation to the plan will fail because the data is not there yet.
   * If your tests fail then the timeout might be too short.
   * Re-run the tests and increase the timeout if you get consistent failures.
   */
  async goto() {
    await this.page.waitForTimeout(1200);
    await this.page.goto(`/plans/${this.plans.planId}`, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(250);
  }

  async runAnalysis() {
    await this.analyzeButton.click();
    await this.page.waitForSelector(this.schedulingStatusSelector('Incomplete'), { state: 'attached', strict: true });
    await this.page.waitForSelector(this.schedulingStatusSelector('Incomplete'), { state: 'visible', strict: true });
    await this.page.waitForSelector(this.schedulingStatusSelector('Complete'), { state: 'attached', strict: true });
    await this.page.waitForSelector(this.schedulingStatusSelector('Complete'), { state: 'visible', strict: true });
  }

  async runScheduling() {
    await this.scheduleButton.click();
    await this.page.waitForSelector(this.schedulingStatusSelector('Incomplete'), { state: 'attached', strict: true });
    await this.page.waitForSelector(this.schedulingStatusSelector('Incomplete'), { state: 'visible', strict: true });
    await this.page.waitForSelector(this.schedulingStatusSelector('Complete'), { state: 'attached', strict: true });
    await this.page.waitForSelector(this.schedulingStatusSelector('Complete'), { state: 'visible', strict: true });
  }

  async showConstraintsLayout() {
    await this.showPanel('Constraints');
    await this.showPanel('Constraint Violations', true);
    await this.panelConstraints.waitFor({ state: 'attached' });
    await this.panelConstraints.waitFor({ state: 'visible' });
    await this.panelActivityTable.waitFor({ state: 'attached' });
    await this.panelActivityTable.waitFor({ state: 'visible' });
    await this.panelConstraintViolations.waitFor({ state: 'attached' });
    await this.panelConstraintViolations.waitFor({ state: 'visible' });
    await this.panelTimeline.waitFor({ state: 'attached' });
    await this.panelTimeline.waitFor({ state: 'visible' });
    await expect(this.panelConstraints).toBeVisible();
    await expect(this.panelActivityTable).toBeVisible();
    await expect(this.panelConstraintViolations).toBeVisible();
    await expect(this.panelTimeline).toBeVisible();
  }

  async showPanel(name: string, pickLastMenu: boolean = false) {
    await expect(this.gridMenu).not.toBeVisible();
    if (pickLastMenu) {
      await this.gridMenuButton.last().click();
    } else {
      await this.gridMenuButton.first().click();
    }
    await this.gridMenu.waitFor({ state: 'attached' });
    await this.gridMenu.waitFor({ state: 'visible' });
    await this.gridMenuItem(name).click();
  }

  async showSchedulingLayout() {
    await this.navButtonScheduling.click();
    await this.panelSchedulingGoals.waitFor({ state: 'attached' });
    await this.panelSchedulingGoals.waitFor({ state: 'visible' });
    await this.panelSchedulingConditions.waitFor({ state: 'attached' });
    await this.panelSchedulingConditions.waitFor({ state: 'visible' });
    await this.panelActivityForm.waitFor({ state: 'attached' });
    await this.panelActivityForm.waitFor({ state: 'visible' });
    await this.panelActivityTable.waitFor({ state: 'attached' });
    await this.panelActivityTable.waitFor({ state: 'visible' });
    await this.panelTimeline.waitFor({ state: 'attached' });
    await this.panelTimeline.waitFor({ state: 'visible' });
    await expect(this.panelSchedulingGoals).toBeVisible();
    await expect(this.panelActivityForm).toBeVisible();
    await expect(this.panelActivityTable).toBeVisible();
    await expect(this.panelTimeline).toBeVisible();
    await expect(this.navButtonScheduling).toHaveClass(/selected/);
  }

  updatePage(page: Page): void {
    this.appError = page.locator('.app-error');
    this.activitiesTable = page.locator(`div.ag-theme-stellar.table`);
    this.activitiesTableFirstRow = page
      .locator(`div.ag-theme-stellar.table .ag-center-cols-container > .ag-row`)
      .nth(0);
    this.confirmModal = page.locator(`.modal:has-text("Delete Activities")`);
    this.confirmModalDeleteButton = page.locator(`.modal:has-text("Delete Activities") >> button:has-text("Delete")`);
    this.constraintNewButton = page.locator(`button[name="new-constraint"]`);
    this.gridMenu = page.locator('.grid-menu > .menu > .menu-slot');
    this.gridMenuButton = page.locator('.grid-menu');
    this.gridMenuItem = (name: string) =>
      page.locator(`.grid-menu > .menu > .menu-slot > .menu-item:has-text("${name}")`);
    this.navButtonExpansion = page.locator(`.nav-button:has-text("Expansion")`);
    this.navButtonExpansionMenu = page.locator(`.nav-button:has-text("Expansion") .menu`);
    this.navButtonConstraints = page.locator(`.nav-button:has-text("Constraints")`);
    this.navButtonConstraintsMenu = page.locator(`.nav-button:has-text("Constraints") .menu`);
    this.navButtonScheduling = page.locator(`.nav-button:has-text("Scheduling")`);
    this.navButtonSchedulingMenu = page.locator(`.nav-button:has-text("Scheduling") .menu`);
    this.navButtonSimulation = page.locator(`.nav-button:has-text("Simulation")`);
    this.navButtonSimulationMenu = page.locator(`.nav-button:has-text("Simulation") .menu`);
    this.navButtonView = page.locator('.view-menu');
    this.navButtonViewMenu = page.locator(`.view-menu .menu`);
    this.navButtonViewSaveAsMenuButton = page.locator(`.view-menu .menu .menu-item:has-text("Save as")`);
    this.navButtonViewSavedViewsMenuButton = page.locator(`.view-menu .menu .menu-item:has-text("Browse saved views")`);
    this.page = page;
    this.panelActivityForm = page.locator('[data-component-name="ActivityFormPanel"]');
    this.panelActivityTable = page.locator('[data-component-name="ActivityTablePanel"]');
    this.panelActivityTypes = page.locator('[data-component-name="ActivityTypesPanel"]');
    this.panelConstraintViolations = page.locator('[data-component-name="ConstraintViolationsPanel"]');
    this.panelConstraints = page.locator('[data-component-name="ConstraintsPanel"]');
    this.panelExpansion = page.locator('[data-component-name="ExpansionPanel"]');
    this.panelSchedulingConditions = page.locator('[data-component-name="SchedulingConditionsPanel"]');
    this.panelSchedulingGoals = page.locator('[data-component-name="SchedulingGoalsPanel"]');
    this.panelSimulation = page.locator('[data-component-name="SimulationPanel"]');
    this.panelTimeline = page.locator('[data-component-name="TimelinePanel"]');
    this.panelTimelineEditor = page.locator('[data-component-name="TimelineEditorPanel"]');
    this.panelViewEditor = page.locator('[data-component-name="ViewEditorPanel"]');
    this.planTitle = page.locator(`.plan-title:has-text("${this.plans.planName}")`);
    this.scheduleButton = page.locator('.header-actions > button[aria-label="Schedule"]');
    this.analyzeButton = page.locator('.header-actions > button[aria-label="Analyze"]');
    this.schedulingGoalDifferenceBadge = page.locator('.difference-badge');
    this.schedulingGoalEnabledCheckbox = page.locator(
      `.scheduling-goal:has-text("${this.schedulingGoals.goalName}") >> input[type="checkbox"]`,
    );
    this.schedulingConditionEnabledCheckbox = page.locator(
      `.scheduling-condition:has-text("${this.schedulingConditions.conditionName}") >> input[type="checkbox"]`,
    );
    this.schedulingGoalExpand = page.locator('span[aria-label="scheduling-goal-expand"]');
    this.schedulingGoalNewButton = page.locator(`button[name="new-scheduling-goal"]`);
    this.schedulingConditionNewButton = page.locator(`button[name="new-scheduling-condition"]`);
    this.schedulingSatisfiedActivity = page.locator('li > .satisfied-activity');
  }
}
