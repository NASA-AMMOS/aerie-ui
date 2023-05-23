import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { get } from 'svelte/store';
import { activityDirectivesMap, selectedActivityDirectiveId } from '../stores/activities';
import { permissibleQueries as permissibleQueriesStore } from '../stores/app';
import { checkConstraintsStatus, constraintViolationsResponse } from '../stores/constraints';
import { catchError, catchSchedulingError } from '../stores/errors';
import {
  creatingExpansionSequence,
  planExpansionStatus,
  savingExpansionRule,
  savingExpansionSet,
} from '../stores/expansion';
import { createModelError, createPlanError, creatingModel, creatingPlan, models, plan } from '../stores/plan';
import { schedulingStatus, selectedSpecId } from '../stores/scheduling';
import { commandDictionaries } from '../stores/sequencing';
import { selectedSpanId, simulationDatasetId, simulationDatasetIds } from '../stores/simulation';
import { applyViewUpdate, view } from '../stores/views';
import type {
  ActivityDirective,
  ActivityDirectiveId,
  ActivityDirectiveInsertInput,
  ActivityDirectiveSetInput,
  ActivityDirectivesMap,
  ActivityPreset,
  ActivityPresetId,
  ActivityPresetInsertInput,
  ActivityPresetSetInput,
  ActivityType,
  ActivityTypeExpansionRules,
} from '../types/activity';
import type { ActivityMetadata } from '../types/activity-metadata';
import type { JsonWebToken, ReqLoginResponse, ReqLogoutResponse, ReqSessionResponse } from '../types/auth';
import type { Constraint, ConstraintInsertInput, ConstraintViolation } from '../types/constraint';
import type {
  ExpansionRule,
  ExpansionRuleInsertInput,
  ExpansionSequence,
  ExpansionSequenceInsertInput,
  ExpansionSequenceToActivityInsertInput,
  SeqId,
} from '../types/expansion';
import type { ModelInsertInput, ModelSlim } from '../types/model';
import type { DslTypeScriptResponse, TypeScriptFile } from '../types/monaco';
import type {
  ArgumentsMap,
  EffectiveArguments,
  ParameterValidationError,
  ParameterValidationResponse,
} from '../types/parameter';
import type { PermissibleQueryResponse } from '../types/permissions';
import type {
  Plan,
  PlanBranchRequestAction,
  PlanInsertInput,
  PlanMergeConflictingActivity,
  PlanMergeNonConflictingActivity,
  PlanMergeRequestSchema,
  PlanMergeResolution,
  PlanSchedulingSpec,
  PlanSchema,
  PlanSlim,
} from '../types/plan';
import type {
  SchedulingCondition,
  SchedulingConditionInsertInput,
  SchedulingGoal,
  SchedulingGoalInsertInput,
  SchedulingResponse,
  SchedulingSpec,
  SchedulingSpecCondition,
  SchedulingSpecConditionInsertInput,
  SchedulingSpecGoal,
  SchedulingSpecGoalInsertInput,
  SchedulingSpecInsertInput,
} from '../types/scheduling';
import type {
  CommandDictionary,
  GetSeqJsonResponse,
  SeqJson,
  UserSequence,
  UserSequenceInsertInput,
} from '../types/sequencing';
import type {
  PlanDataset,
  Profile,
  Resource,
  ResourceType,
  SimulateResponse,
  Simulation,
  SimulationInitialUpdateInput,
  SimulationTemplate,
  SimulationTemplateInsertInput,
  SimulationTemplateSetInput,
  Span,
} from '../types/simulation';
import type { View, ViewDefinition, ViewInsertInput } from '../types/view';
import { ActivityDeletionAction } from './activities';
import { convertToQuery, formatHasuraStringArray, parseFloatOrNull, setQueryParam, sleep } from './generic';
import gql, { convertToGQLArray } from './gql';
import {
  showConfirmModal,
  showCreatePlanBranchModal,
  showCreateViewModal,
  showDeleteActivitiesModal,
  showEditViewModal,
  showPlanBranchRequestModal,
  showUploadViewModal,
} from './modal';
import { reqGateway, reqHasura } from './requests';
import { sampleProfiles } from './resources';
import { Status } from './status';
import { getDoyTime, getDoyTimeFromInterval, getIntervalFromDoyRange } from './time';
import { showFailureToast, showSuccessToast } from './toast';
import { generateDefaultView, validateViewJSONAgainstSchema } from './view';

function getPermission(queries: string[]): boolean {
  const permissibleQueries = get(permissibleQueriesStore);
  if (permissibleQueries) {
    return queries.reduce((prevValue: boolean, queryName) => {
      return prevValue && !!permissibleQueries[queryName];
    }, true);
  }
  return false;
}

function throwPermissionError(attemptedAction: string): never {
  throw Error(`You do not have permission to: ${attemptedAction}.`);
}

/**
 * Functions that have side-effects (e.g. HTTP requests, toasts, popovers, store updates, etc.).
 */
const effects = {
  async applyPresetToActivity(
    presetId: ActivityPresetId,
    activityId: ActivityDirectiveId,
    planId: number,
    numOfUserChanges: number,
  ): Promise<void> {
    try {
      if (!effects.applyPresetToActivityPermission()) {
        throwPermissionError('apply a preset to an activity directive');
      }

      let confirm: boolean = true;

      if (numOfUserChanges > 0) {
        ({ confirm } = await showConfirmModal(
          'Apply Preset',
          `There ${numOfUserChanges > 1 ? 'are' : 'is'} currently ${numOfUserChanges} manually edited parameter${
            numOfUserChanges > 1 ? 's' : ''
          }. This will remove existing edits and apply preset parameters.`,
          'Apply Preset to Activity Directive',
        ));
      }

      if (confirm) {
        await reqHasura(gql.APPLY_PRESET_TO_ACTIVITY, {
          activityId,
          planId,
          presetId,
        });
        showSuccessToast('Preset Successfully Applied to Activity');
      }
    } catch (e) {
      catchError('Preset Unable To Be Applied To Activity', e as Error);
      showFailureToast('Preset Application Failed');
    }
  },

  /**
   * @description For `applyPresetToActivity` permission
   * @returns boolean
   */
  applyPresetToActivityPermission(): boolean {
    return getPermission(['apply_preset_to_activity']);
  },

  async applyTemplateToSimulation(
    template: SimulationTemplate,
    simulation: Simulation,
    numOfUserChanges: number,
  ): Promise<void> {
    try {
      if (!effects.applyTemplateToSimulationPermission()) {
        throwPermissionError('apply a template to a simulation');
      }

      let confirm: boolean = true;
      if (numOfUserChanges > 0) {
        ({ confirm } = await showConfirmModal(
          'Apply Simulation Template',
          `There ${numOfUserChanges > 1 ? 'are' : 'is'} currently ${numOfUserChanges} manually edited parameter${
            numOfUserChanges > 1 ? 's' : ''
          }. This will remove existing edits and apply template parameters.`,
          'Apply Template to Simulation',
        ));
      }

      if (confirm) {
        const newSimulation: Simulation = { ...simulation, arguments: template.arguments, template };

        await effects.updateSimulation(newSimulation);
        showSuccessToast('Template Successfully Applied to Simulation');
      }
    } catch (e) {
      catchError('Template Unable To Be Applied To Simulation', e as Error);
      showFailureToast('Template Application Failed');
    }
  },

  /**
   * @description For `applyTemplateToSimulation` permission
   * @returns boolean
   */
  applyTemplateToSimulationPermission(): boolean {
    return effects.updateSimulationPermission();
  },

  async checkConstraints(): Promise<void> {
    try {
      checkConstraintsStatus.set(Status.Incomplete);
      const currentPlan = get(plan);
      if (currentPlan !== null) {
        const { id: planId } = currentPlan;
        const data = await reqHasura<{ violations: ConstraintViolation[] }>(gql.CHECK_CONSTRAINTS, {
          planId,
        });
        const { checkConstraintsResponse } = data;
        const { violations } = checkConstraintsResponse;

        constraintViolationsResponse.set(violations);
        checkConstraintsStatus.set(Status.Complete);
        showSuccessToast('Check Constraints Complete');
      } else {
        throw Error('Plan is not defined.');
      }
    } catch (e) {
      catchError('Check Constraints Failed', e as Error);
      checkConstraintsStatus.set(Status.Failed);
      showFailureToast('Check Constraints Failed');
    }
  },

  async createActivityDirective(
    argumentsMap: ArgumentsMap,
    start_time_doy: string,
    type: string,
    name: string,
    tags: string[],
    metadata: ActivityMetadata,
  ): Promise<void> {
    try {
      if (!effects.createActivityDirectivePermission()) {
        throwPermissionError('add a directive to the plan');
      }

      const currentPlan = get(plan);
      if (currentPlan !== null) {
        const start_offset = getIntervalFromDoyRange(currentPlan.start_time_doy, start_time_doy);
        const tagsString = formatHasuraStringArray(tags);
        const activityDirectiveInsertInput: ActivityDirectiveInsertInput = {
          anchor_id: null,
          anchored_to_start: true,
          arguments: argumentsMap,
          metadata,
          name,
          plan_id: currentPlan.id,
          start_offset,
          tags: tagsString,
          type,
        };
        const data = await reqHasura<ActivityDirective>(gql.CREATE_ACTIVITY_DIRECTIVE, {
          activityDirectiveInsertInput,
        });
        const { insert_activity_directive_one: newActivityDirective } = data;
        const { id } = newActivityDirective;

        activityDirectivesMap.update((currentActivityDirectivesMap: ActivityDirectivesMap) => ({
          ...currentActivityDirectivesMap,
          [id]: newActivityDirective,
        }));
        selectedActivityDirectiveId.set(id);
        selectedSpanId.set(null);

        showSuccessToast('Activity Directive Created Successfully');
      } else {
        throw Error('Plan is not defined.');
      }
    } catch (e) {
      catchError('Activity Directive Create Failed', e as Error);
      showFailureToast('Activity Directive Create Failed');
    }
  },

  /**
   * @description For `createActivityDirective` permission
   * @returns boolean
   */
  createActivityDirectivePermission(): boolean {
    return getPermission(['insert_activity_directive_one']);
  },

  async createActivityPreset(
    argumentsMap: ArgumentsMap,
    associatedActivityType: string,
    name: string,
    modelId: number,
  ): Promise<number | null> {
    try {
      if (!effects.createActivityPresetPermission()) {
        throwPermissionError('create an activity preset');
      }

      const activityPresetInsertInput: ActivityPresetInsertInput = {
        arguments: argumentsMap,
        associated_activity_type: associatedActivityType,
        model_id: modelId,
        name,
      };
      const {
        insert_activity_presets_one: { id, name: presetName },
      } = await reqHasura<ActivityPreset>(gql.CREATE_ACTIVITY_PRESET, {
        activityPresetInsertInput,
      });

      showSuccessToast(`Activity Preset ${presetName} Created Successfully`);
      return id;
    } catch (e) {
      catchError('Activity Preset Create Failed', e as Error);
      showFailureToast('Activity Preset Create Failed');
      return null;
    }
  },

  /**
   * @description For `createActivityPreset` permission
   * @returns boolean
   */
  createActivityPresetPermission(): boolean {
    return getPermission(['insert_activity_presets_one']);
  },

  async createCommandDictionary(files: FileList): Promise<CommandDictionary | null> {
    try {
      if (!effects.createCommandDictionaryPermission()) {
        throwPermissionError('upload a command dictionary');
      }

      const file: File = files[0];
      const dictionary = await file.text();
      const data = await reqHasura<CommandDictionary>(gql.CREATE_COMMAND_DICTIONARY, { dictionary });
      const { createCommandDictionary: newCommandDictionary } = data;
      return newCommandDictionary;
    } catch (e) {
      catchError('Command Dictionary Upload Failed', e as Error);
      return null;
    }
  },

  /**
   * @description For `createCommandDictionary` permission
   * @returns boolean
   */
  createCommandDictionaryPermission(): boolean {
    return getPermission(['uploadDictionary']);
  },

  async createConstraint(
    definition: string,
    description: string,
    model_id: number | null,
    name: string,
    plan_id: number | null,
  ): Promise<number | null> {
    try {
      if (!effects.createConstraintPermission()) {
        throwPermissionError('create a constraint');
      }

      const constraintInsertInput: ConstraintInsertInput = {
        definition,
        description,
        model_id: plan_id !== null ? null : model_id,
        name,
        plan_id,
      };
      const data = await reqHasura(gql.CREATE_CONSTRAINT, { constraint: constraintInsertInput });
      const { createConstraint } = data;
      const { id } = createConstraint;

      showSuccessToast('Constraint Created Successfully');
      return id;
    } catch (e) {
      catchError('Constraint Creation Failed', e as Error);
      showFailureToast('Constraint Creation Failed');
      return null;
    }
  },

  /**
   * @description For `createConstraint` permission
   * @returns boolean
   */
  createConstraintPermission(): boolean {
    return getPermission(['insert_constraint_one']);
  },

  async createExpansionRule(rule: ExpansionRuleInsertInput): Promise<number | null> {
    try {
      if (!effects.createExpansionRulePermission()) {
        throwPermissionError('create an expansion rule');
      }

      savingExpansionRule.set(true);
      const data = await reqHasura(gql.CREATE_EXPANSION_RULE, { rule });
      const { createExpansionRule } = data;
      const { id } = createExpansionRule;
      showSuccessToast('Expansion Rule Created Successfully');
      savingExpansionRule.set(false);
      return id;
    } catch (e) {
      catchError('Expansion Rule Create Failed', e as Error);
      showFailureToast('Expansion Rule Create Failed');
      savingExpansionRule.set(false);
      return null;
    }
  },

  /**
   * @description For `createExpansionRule` permission
   * @returns boolean
   */
  createExpansionRulePermission(): boolean {
    return getPermission(['insert_expansion_rule_one']);
  },

  async createExpansionSequence(seqId: string, simulationDatasetId: number): Promise<void> {
    try {
      if (!effects.createExpansionSequencePermission()) {
        throwPermissionError('create an expansion sequence');
      }

      creatingExpansionSequence.set(true);
      const sequence: ExpansionSequenceInsertInput = {
        metadata: {},
        seq_id: seqId,
        simulation_dataset_id: simulationDatasetId,
      };
      await reqHasura<SeqId>(gql.CREATE_EXPANSION_SEQUENCE, { sequence });
      showSuccessToast('Expansion Sequence Created Successfully');
      creatingExpansionSequence.set(false);
    } catch (e) {
      catchError('Expansion Sequence Create Failed', e as Error);
      showFailureToast('Expansion Sequence Create Failed');
      creatingExpansionSequence.set(false);
    }
  },

  /**
   * @description For `createExpansionSequence` permission
   * @returns boolean
   */
  createExpansionSequencePermission(): boolean {
    return getPermission(['insert_sequence_one']);
  },

  async createExpansionSet(dictionaryId: number, modelId: number, expansionRuleIds: number[]): Promise<number | null> {
    try {
      if (!effects.createExpansionSetPermission()) {
        throwPermissionError('create an expansion set');
      }

      savingExpansionSet.set(true);
      const data = await reqHasura(gql.CREATE_EXPANSION_SET, { dictionaryId, expansionRuleIds, modelId });
      const { createExpansionSet } = data;
      const { id } = createExpansionSet;
      showSuccessToast('Expansion Set Created Successfully');
      savingExpansionSet.set(false);
      return id;
    } catch (e) {
      catchError('Expansion Set Create Failed', e as Error);
      showFailureToast('Expansion Set Create Failed');
      savingExpansionSet.set(false);
      return null;
    }
  },

  /**
   * @description For `createExpansionSet` permission
   * @returns boolean
   */
  createExpansionSetPermission(): boolean {
    return getPermission(['createExpansionSet']);
  },

  async createModel(name: string, version: string, files: FileList): Promise<void> {
    try {
      createModelError.set(null);

      if (!effects.createModelPermission()) {
        throwPermissionError('upload a model');
      }

      creatingModel.set(true);

      const file: File = files[0];
      const jar_id = await effects.uploadFile(file);

      if (jar_id !== null) {
        const modelInsertInput: ModelInsertInput = {
          jar_id,
          mission: '',
          name,
          version,
        };
        const data = await reqHasura(gql.CREATE_MODEL, { model: modelInsertInput });
        const { createModel } = data;
        const { id } = createModel;
        const model: ModelSlim = { id, jar_id, name, version };

        showSuccessToast('Model Created Successfully');
        createModelError.set(null);
        creatingModel.set(false);
        models.updateValue((currentModels: ModelSlim[]) => [...currentModels, model]);
      }
    } catch (e) {
      catchError('Model Create Failed', e as Error);
      showFailureToast('Model Create Failed');
      createModelError.set((e as Error).message);
      creatingModel.set(false);
    }
  },

  /**
   * @description For `createModel` permission
   * @returns boolean
   */
  createModelPermission(): boolean {
    return getPermission(['insert_mission_model_one']);
  },

  async createPlan(
    end_time_doy: string,
    model_id: number,
    name: string,
    start_time_doy: string,
    simulation_template_id: number | null,
  ): Promise<PlanSlim | null> {
    try {
      createPlanError.set(null);

      if (!effects.createPlanPermission()) {
        throwPermissionError('create a plan');
      }

      creatingPlan.set(true);

      const planInsertInput: PlanInsertInput = {
        duration: getIntervalFromDoyRange(start_time_doy, end_time_doy),
        model_id,
        name,
        start_time: start_time_doy, // Postgres accepts DOY dates for it's 'timestamptz' type.
      };
      const data = await reqHasura<Pick<PlanSchema, 'id' | 'revision' | 'start_time'>>(gql.CREATE_PLAN, {
        plan: planInsertInput,
      });
      const { createPlan } = data;
      const { id, revision, start_time } = createPlan;

      if (!(await effects.initialSimulationUpdate(id, simulation_template_id, start_time_doy, end_time_doy))) {
        throw Error('Failed to update simulation.');
      }

      if (
        !(await effects.createSchedulingSpec({
          analysis_only: false,
          horizon_end: end_time_doy,
          horizon_start: start_time_doy,
          plan_id: id,
          plan_revision: revision,
          simulation_arguments: {},
        }))
      ) {
        throw Error('Failed to create scheduling spec.');
      }

      const plan: PlanSlim = {
        end_time_doy,
        id,
        model_id,
        name,
        revision,
        start_time,
        start_time_doy,
      };

      showSuccessToast('Plan Created Successfully');
      createPlanError.set(null);
      creatingPlan.set(false);

      return plan;
    } catch (e) {
      catchError('Plan Create Failed', e as Error);
      showFailureToast('Plan Create Failed');
      createPlanError.set((e as Error).message);
      creatingPlan.set(false);

      return null;
    }
  },

  /**
   * @description For `createPlan` permission
   * @returns boolean
   */
  createPlanPermission(): boolean {
    return getPermission(['insert_plan_one']);
  },

  async createPlanBranch(plan: Plan): Promise<void> {
    try {
      if (!effects.createPlanBranchPermission()) {
        throwPermissionError('create a branch');
      }

      const { confirm, value = null } = await showCreatePlanBranchModal(plan);

      if (confirm && value) {
        const { name, plan } = value;
        const data = await reqHasura(gql.DUPLICATE_PLAN, { new_plan_name: name, plan_id: plan.id });
        const { duplicate_plan } = data;
        const { new_plan_id } = duplicate_plan;
        await effects.createSchedulingSpec({
          analysis_only: false,
          horizon_end: plan.end_time_doy,
          horizon_start: plan.start_time_doy,
          plan_id: new_plan_id,
          plan_revision: 0,
          simulation_arguments: {},
        });
        goto(`${base}/plans/${duplicate_plan.new_plan_id}`);
        showSuccessToast('Branch Created Successfully');
      }
    } catch (e) {
      catchError('Branch Creation Failed', e as Error);
      showFailureToast('Branch Creation Failed');
    }
  },

  /**
   * @description For `createPlanBranch` permission
   * @returns boolean
   */
  createPlanBranchPermission(): boolean {
    return getPermission(['duplicate_plan']);
  },

  async createPlanBranchRequest(plan: Plan, action: PlanBranchRequestAction): Promise<void> {
    try {
      if (!effects.createPlanBranchRequestPermission()) {
        throwPermissionError('create a branch merge request');
      }

      const { confirm, value } = await showPlanBranchRequestModal(plan, action);

      if (confirm && value) {
        const { source_plan_id, target_plan_id } = value;
        if (action === 'merge') {
          await effects.createPlanMergeRequest(source_plan_id, target_plan_id);
        }
      }
    } catch (e) {
      catchError(e as Error);
    }
  },

  /**
   * @description For `createPlanBranchRequest` permission
   * @returns boolean
   */
  createPlanBranchRequestPermission(): boolean {
    return effects.createPlanMergeRequestPermission();
  },

  async createPlanMergeRequest(source_plan_id: number, target_plan_id: number): Promise<number | null> {
    try {
      if (!effects.createPlanBranchRequestPermission()) {
        throwPermissionError('create a branch merge request');
      }

      const data = await reqHasura<{ merge_request_id: number }>(gql.CREATE_PLAN_MERGE_REQUEST, {
        source_plan_id,
        target_plan_id,
      });
      const { create_merge_request } = data;
      const { merge_request_id } = create_merge_request;
      showSuccessToast('Merge Request Created Successfully');
      return merge_request_id;
    } catch (e) {
      catchError('Merge Request Create Failed', e as Error);
      showFailureToast('Merge Request Create Failed');
      return null;
    }
  },

  /**
   * @description For `createPlanMergeRequest` permission
   * @returns boolean
   */
  createPlanMergeRequestPermission(): boolean {
    return getPermission(['create_merge_request']);
  },

  async createSchedulingCondition(
    definition: string,
    description: string,
    name: string,
    userId: string,
    modelId: number,
  ): Promise<SchedulingCondition | null> {
    try {
      if (!effects.createSchedulingConditionPermission()) {
        throwPermissionError('create a scheduling condition');
      }

      const conditionInsertInput: SchedulingConditionInsertInput = {
        author: userId,
        definition,
        description,
        last_modified_by: userId,
        model_id: modelId,
        name,
      };
      const data = await reqHasura<SchedulingCondition>(gql.CREATE_SCHEDULING_CONDITION, {
        condition: conditionInsertInput,
      });
      const { createSchedulingCondition: newCondition } = data;

      showSuccessToast('Scheduling Condition Created Successfully');
      return newCondition;
    } catch (e) {
      catchError('Scheduling Condition Create Failed', e as Error);
      showFailureToast('Scheduling Condition Create Failed');
      return null;
    }
  },

  /**
   * @description For `createSchedulingCondition` permission
   * @returns boolean
   */
  createSchedulingConditionPermission(): boolean {
    return getPermission(['insert_scheduling_condition_one']);
  },

  async createSchedulingGoal(
    definition: string,
    description: string,
    name: string,
    userId: string,
    modelId: number,
  ): Promise<SchedulingGoal | null> {
    try {
      if (!effects.createSchedulingGoalPermission()) {
        throwPermissionError('create a scheduling goal');
      }

      const goalInsertInput: SchedulingGoalInsertInput = {
        author: userId,
        definition,
        description,
        last_modified_by: userId,
        model_id: modelId,
        name,
      };
      const data = await reqHasura<SchedulingGoal>(gql.CREATE_SCHEDULING_GOAL, { goal: goalInsertInput });
      const { createSchedulingGoal: newGoal } = data;

      showSuccessToast('Scheduling Goal Created Successfully');
      return newGoal;
    } catch (e) {
      catchError('Scheduling Goal Create Failed', e as Error);
      showFailureToast('Scheduling Goal Create Failed');
      return null;
    }
  },

  /**
   * @description For `createSchedulingGoal` permission
   * @returns boolean
   */
  createSchedulingGoalPermission(): boolean {
    return getPermission(['insert_scheduling_goal_one']);
  },

  async createSchedulingSpec(spec: SchedulingSpecInsertInput): Promise<Pick<SchedulingSpec, 'id'> | null> {
    try {
      if (!effects.createSchedulingSpecPermission()) {
        throwPermissionError('create a scheduling spec');
      }

      const data = await reqHasura<Pick<SchedulingSpec, 'id'>>(gql.CREATE_SCHEDULING_SPEC, { spec });
      const { createSchedulingSpec: newSchedulingSpec } = data;
      return newSchedulingSpec;
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  /**
   * @description For `createSchedulingSpec` permission
   * @returns boolean
   */
  createSchedulingSpecPermission(): boolean {
    return getPermission(['insert_scheduling_specification_one']);
  },

  async createSchedulingSpecCondition(spec_condition: SchedulingSpecConditionInsertInput): Promise<void> {
    try {
      if (!effects.createSchedulingSpecConditionPermission()) {
        throwPermissionError('create a scheduling spec condition');
      }

      await reqHasura(gql.CREATE_SCHEDULING_SPEC_CONDITION, { spec_condition });
    } catch (e) {
      catchError(e as Error);
    }
  },

  /**
   * @description For `createSchedulingSpecCondition` permission
   * @returns boolean
   */
  createSchedulingSpecConditionPermission(): boolean {
    return getPermission(['insert_scheduling_specification_conditions_one']);
  },

  async createSchedulingSpecGoal(spec_goal: SchedulingSpecGoalInsertInput): Promise<void> {
    try {
      if (!effects.createSchedulingSpecGoalPermission()) {
        throwPermissionError('create a scheduling spec goal');
      }

      await reqHasura(gql.CREATE_SCHEDULING_SPEC_GOAL, { spec_goal });
    } catch (e) {
      catchError(e as Error);
    }
  },

  /**
   * @description For `createSchedulingSpecGoal` permission
   * @returns boolean
   */
  createSchedulingSpecGoalPermission(): boolean {
    return getPermission(['insert_scheduling_specification_goals_one']);
  },

  async createSimulationTemplate(
    argumentsMap: ArgumentsMap,
    name: string,
    modelId: number,
  ): Promise<SimulationTemplate | null> {
    try {
      if (!effects.createSimulationTemplatePermission()) {
        throwPermissionError('create a simulation template');
      }

      const simulationTemplateInsertInput: SimulationTemplateInsertInput = {
        arguments: argumentsMap,
        description: name,
        model_id: modelId,
      };
      const { insert_simulation_template_one: newTemplate } = await reqHasura<SimulationTemplate>(
        gql.CREATE_SIMULATION_TEMPLATE,
        {
          simulationTemplateInsertInput,
        },
      );

      showSuccessToast(`Simulation Template ${name} Created Successfully`);
      return newTemplate;
    } catch (e) {
      catchError('Simulation Template Create Failed', e as Error);
      showFailureToast('Simulation Template Create Failed');
      return null;
    }
  },

  /**
   * @description For `createSimulationTemplate` permission
   * @returns boolean
   */
  createSimulationTemplatePermission(): boolean {
    return getPermission(['insert_simulation_template_one']);
  },

  async createUserSequence(sequence: UserSequenceInsertInput): Promise<number | null> {
    try {
      if (!effects.createUserSequencePermission()) {
        throwPermissionError('create a user sequence');
      }

      const data = await reqHasura<Pick<UserSequence, 'id'>>(gql.CREATE_USER_SEQUENCE, { sequence });
      const { createUserSequence } = data;
      const { id } = createUserSequence;
      showSuccessToast('User Sequence Created Successfully');
      return id;
    } catch (e) {
      catchError('User Sequence Create Failed', e as Error);
      showFailureToast('User Sequence Create Failed');
      return null;
    }
  },

  /**
   * @description For `createUserSequence` permission
   * @returns boolean
   */
  createUserSequencePermission(): boolean {
    return getPermission(['insert_user_sequence_one']);
  },

  async createView(owner: string, definition: ViewDefinition): Promise<boolean> {
    try {
      if (!effects.createViewPermission()) {
        throwPermissionError('create a view');
      }

      const { confirm, value = null } = await showCreateViewModal();

      if (confirm && value) {
        const { name } = value;
        const viewInsertInput: ViewInsertInput = { definition, name, owner };
        const data = await reqHasura<View>(gql.CREATE_VIEW, { view: viewInsertInput });
        const { newView } = data;

        view.update(() => newView);
        setQueryParam('viewId', `${newView.id}`);
        showSuccessToast('View Created Successfully');
        return true;
      }
    } catch (e) {
      catchError('View Create Failed', e as Error);
      showFailureToast('View Create Failed');
    }

    return false;
  },

  /**
   * @description For `createView` permission
   * @returns boolean
   */
  createViewPermission(): boolean {
    return getPermission(['insert_view_one']);
  },

  async deleteActivityDirective(plan_id: number, id: ActivityDirectiveId): Promise<boolean> {
    try {
      if (!effects.deleteActivityDirectivePermission()) {
        throwPermissionError('delete an activity directive');
      }

      return effects.deleteActivityDirectives(plan_id, [id]);
    } catch (e) {
      catchError('Activity Directive Delete Failed', e as Error);
    }

    return false;
  },

  /**
   * @description For `deleteActivityDirective` permission
   * @returns boolean
   */
  deleteActivityDirectivePermission(): boolean {
    return effects.deleteActivityDirectivesPermission();
  },

  async deleteActivityDirectives(plan_id: number, ids: ActivityDirectiveId[]): Promise<boolean> {
    try {
      if (!effects.deleteActivityDirectivesPermission()) {
        throwPermissionError('delete activity directives');
      }

      type SortedDeletions = {
        [key in ActivityDeletionAction]?: ActivityDirectiveId[];
      };

      const { confirm, value } = await showDeleteActivitiesModal(ids);

      if (confirm && value !== undefined) {
        const sortedActions = Object.keys(value)
          .map(Number)
          .reduce((previousValue: SortedDeletions, activityId: ActivityDirectiveId) => {
            const action = value[activityId];
            if (previousValue[action]) {
              return {
                ...previousValue,
                [action]: [...(previousValue[action] ?? []), activityId],
              };
            }
            return {
              ...previousValue,
              [action]: [activityId],
            };
          }, {});

        const reanchorPlanDeletions = sortedActions[ActivityDeletionAction.ANCHOR_PLAN] ?? [];
        const reanchorRootDeletions = sortedActions[ActivityDeletionAction.ANCHOR_ROOT] ?? [];
        const subtreeDeletions = sortedActions[ActivityDeletionAction.DELETE_CHAIN] ?? [];
        const normalDeletions = sortedActions[ActivityDeletionAction.NORMAL] ?? [];

        if (reanchorRootDeletions.length) {
          await reqHasura(gql.DELETE_ACTIVITY_DIRECTIVES_REANCHOR_TO_ANCHOR, {
            activity_ids: convertToGQLArray(reanchorRootDeletions),
            plan_id,
          });
          activityDirectivesMap.update((currentActivityDirectivesMap: ActivityDirectivesMap) => {
            reanchorRootDeletions.forEach(id => delete currentActivityDirectivesMap[id]);
            return { ...currentActivityDirectivesMap };
          });
        }

        if (reanchorPlanDeletions.length) {
          await reqHasura(gql.DELETE_ACTIVITY_DIRECTIVES_REANCHOR_PLAN_START, {
            activity_ids: convertToGQLArray(reanchorPlanDeletions),
            plan_id,
          });
          activityDirectivesMap.update((currentActivityDirectivesMap: ActivityDirectivesMap) => {
            reanchorPlanDeletions.forEach(id => delete currentActivityDirectivesMap[id]);
            return { ...currentActivityDirectivesMap };
          });
        }

        if (subtreeDeletions.length) {
          await reqHasura(gql.DELETE_ACTIVITY_DIRECTIVES_SUBTREE, {
            activity_ids: convertToGQLArray(subtreeDeletions),
            plan_id,
          });
          activityDirectivesMap.update((currentActivityDirectivesMap: ActivityDirectivesMap) => {
            subtreeDeletions.forEach(id => delete currentActivityDirectivesMap[id]);
            return { ...currentActivityDirectivesMap };
          });
        }

        if (normalDeletions.length) {
          await reqHasura(gql.DELETE_ACTIVITY_DIRECTIVES, {
            activity_ids: normalDeletions,
            plan_id,
          });
          activityDirectivesMap.update((currentActivityDirectivesMap: ActivityDirectivesMap) => {
            normalDeletions.forEach(id => delete currentActivityDirectivesMap[id]);
            return { ...currentActivityDirectivesMap };
          });
        }

        showSuccessToast('Activity Directives Deleted Successfully');
        return true;
      }
    } catch (e) {
      catchError('Activity Directives Delete Failed', e as Error);
      showFailureToast('Activity Directives Delete Failed');
    }

    return false;
  },

  /**
   * @description For `deleteActivityDirectives` permission
   * @returns boolean
   */
  deleteActivityDirectivesPermission(): boolean {
    return getPermission([
      'delete_activity_by_pk_reanchor_to_anchor_bulk',
      'delete_activity_by_pk_reanchor_plan_start_bulk',
      'delete_activity_by_pk_delete_subtree_bulk',
      'delete_activity_directive',
    ]);
  },

  async deleteActivityPreset(id: ActivityPresetId, modelName: string): Promise<boolean> {
    try {
      if (!effects.deleteActivityPresetPermission()) {
        throwPermissionError('delete an activity preset');
      }

      const { confirm } = await showConfirmModal(
        'Delete',
        `This will permanently delete the preset for the mission model: ${modelName}`,
        'Delete Permanently',
      );

      if (confirm) {
        await reqHasura(gql.DELETE_ACTIVITY_PRESET, { id });
        showSuccessToast('Activity Preset Deleted Successfully');
        return true;
      }
    } catch (e) {
      catchError('Activity Preset Delete Failed', e as Error);
      showFailureToast('Activity Preset Delete Failed');
    }

    return false;
  },

  /**
   * @description For `deleteActivityPreset` permission
   * @returns boolean
   */
  deleteActivityPresetPermission(): boolean {
    return getPermission(['delete_activity_presets_by_pk']);
  },

  async deleteCommandDictionary(id: number): Promise<void> {
    try {
      if (!effects.deleteCommandDictionaryPermission()) {
        throwPermissionError('delete this command dictionary');
      }

      const { confirm } = await showConfirmModal(
        'Delete',
        'Are you sure you want to delete this dictionary?',
        'Delete Command Dictionary',
      );

      if (confirm) {
        await reqHasura(gql.DELETE_COMMAND_DICTIONARY, { id });
        showSuccessToast('Command Dictionary Deleted Successfully');
        commandDictionaries.filterValueById(id);
      }
    } catch (e) {
      catchError('Command Dictionary Delete Failed', e as Error);
      showFailureToast('Command Dictionary Delete Failed');
    }
  },

  /**
   * @description For `deleteCommandDictionary` permission
   * @returns boolean
   */
  deleteCommandDictionaryPermission(): boolean {
    return getPermission(['delete_command_dictionary_by_pk']);
  },

  async deleteConstraint(id: number): Promise<boolean> {
    try {
      if (!effects.deleteConstraintPermission()) {
        throwPermissionError('delete this constraint');
      }

      const { confirm } = await showConfirmModal(
        'Delete',
        'Are you sure you want to delete this constraint?',
        'Delete Constraint',
      );

      if (confirm) {
        await reqHasura(gql.DELETE_CONSTRAINT, { id });
        showSuccessToast('Constraint Deleted Successfully');
        return true;
      }
    } catch (e) {
      catchError('Constraint Delete Failed', e as Error);
      showFailureToast('Constraint Delete Failed');
    }

    return false;
  },

  /**
   * @description For `deleteConstraint` permission
   * @returns boolean
   */
  deleteConstraintPermission(): boolean {
    return getPermission(['delete_constraint_by_pk']);
  },

  async deleteExpansionRule(id: number): Promise<boolean> {
    try {
      if (!effects.deleteExpansionRulePermission()) {
        throwPermissionError('delete an expansion rule');
      }

      const { confirm } = await showConfirmModal(
        'Delete',
        'Are you sure you want to delete this expansion rule?',
        'Delete Expansion Rule',
      );

      if (confirm) {
        await reqHasura(gql.DELETE_EXPANSION_RULE, { id });
        showSuccessToast('Expansion Rule Deleted Successfully');
        return true;
      }
    } catch (e) {
      catchError('Expansion Rule Delete Failed', e as Error);
      showFailureToast('Expansion Rule Delete Failed');
    }

    return false;
  },

  /**
   * @description For `deleteExpansionRule` permission
   * @returns boolean
   */
  deleteExpansionRulePermission(): boolean {
    return getPermission(['delete_expansion_rule_by_pk']);
  },

  async deleteExpansionSequence(sequence: ExpansionSequence): Promise<void> {
    try {
      if (!effects.deleteExpansionSequencePermission()) {
        throwPermissionError('delete an expansion sequence');
      }

      const { confirm } = await showConfirmModal(
        'Delete',
        'Are you sure you want to delete this expansion sequence?',
        'Delete Expansion Sequence',
      );

      if (confirm) {
        const { seq_id: seqId, simulation_dataset_id: simulationDatasetId } = sequence;
        await reqHasura(gql.DELETE_EXPANSION_SEQUENCE, { seqId, simulationDatasetId });
        showSuccessToast('Expansion Sequence Deleted Successfully');
      }
    } catch (e) {
      catchError('Expansion Sequence Delete Failed', e as Error);
      showFailureToast('Expansion Sequence Delete Failed');
    }
  },

  /**
   * @description For `deleteExpansionSequence` permission
   * @returns boolean
   */
  deleteExpansionSequencePermission(): boolean {
    return getPermission(['delete_sequence_by_pk']);
  },

  async deleteExpansionSequenceToActivity(
    simulation_dataset_id: number,
    simulated_activity_id: number,
  ): Promise<boolean> {
    try {
      if (!effects.deleteExpansionSequenceToActivityPermission()) {
        throwPermissionError('delete an expansion sequence from an activity');
      }

      await reqHasura<SeqId>(gql.DELETE_EXPANSION_SEQUENCE_TO_ACTIVITY, {
        simulated_activity_id,
        simulation_dataset_id,
      });
      showSuccessToast('Expansion Sequence Deleted From Activity Successfully');
      return true;
    } catch (e) {
      catchError('Delete Expansion Sequence From Activity Failed', e as Error);
      showFailureToast('Delete Expansion Sequence From Activity Failed');
      return false;
    }
  },

  /**
   * @description For `deleteExpansionSequenceToActivity` permission
   * @returns boolean
   */
  deleteExpansionSequenceToActivityPermission(): boolean {
    return getPermission(['delete_sequence_to_simulated_activity_by_pk']);
  },

  async deleteExpansionSet(id: number): Promise<boolean> {
    try {
      if (!effects.deleteExpansionSetPermission()) {
        throwPermissionError('delete an expansion set');
      }

      const { confirm } = await showConfirmModal(
        'Delete',
        'Are you sure you want to delete this expansion set?',
        'Delete Expansion Set',
      );

      if (confirm) {
        await reqHasura(gql.DELETE_EXPANSION_SET, { id });
        showSuccessToast('Expansion Set Deleted Successfully');
        return true;
      }

      return false;
    } catch (e) {
      catchError('Expansion Set Delete Failed', e as Error);
      showFailureToast('Expansion Set Delete Failed');
      return false;
    }
  },

  /**
   * @description For `deleteExpansionSet` permission
   * @returns boolean
   */
  deleteExpansionSetPermission(): boolean {
    return getPermission(['delete_expansion_set_by_pk']);
  },

  async deleteFile(id: number): Promise<boolean> {
    try {
      await reqGateway(`/file/${id}`, 'DELETE', null, null, false);
      return true;
    } catch (e) {
      catchError(e as Error);
      return false;
    }
  },

  async deleteModel(model: ModelSlim): Promise<void> {
    try {
      if (!effects.deleteModelPermission()) {
        throwPermissionError('delete this model');
      }

      const { confirm } = await showConfirmModal(
        'Delete',
        'Are you sure you want to delete this model?',
        'Delete Model',
      );

      if (confirm) {
        const { id, jar_id } = model;
        await effects.deleteFile(jar_id);
        await reqHasura(gql.DELETE_MODEL, { id });
        showSuccessToast('Model Deleted Successfully');
        models.filterValueById(id);
      }
    } catch (e) {
      catchError('Model Delete Failed', e as Error);
      showFailureToast('Model Delete Failed');
    }
  },

  /**
   * @description For `deleteModel` permission
   * @returns boolean
   */
  deleteModelPermission(): boolean {
    return getPermission(['delete_mission_model_by_pk']);
  },

  async deletePlan(id: number): Promise<boolean> {
    try {
      if (!effects.deletePlanPermission()) {
        throwPermissionError('delete this plan');
      }

      const { confirm } = await showConfirmModal('Delete', 'Are you sure you want to delete this plan?', 'Delete Plan');

      if (confirm) {
        await reqHasura(gql.DELETE_PLAN, { id });
        showSuccessToast('Plan Deleted Successfully');
        return true;
      }

      return false;
    } catch (e) {
      catchError('Plan Delete Failed', e as Error);
      showFailureToast('Plan Delete Failed');
      return false;
    }
  },

  /**
   * @description For `deletePlan` permission
   * @returns boolean
   */
  deletePlanPermission(): boolean {
    return getPermission(['delete_plan_by_pk', 'delete_scheduling_specification', 'delete_simulation']);
  },

  async deleteSchedulingCondition(id: number): Promise<boolean> {
    try {
      if (!effects.deleteSchedulingConditionPermission()) {
        throwPermissionError('delete this scheduling condition');
      }

      const { confirm } = await showConfirmModal(
        'Delete',
        'Are you sure you want to delete this scheduling condition?',
        'Delete Scheduling Condition',
      );

      if (confirm) {
        await reqHasura(gql.DELETE_SCHEDULING_CONDITION, { id });
        showSuccessToast('Scheduling Condition Deleted Successfully');
        return true;
      } else {
        return false;
      }
    } catch (e) {
      catchError('Scheduling Condition Delete Failed', e as Error);
      showFailureToast('Scheduling Condition Delete Failed');
      return false;
    }
  },

  /**
   * @description For `deleteSchedulingCondition` permission
   * @returns boolean
   */
  deleteSchedulingConditionPermission(): boolean {
    return getPermission(['delete_scheduling_condition_by_pk']);
  },

  async deleteSchedulingGoal(id: number): Promise<boolean> {
    try {
      if (!effects.deleteSchedulingGoalPermission()) {
        throwPermissionError('delete this scheduling goal');
      }

      const { confirm } = await showConfirmModal(
        'Delete',
        'Are you sure you want to delete this scheduling goal?',
        'Delete Scheduling Goal',
      );

      if (confirm) {
        await reqHasura(gql.DELETE_SCHEDULING_GOAL, { id });
        showSuccessToast('Scheduling Goal Deleted Successfully');
        return true;
      } else {
        return false;
      }
    } catch (e) {
      catchError('Scheduling Goal Delete Failed', e as Error);
      showFailureToast('Scheduling Goal Delete Failed');
      return false;
    }
  },

  /**
   * @description For `deleteSchedulingGoal` permission
   * @returns boolean
   */
  deleteSchedulingGoalPermission(): boolean {
    return getPermission(['delete_scheduling_goal_by_pk']);
  },

  async deleteSchedulingSpecGoal(goal_id: number, specification_id: number): Promise<boolean> {
    try {
      if (!effects.deleteSchedulingSpecGoalPermission()) {
        throwPermissionError('delete this scheduling goal');
      }

      await reqHasura(gql.DELETE_SCHEDULING_SPEC_GOAL, { goal_id, specification_id });
      return true;
    } catch (e) {
      catchError('Scheduling Goal Spec Delete Failed', e as Error);
      showFailureToast('Scheduling Goal Delete Failed');
      return false;
    }
  },

  /**
   * @description For `deleteSchedulingSpecGoal` permission
   * @returns boolean
   */
  deleteSchedulingSpecGoalPermission(): boolean {
    return getPermission(['delete_scheduling_specification_goals_by_pk']);
  },

  async deleteSimulationTemplate(id: number, modelName: string): Promise<boolean> {
    try {
      if (!effects.deleteSimulationTemplatePermission()) {
        throwPermissionError('delete this simulation template');
      }

      const { confirm } = await showConfirmModal(
        'Delete',
        `This will permanently delete the template for the mission model: ${modelName}`,
        'Delete Permanently',
      );

      if (confirm) {
        await reqHasura(gql.DELETE_SIMULATION_TEMPLATE, { id });
        showSuccessToast('Simulation Template Deleted Successfully');
        return true;
      }
    } catch (e) {
      catchError('Simulation Template Delete Failed', e as Error);
      showFailureToast('Simulation Template Delete Failed');
    }

    return false;
  },

  /**
   * @description For `deleteSimulationTemplate` permission
   * @returns boolean
   */
  deleteSimulationTemplatePermission(): boolean {
    return getPermission(['delete_simulation_template_by_pk']);
  },

  async deleteUserSequence(id: number): Promise<boolean> {
    try {
      if (!effects.deleteUserSequencePermission()) {
        throwPermissionError('delete this user sequence');
      }

      const { confirm } = await showConfirmModal(
        'Delete',
        'Are you sure you want to delete this user sequence?',
        'Delete User Sequence',
      );

      if (confirm) {
        await reqHasura(gql.DELETE_USER_SEQUENCE, { id });
        showSuccessToast('User Sequence Deleted Successfully');
        return true;
      }

      return false;
    } catch (e) {
      catchError('User Sequence Delete Failed', e as Error);
      showFailureToast('User Sequence Delete Failed');
      return false;
    }
  },

  /**
   * @description For `deleteUserSequence` permission
   * @returns boolean
   */
  deleteUserSequencePermission(): boolean {
    return getPermission(['delete_user_sequence_by_pk']);
  },

  async deleteView(id: number): Promise<boolean> {
    try {
      if (!effects.deleteViewPermission()) {
        throwPermissionError('delete this view');
      }

      const { confirm } = await showConfirmModal('Delete', 'Are you sure you want to delete this view?', 'Delete View');

      if (confirm) {
        await reqHasura(gql.DELETE_VIEW, { id });
        return true;
      }
    } catch (e) {
      catchError(e as Error);
    }

    return false;
  },

  /**
   * @description For `deleteView` permission
   * @returns boolean
   */
  deleteViewPermission(): boolean {
    return getPermission(['delete_view_by_pk']);
  },

  async deleteViews(ids: number[]): Promise<boolean> {
    try {
      if (!effects.deleteViewsPermission()) {
        throwPermissionError('delete these views');
      }

      const { confirm } = await showConfirmModal(
        'Delete',
        'Are you sure you want to delete the selected views?',
        'Delete Views',
      );

      if (confirm) {
        await reqHasura(gql.DELETE_VIEWS, { ids });
        return true;
      }
    } catch (e) {
      catchError(e as Error);
    }

    return false;
  },

  /**
   * @description For `deleteViews` permission
   * @returns boolean
   */
  deleteViewsPermission(): boolean {
    return getPermission(['delete_view']);
  },

  async editView(owner: string, definition: ViewDefinition): Promise<boolean> {
    try {
      if (!effects.editViewPermission()) {
        throwPermissionError('edit this view');
      }

      const { confirm, value = null } = await showEditViewModal();
      if (confirm && value) {
        const { id, name } = value;
        const viewUpdateInput: ViewInsertInput = { definition, name, owner };
        const data = await reqHasura<View>(gql.UPDATE_VIEW, { id, view: viewUpdateInput });
        const {
          updatedView: { name: updatedName, updated_at },
        } = data;

        applyViewUpdate({ name: updatedName, updated_at });
        showSuccessToast('View Edited Successfully');
        return true;
      }
    } catch (e) {
      catchError('View Edit Failed', e as Error);
      showFailureToast('View Edit Failed');
    }

    return false;
  },

  /**
   * @description For `editView` permission
   * @returns boolean
   */
  editViewPermission(): boolean {
    return getPermission(['update_view_by_pk']);
  },

  async expand(expansionSetId: number, simulationDatasetId: number): Promise<void> {
    try {
      planExpansionStatus.set(Status.Incomplete);

      if (!effects.expandPermission()) {
        throwPermissionError('expand this plan');
      }

      await reqHasura(gql.EXPAND, { expansionSetId, simulationDatasetId });
      planExpansionStatus.set(Status.Complete);
      showSuccessToast('Plan Expanded Successfully');
    } catch (e) {
      catchError('Plan Expansion Failed', e as Error);
      planExpansionStatus.set(Status.Failed);
      showFailureToast('Plan Expansion Failed');
    }
  },

  /**
   * @description For `expand` permission
   * @returns boolean
   */
  expandPermission(): boolean {
    return getPermission(['expandAllActivities']);
  },

  async getActivityTypes(modelId: number): Promise<ActivityType[]> {
    try {
      const query = convertToQuery(gql.SUB_ACTIVITY_TYPES);
      const data = await reqHasura<ActivityType[]>(query, { modelId });
      const { activity_type: activityTypes } = data;
      return activityTypes;
    } catch (e) {
      catchError(e as Error);
      return [];
    }
  },

  async getActivityTypesExpansionRules(modelId: number | null | undefined): Promise<ActivityTypeExpansionRules[]> {
    if (modelId !== null && modelId !== undefined) {
      try {
        const data = await reqHasura<ActivityTypeExpansionRules[]>(gql.GET_ACTIVITY_TYPES_EXPANSION_RULES, { modelId });
        const { activity_types } = data;
        return activity_types;
      } catch (e) {
        catchError(e as Error);
        return [];
      }
    } else {
      return [];
    }
  },

  async getConstraint(id: number): Promise<Constraint | null> {
    try {
      const data = await reqHasura<Constraint>(gql.GET_CONSTRAINT, { id });
      const { constraint } = data;
      return constraint;
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  async getEffectiveActivityArguments(
    modelId: number,
    activityTypeName: string,
    argumentsMap: ArgumentsMap,
  ): Promise<EffectiveArguments | null> {
    try {
      const data = await reqHasura<EffectiveArguments>(gql.GET_EFFECTIVE_ACTIVITY_ARGUMENTS, {
        activityTypeName,
        arguments: argumentsMap,
        modelId,
      });
      const { effectiveActivityArguments } = data;
      return effectiveActivityArguments;
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  async getEffectiveModelArguments(modelId: number, argumentsMap: ArgumentsMap): Promise<EffectiveArguments | null> {
    try {
      const data = await reqHasura<EffectiveArguments>(gql.GET_EFFECTIVE_MODEL_ARGUMENTS, {
        arguments: argumentsMap,
        modelId,
      });
      const { effectiveModelArguments } = data;
      return effectiveModelArguments;
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  async getExpansionRule(id: number): Promise<ExpansionRule | null> {
    try {
      const data = await reqHasura(gql.GET_EXPANSION_RULE, { id });
      const { expansionRule } = data;
      return expansionRule;
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  async getExpansionSequenceId(simulated_activity_id: number, simulation_dataset_id: number): Promise<string | null> {
    try {
      const data = await reqHasura<SeqId>(gql.GET_EXPANSION_SEQUENCE_ID, {
        simulated_activity_id,
        simulation_dataset_id,
      });
      const { expansionSequence } = data;

      if (expansionSequence) {
        const { seq_id } = expansionSequence;
        return seq_id;
      } else {
        return null;
      }
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  async getExpansionSequenceSeqJson(seqId: string, simulationDatasetId: number): Promise<string | null> {
    try {
      const data = await reqHasura<GetSeqJsonResponse>(gql.GET_EXPANSION_SEQUENCE_SEQ_JSON, {
        seqId,
        simulationDatasetId,
      });
      const { getSequenceSeqJson } = data;
      const { errors, seqJson, status } = getSequenceSeqJson;

      if (status === 'FAILURE') {
        const [firstError] = errors;
        const { message } = firstError;
        return message;
      } else {
        return JSON.stringify(seqJson, null, 2);
      }
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  async getModels(): Promise<ModelSlim[]> {
    try {
      const data = await reqHasura<ModelSlim[]>(gql.GET_MODELS);
      const { models = [] } = data;
      return models;
    } catch (e) {
      catchError(e as Error);
      return [];
    }
  },

  async getPlan(id: number): Promise<Plan | null> {
    try {
      const data = await reqHasura<PlanSchema>(gql.GET_PLAN, { id });
      const { plan: planSchema } = data;

      if (planSchema) {
        const { start_time, duration } = planSchema;
        const plan: Plan = {
          ...planSchema,
          end_time_doy: getDoyTimeFromInterval(start_time, duration),
          start_time_doy: getDoyTime(new Date(start_time)),
        };
        return plan;
      } else {
        return null;
      }
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  async getPlanMergeConflictingActivities(merge_request_id: number): Promise<PlanMergeConflictingActivity[]> {
    try {
      const query = convertToQuery(gql.SUB_PLAN_MERGE_CONFLICTING_ACTIVITIES);
      const data = await reqHasura<PlanMergeConflictingActivity[]>(query, { merge_request_id });
      const { conflictingActivities } = data;
      return conflictingActivities;
    } catch (e) {
      catchError(e as Error);
      return [];
    }
  },

  async getPlanMergeNonConflictingActivities(merge_request_id: number): Promise<PlanMergeNonConflictingActivity[]> {
    try {
      const data = await reqHasura<PlanMergeNonConflictingActivity[]>(gql.GET_PLAN_MERGE_NON_CONFLICTING_ACTIVITIES, {
        merge_request_id,
      });
      const { nonConflictingActivities } = data;
      return nonConflictingActivities;
    } catch (e) {
      catchError(e as Error);
      return [];
    }
  },

  async getPlanMergeRequestInProgress(planId: number): Promise<PlanMergeRequestSchema | null> {
    try {
      const query = convertToQuery(gql.SUB_PLAN_MERGE_REQUEST_IN_PROGRESS);
      const data = await reqHasura<PlanMergeRequestSchema[]>(query, { planId });
      const { merge_requests } = data;
      const [merge_request] = merge_requests; // Query uses 'limit: 1' so merge_requests.length === 1.
      return merge_request;
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  async getPlanRevision(planId: number): Promise<number | null> {
    try {
      const query = convertToQuery(gql.SUB_PLAN_REVISION);
      const data = await reqHasura<Pick<Plan, 'revision'>>(query, { planId });
      const { plan } = data;
      const { revision } = plan;
      return revision;
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  async getPlansAndModels(): Promise<{ models: ModelSlim[]; plans: PlanSlim[] }> {
    try {
      const data = (await reqHasura(gql.GET_PLANS_AND_MODELS)) as {
        models: ModelSlim[];
        plans: Pick<Plan, 'duration' | 'id' | 'model_id' | 'name' | 'revision' | 'start_time'>[];
      };
      const { models, plans } = data;

      return {
        models,
        plans: plans.map(plan => {
          return {
            ...plan,
            end_time_doy: getDoyTimeFromInterval(plan.start_time, plan.duration),
            start_time_doy: getDoyTime(new Date(plan.start_time)),
          };
        }),
      };
    } catch (e) {
      catchError(e as Error);
      return { models: [], plans: [] };
    }
  },

  async getPlansAndModelsForScheduling(): Promise<{
    models: ModelSlim[];
    plans: PlanSchedulingSpec[];
  }> {
    try {
      const data = (await reqHasura(gql.GET_PLANS_AND_MODELS_FOR_SCHEDULING)) as {
        models: ModelSlim[];
        plans: PlanSchedulingSpec[];
      };

      const { models, plans } = data;
      return { models, plans };
    } catch (e) {
      catchError(e as Error);
      return { models: [], plans: [] };
    }
  },

  async getResourceTypes(model_id: number): Promise<ResourceType[]> {
    try {
      const data = await reqHasura<ResourceType[]>(gql.GET_RESOURCE_TYPES, { model_id });
      const { resource_types } = data;
      return resource_types;
    } catch (e) {
      catchError(e as Error);
      return [];
    }
  },

  async getResources(datasetId: number, startTimeYmd: string): Promise<Resource[]> {
    try {
      const data = await reqHasura<Profile[]>(gql.GET_PROFILES, { datasetId });
      const { profile: profiles } = data;
      return sampleProfiles(profiles, startTimeYmd);
    } catch (e) {
      catchError(e as Error);
      return [];
    }
  },

  async getResourcesExternal(planId: number, startTimeYmd: string): Promise<Resource[]> {
    try {
      const data = await reqHasura<PlanDataset[]>(gql.GET_PROFILES_EXTERNAL, { planId });
      const { plan_dataset: plan_datasets } = data;
      let resources: Resource[] = [];

      for (const dataset of plan_datasets) {
        const {
          dataset: { profiles },
          offset_from_plan_start,
        } = dataset;
        const sampledResources: Resource[] = sampleProfiles(profiles, startTimeYmd, offset_from_plan_start);
        resources = [...resources, ...sampledResources];
      }

      return resources;
    } catch (e) {
      catchError(e as Error);
      return [];
    }
  },

  async getSchedulingCondition(id: number | null | undefined): Promise<SchedulingCondition | null> {
    if (id !== null && id !== undefined) {
      try {
        const data = await reqHasura<SchedulingCondition>(gql.GET_SCHEDULING_CONDITION, { id });
        const { condition } = data;
        return condition;
      } catch (e) {
        catchError(e as Error);
        return null;
      }
    } else {
      return null;
    }
  },

  async getSchedulingGoal(id: number | null | undefined): Promise<SchedulingGoal | null> {
    if (id !== null && id !== undefined) {
      try {
        const data = await reqHasura<SchedulingGoal>(gql.GET_SCHEDULING_GOAL, { id });
        const { goal } = data;
        return goal;
      } catch (e) {
        catchError(e as Error);
        return null;
      }
    } else {
      return null;
    }
  },

  async getSchedulingSpecConditionsForCondition(
    condition_id: number | null,
  ): Promise<SchedulingSpecCondition[] | null> {
    if (condition_id !== null) {
      try {
        const data = await reqHasura<SchedulingSpecCondition[]>(gql.GET_SCHEDULING_SPEC_CONDITIONS_FOR_CONDITION, {
          condition_id,
        });
        const { scheduling_specification_conditions } = data;
        return scheduling_specification_conditions;
      } catch (e) {
        catchError(e as Error);
        return null;
      }
    } else {
      return null;
    }
  },

  async getSchedulingSpecGoalsForGoal(goal_id: number | null): Promise<SchedulingSpecGoal[] | null> {
    if (goal_id !== null) {
      try {
        const data = await reqHasura<SchedulingSpecGoal[]>(gql.GET_SCHEDULING_SPEC_GOALS_FOR_GOAL, { goal_id });
        const { scheduling_specification_goals } = data;
        return scheduling_specification_goals;
      } catch (e) {
        catchError(e as Error);
        return null;
      }
    } else {
      return null;
    }
  },

  async getSpans(datasetId: number): Promise<Span[]> {
    try {
      const data = await reqHasura<Span[]>(gql.GET_SPANS, { datasetId });
      const { span: spans } = data;
      return spans;
    } catch (e) {
      catchError(e as Error);
      return [];
    }
  },

  async getTsFilesActivityType(
    activityTypeName: string | null | undefined,
    modelId: number | null | undefined,
  ): Promise<TypeScriptFile[]> {
    if (activityTypeName !== null && activityTypeName !== undefined && modelId !== null && modelId !== undefined) {
      try {
        const data = await reqHasura<DslTypeScriptResponse>(gql.GET_TYPESCRIPT_ACTIVITY_TYPE, {
          activityTypeName,
          modelId,
        });
        const { dslTypeScriptResponse } = data;
        const { reason, status, typescriptFiles } = dslTypeScriptResponse;

        if (status === 'success') {
          return typescriptFiles;
        } else {
          catchError(reason);
          return [];
        }
      } catch (e) {
        catchError(e as Error);
        return [];
      }
    } else {
      return [];
    }
  },

  async getTsFilesCommandDictionary(commandDictionaryId: number | null | undefined): Promise<TypeScriptFile[]> {
    if (commandDictionaryId !== null && commandDictionaryId !== undefined) {
      try {
        const data = await reqHasura<DslTypeScriptResponse>(gql.GET_TYPESCRIPT_COMMAND_DICTIONARY, {
          commandDictionaryId,
        });
        const { dslTypeScriptResponse } = data;
        const { reason, status, typescriptFiles } = dslTypeScriptResponse;

        if (status === 'success') {
          return typescriptFiles;
        } else {
          catchError(reason);
          return [];
        }
      } catch (e) {
        catchError(e as Error);
        return [];
      }
    } else {
      return [];
    }
  },

  async getTsFilesConstraints(model_id: number, plan_id: number | null): Promise<TypeScriptFile[]> {
    if (model_id !== null && model_id !== undefined) {
      try {
        const data = await reqHasura<DslTypeScriptResponse>(gql.GET_TYPESCRIPT_CONSTRAINTS, { model_id, plan_id });
        const { dslTypeScriptResponse } = data;
        const { reason, status, typescriptFiles } = dslTypeScriptResponse;

        if (status === 'success') {
          return typescriptFiles;
        } else {
          catchError(reason);
          return [];
        }
      } catch (e) {
        catchError(e as Error);
        return [];
      }
    } else {
      return [];
    }
  },

  async getTsFilesScheduling(model_id: number | null | undefined): Promise<TypeScriptFile[]> {
    if (model_id !== null && model_id !== undefined) {
      try {
        const data = await reqHasura<DslTypeScriptResponse>(gql.GET_TYPESCRIPT_SCHEDULING, { model_id });
        const { dslTypeScriptResponse } = data;
        const { reason, status, typescriptFiles } = dslTypeScriptResponse;

        if (status === 'success') {
          return typescriptFiles;
        } else {
          catchError(reason);
          return [];
        }
      } catch (e) {
        catchError(e as Error);
        return [];
      }
    } else {
      return [];
    }
  },

  async getUserQueries(userToken?: string): Promise<Record<string, true> | null> {
    try {
      const data = await reqHasura<PermissibleQueryResponse>(gql.GET_PERMISSIBLE_QUERIES, {}, undefined, userToken);
      const {
        queries: {
          mutationType: { fields: mutationQueries },
          queryType: { fields: viewQueries },
        },
      } = data;

      return [...viewQueries, ...mutationQueries].reduce((queriesMap, permissibleQuery) => {
        return {
          ...queriesMap,
          [permissibleQuery.name]: true,
        };
      }, {});
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  async getUserSequence(id: number): Promise<UserSequence | null> {
    try {
      const data = await reqHasura<UserSequence>(gql.GET_USER_SEQUENCE, { id });
      const { userSequence } = data;
      return userSequence;
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  async getUserSequenceFromSeqJson(seqJson: SeqJson): Promise<string> {
    try {
      const data = await reqHasura<string>(gql.GET_USER_SEQUENCE_FROM_SEQ_JSON, { seqJson });
      const { sequence } = data;
      return sequence;
    } catch (e) {
      return (e as Error).message;
    }
  },

  async getUserSequenceSeqJson(
    commandDictionaryId: number | null,
    sequenceDefinition: string | null,
    signal: AbortSignal | undefined = undefined,
  ): Promise<string> {
    try {
      const data = await reqHasura<GetSeqJsonResponse>(
        gql.GET_USER_SEQUENCE_SEQ_JSON,
        { commandDictionaryId, sequenceDefinition },
        signal,
      );
      const { getUserSequenceSeqJson } = data;
      const { errors, seqJson, status } = getUserSequenceSeqJson;

      if (status === 'FAILURE') {
        const [firstError] = errors;
        const { message } = firstError;
        return message;
      } else {
        return JSON.stringify(seqJson, null, 2);
      }
    } catch (e) {
      return (e as Error).message;
    }
  },

  async getView(
    query: URLSearchParams | null,
    activityTypes: ActivityType[] = [],
    resourceTypes: ResourceType[] = [],
  ): Promise<View | null> {
    try {
      if (query !== null) {
        const viewId = query.has('viewId') ? query.get('viewId') : null;
        const viewIdAsNumber = parseFloatOrNull(viewId);

        if (viewIdAsNumber !== null) {
          const data = await reqHasura<View>(gql.GET_VIEW, { id: viewIdAsNumber });
          const { view } = data;

          if (view !== null) {
            return view;
          }
        }
      }

      return generateDefaultView(activityTypes, resourceTypes);
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  async initialSimulationUpdate(
    plan_id: number,
    simulation_template_id: number | null = null,
    simulation_start_time: string | null = null,
    simulation_end_time: string | null = null,
  ): Promise<boolean> {
    try {
      if (!effects.initialSimulationUpdatePermission()) {
        throwPermissionError('update a simulation');
      }

      const simulationInput: SimulationInitialUpdateInput = {
        arguments: {} as ArgumentsMap,
        simulation_end_time,
        simulation_start_time,
        simulation_template_id,
      };
      await reqHasura(gql.INITIAL_SIMULATION_UPDATE, { plan_id: plan_id, simulation: simulationInput });
      return true;
    } catch (e) {
      catchError(e as Error);
      return false;
    }
  },

  /**
   * @description For `initialSimulationUpdate` permission
   * @returns boolean
   */
  initialSimulationUpdatePermission(): boolean {
    return getPermission(['update_simulation']);
  },

  async insertExpansionSequenceToActivity(
    simulation_dataset_id: number,
    simulated_activity_id: number,
    seq_id: string,
  ): Promise<string | null> {
    try {
      if (!effects.insertExpansionSequenceToActivityPermission()) {
        throwPermissionError('add an expansion sequence to an activity');
      }

      const input: ExpansionSequenceToActivityInsertInput = { seq_id, simulated_activity_id, simulation_dataset_id };
      const data = await reqHasura<{ seq_id: string }>(gql.INSERT_EXPANSION_SEQUENCE_TO_ACTIVITY, { input });
      const { sequence } = data;

      if (sequence) {
        showSuccessToast('Expansion Sequence Added To Activity Successfully');
        const { seq_id } = sequence;
        return seq_id;
      } else {
        return null;
      }
    } catch (e) {
      catchError('Add Expansion Sequence To Activity Failed', e as Error);
      showFailureToast('Add Expansion Sequence To Activity Failed');
      return null;
    }
  },

  /**
   * @description For `insertExpansionSequenceToActivity` permission
   * @returns boolean
   */
  insertExpansionSequenceToActivityPermission(): boolean {
    return getPermission(['insert_sequence_to_simulated_activity_one']);
  },

  async loadViewFromFile(files: FileList): Promise<{ definition: ViewDefinition | null; errors?: string[] }> {
    try {
      const file: File = files[0];

      const viewFileString: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          resolve(reader.result as string);
        };

        reader.onerror = reject;

        reader.readAsText(file);
      });

      const viewJSON = JSON.parse(viewFileString);
      const { errors, valid } = await effects.validateViewJSON(viewJSON);

      if (valid) {
        return { definition: viewJSON };
      } else {
        return {
          definition: null,
          errors,
        };
      }
    } catch (e) {
      catchError(e as Error);
    }

    return {
      definition: null,
      errors: [],
    };
  },

  async login(username: string, password: string): Promise<ReqLoginResponse> {
    try {
      const data = await reqGateway<ReqLoginResponse>(
        '/auth/login',
        'POST',
        JSON.stringify({ password, username }),
        null,
        false,
      );
      return data;
    } catch (e) {
      catchError(e as Error);
      return {
        message: 'An unexpected error occurred',
        success: false,
        token: null,
      };
    }
  },

  async logout(token: JsonWebToken): Promise<ReqLogoutResponse> {
    try {
      const data = await reqGateway<ReqLogoutResponse>('/auth/logout', 'DELETE', null, token, false);
      return data;
    } catch (e) {
      catchError(e as Error);
      return { message: 'An unexpected error occurred', success: false };
    }
  },

  async planMergeBegin(merge_request_id: number): Promise<boolean> {
    try {
      if (!effects.planMergeBeginPermission()) {
        throwPermissionError('begin a merge');
      }

      await reqHasura(gql.PLAN_MERGE_BEGIN, { merge_request_id });
      return true;
    } catch (error) {
      showFailureToast('Begin Merge Failed');
      catchError('Begin Merge Failed', error as Error);
      return false;
    }
  },

  /**
   * @description For `planMergeBegin` permission
   * @returns boolean
   */
  planMergeBeginPermission(): boolean {
    return getPermission(['begin_merge']);
  },

  async planMergeCancel(merge_request_id: number): Promise<boolean> {
    try {
      if (!effects.planMergeCancelPermission()) {
        throwPermissionError('cancel this merge request');
      }

      await reqHasura(gql.PLAN_MERGE_CANCEL, { merge_request_id });
      showSuccessToast('Canceled Merge Request');
      return true;
    } catch (error) {
      catchError('Cancel Merge Request Failed', error as Error);
      showFailureToast('Cancel Merge Request Failed');
      return false;
    }
  },

  /**
   * @description For `planMergeCancel` permission
   * @returns boolean
   */
  planMergeCancelPermission(): boolean {
    return getPermission(['cancel_merge']);
  },

  async planMergeCommit(merge_request_id: number): Promise<boolean> {
    try {
      if (!effects.planMergeCommitPermission()) {
        throwPermissionError('approve this merge request');
      }

      await reqHasura(gql.PLAN_MERGE_COMMIT, { merge_request_id });
      showSuccessToast('Approved Merge Request Changes');
      return true;
    } catch (error) {
      catchError('Approve Merge Request Changes Failed', error as Error);
      showFailureToast('Approve Merge Request Changes Failed');
      return false;
    }
  },

  /**
   * @description For `planMergeCommit` permission
   * @returns boolean
   */
  planMergeCommitPermission(): boolean {
    return getPermission(['commit_merge']);
  },

  async planMergeDeny(merge_request_id: number): Promise<boolean> {
    try {
      if (!effects.planMergeDenyPermission()) {
        throwPermissionError('deny this merge request');
      }

      await reqHasura(gql.PLAN_MERGE_DENY, { merge_request_id });
      showSuccessToast('Denied Merge Request Changes');
      return true;
    } catch (error) {
      catchError('Deny Merge Request Changes Failed', error as Error);
      showFailureToast('Deny Merge Request Changes Failed');
      return false;
    }
  },

  /**
   * @description For `planMergeDeny` permission
   * @returns boolean
   */
  planMergeDenyPermission(): boolean {
    return getPermission(['deny_merge']);
  },

  async planMergeRequestWithdraw(merge_request_id: number): Promise<boolean> {
    try {
      if (!effects.planMergeRequestWithdrawPermission()) {
        throwPermissionError('withdraw this merge request');
      }

      await reqHasura(gql.PLAN_MERGE_REQUEST_WITHDRAW, { merge_request_id });
      showSuccessToast('Withdrew Merge Request');
      return true;
    } catch (error) {
      showFailureToast('Withdraw Merge Request Failed');
      catchError('Withdraw Merge Request Failed', error as Error);
      return false;
    }
  },

  /**
   * @description For `planMergeRequestWithdraw` permission
   * @returns boolean
   */
  planMergeRequestWithdrawPermission(): boolean {
    return getPermission(['withdraw_merge_request']);
  },

  async planMergeResolveAllConflicts(merge_request_id: number, resolution: PlanMergeResolution): Promise<void> {
    try {
      if (!effects.planMergeResolveAllConflictsPermission()) {
        throwPermissionError('resolve merge request conflicts');
      }

      await reqHasura(gql.PLAN_MERGE_RESOLVE_ALL_CONFLICTS, { merge_request_id, resolution });
    } catch (e) {
      showFailureToast('Resolve All Merge Request Conflicts Failed');
      catchError('Resolve All Merge Request Conflicts Failed', e as Error);
    }
  },

  /**
   * @description For `planMergeResolveAllConflicts` permission
   * @returns boolean
   */
  planMergeResolveAllConflictsPermission(): boolean {
    return getPermission(['set_resolution_bulk']);
  },

  async planMergeResolveConflict(
    merge_request_id: number,
    activity_id: ActivityDirectiveId,
    resolution: PlanMergeResolution,
  ): Promise<void> {
    try {
      if (!effects.planMergeResolveConflictPermission()) {
        throwPermissionError('resolve merge request conflicts');
      }

      await reqHasura(gql.PLAN_MERGE_RESOLVE_CONFLICT, { activity_id, merge_request_id, resolution });
    } catch (e) {
      showFailureToast('Resolve Merge Request Conflict Failed');
      catchError('Resolve Merge Request Conflict Failed', e as Error);
    }
  },

  /**
   * @description For `planMergeResolveConflict` permission
   * @returns boolean
   */
  planMergeResolveConflictPermission(): boolean {
    return getPermission(['set_resolution']);
  },

  async removePresetFromActivityDirective(
    plan_id: number,
    activity_directive_id: ActivityDirectiveId,
    preset_id: ActivityPresetId,
  ): Promise<boolean> {
    try {
      if (!effects.removePresetFromActivityDirectivePermission()) {
        throwPermissionError('remove the preset from this activity directive');
      }

      await reqHasura(gql.DELETE_PRESET_TO_DIRECTIVE, { activity_directive_id, plan_id, preset_id });
      showSuccessToast('Removed Activity Preset Successfully');
      return true;
    } catch (e) {
      catchError('Activity Preset Removal Failed', e as Error);
      showFailureToast('Activity Preset Removal Failed');
      return false;
    }
  },

  /**
   * @description For `removePresetFromActivityDirective` permission
   * @returns boolean
   */
  removePresetFromActivityDirectivePermission(): boolean {
    return getPermission(['delete_preset_to_directive_by_pk']);
  },

  async schedule(analysis_only: boolean = false): Promise<void> {
    try {
      if (!effects.schedulePermission()) {
        throwPermissionError(`run ${analysis_only ? 'scheduling analysis' : 'scheduling'}`);
      }

      const currentPlan = get(plan);
      const specificationId = get(selectedSpecId);
      if (currentPlan !== null && specificationId !== null) {
        const plan_revision = await effects.getPlanRevision(currentPlan.id);
        if (plan_revision !== null) {
          await effects.updateSchedulingSpec(specificationId, { analysis_only, plan_revision });
        } else {
          throw Error(`Plan revision for plan ${currentPlan.id} was not found.`);
        }

        let incomplete = true;
        schedulingStatus.set(Status.Incomplete);
        do {
          const data = await reqHasura<SchedulingResponse>(gql.SCHEDULE, { specificationId });
          const { schedule } = data;
          const { reason, status } = schedule;

          if (status === 'complete') {
            schedulingStatus.set(Status.Complete);
            incomplete = false;
            showSuccessToast(`Scheduling ${analysis_only ? 'Analysis ' : ''}Complete`);
          } else if (status === 'failed') {
            schedulingStatus.set(Status.Failed);
            catchSchedulingError(reason);
            incomplete = false;

            showFailureToast(`Scheduling ${analysis_only ? 'Analysis ' : ''}Failed`);
            catchError(`Scheduling ${analysis_only ? 'Analysis ' : ''}Failed`);
          } else if (status === 'incomplete') {
            schedulingStatus.set(Status.Incomplete);
          }

          await sleep(500); // Sleep half-second before re-scheduling.
        } while (incomplete);
      } else {
        throw Error('Plan is not defined.');
      }
    } catch (e) {
      catchError(e as Error);
      schedulingStatus.set(Status.Failed);
    }
  },

  /**
   * @description For `schedule` permission
   * @returns boolean
   */
  schedulePermission(): boolean {
    return effects.updateSchedulingSpecPermission();
  },

  async session(token: JsonWebToken): Promise<ReqSessionResponse> {
    try {
      const data = await reqGateway<ReqSessionResponse>('/auth/session', 'GET', null, token, false);
      return data;
    } catch (e) {
      catchError(e as Error);
      return { message: 'An unexpected error occurred', success: false };
    }
  },

  async simulate(): Promise<void> {
    try {
      if (!effects.simulatePermission()) {
        throwPermissionError('simulate this plan');
      }

      const currentPlan = get(plan);
      if (currentPlan !== null) {
        const data = await reqHasura<SimulateResponse>(gql.SIMULATE, { planId: currentPlan.id });
        const { simulate } = data;
        const { simulationDatasetId: newSimulationDatasetId } = simulate;
        simulationDatasetId.set(newSimulationDatasetId);
        simulationDatasetIds.updateValue((ids: number[]) => {
          if (!ids.includes(newSimulationDatasetId)) {
            return [newSimulationDatasetId, ...ids];
          }
          return ids;
        });
      } else {
        throw Error('Plan is not defined.');
      }
    } catch (e) {
      catchError(e as Error);
    }
  },

  /**
   * @description For `simulate` permission
   * @returns boolean
   */
  simulatePermission(): boolean {
    return getPermission(['simulate']);
  },

  async updateActivityDirective(
    plan_id: number,
    id: ActivityDirectiveId,
    partialActivityDirective: Partial<ActivityDirective>,
  ): Promise<void> {
    try {
      if (!effects.updateActivityDirectivePermission()) {
        throwPermissionError('update this activity directive');
      }

      const activityDirectiveSetInput: ActivityDirectiveSetInput = {};

      if (partialActivityDirective.arguments) {
        activityDirectiveSetInput.arguments = partialActivityDirective.arguments;
      }

      if (partialActivityDirective.anchor_id !== undefined) {
        activityDirectiveSetInput.anchor_id = partialActivityDirective.anchor_id;
      }

      if (partialActivityDirective.anchored_to_start !== undefined) {
        activityDirectiveSetInput.anchored_to_start = partialActivityDirective.anchored_to_start;
      }

      if (partialActivityDirective.start_offset) {
        activityDirectiveSetInput.start_offset = partialActivityDirective.start_offset;
      }

      if (partialActivityDirective.tags) {
        activityDirectiveSetInput.tags = formatHasuraStringArray(partialActivityDirective.tags);
      }

      if (partialActivityDirective.name) {
        activityDirectiveSetInput.name = partialActivityDirective.name;
      }

      if (partialActivityDirective.metadata) {
        activityDirectiveSetInput.metadata = partialActivityDirective.metadata;
      }

      const data = await reqHasura<ActivityDirective>(gql.UPDATE_ACTIVITY_DIRECTIVE, {
        activityDirectiveSetInput,
        id,
        plan_id,
      });
      const { update_activity_directive_by_pk: updatedDirective } = data;
      activityDirectivesMap.update((currentActivityDirectivesMap: ActivityDirectivesMap) => ({
        ...currentActivityDirectivesMap,
        [id]: updatedDirective,
      }));
      showSuccessToast('Activity Directive Updated Successfully');
    } catch (e) {
      catchError('Activity Directive Update Failed', e as Error);
      showFailureToast('Activity Directive Update Failed');
    }
  },

  /**
   * @description For `updateActivityDirective` permission
   * @returns boolean
   */
  updateActivityDirectivePermission(): boolean {
    return getPermission(['update_activity_directive_by_pk']);
  },

  async updateActivityPreset(id: ActivityPresetId, partialActivityPreset: ActivityPresetSetInput): Promise<void> {
    try {
      if (!effects.updateActivityPresetPermission()) {
        throwPermissionError('update this activity preset');
      }

      const activityPresetSetInput: ActivityPresetSetInput = {};

      if (partialActivityPreset.arguments) {
        activityPresetSetInput.arguments = partialActivityPreset.arguments;
      }
      if (partialActivityPreset.associated_activity_type) {
        activityPresetSetInput.associated_activity_type = partialActivityPreset.associated_activity_type;
      }
      if (partialActivityPreset.model_id) {
        activityPresetSetInput.model_id = partialActivityPreset.model_id;
      }
      if (partialActivityPreset.name) {
        activityPresetSetInput.name = partialActivityPreset.name;
      }

      const {
        update_activity_presets_by_pk: { name: presetName },
      } = await reqHasura<ActivityPreset>(gql.UPDATE_ACTIVITY_PRESET, {
        activityPresetSetInput,
        id,
      });

      showSuccessToast(`Activity Preset ${presetName} Updated Successfully`);
    } catch (e) {
      catchError('Activity Preset Update Failed', e as Error);
      showFailureToast('Activity Preset Update Failed');
    }
  },

  /**
   * @description For `updateActivityPreset` permission
   * @returns boolean
   */
  updateActivityPresetPermission(): boolean {
    return getPermission(['update_activity_presets_by_pk']);
  },

  async updateConstraint(
    id: number,
    definition: string,
    description: string,
    model_id: number,
    name: string,
    plan_id: number,
  ): Promise<void> {
    try {
      if (!effects.updateConstraintPermission()) {
        throwPermissionError('update this constraint');
      }

      const constraint: Partial<Constraint> = {
        definition,
        description,
        model_id: plan_id !== null ? null : model_id,
        name,
        plan_id,
      };
      await reqHasura(gql.UPDATE_CONSTRAINT, { constraint, id });
      showSuccessToast('Constraint Updated Successfully');
    } catch (e) {
      catchError('Constraint Update Failed', e as Error);
      showFailureToast('Constraint Update Failed');
    }
  },

  /**
   * @description For `updateConstraint` permission
   * @returns boolean
   */
  updateConstraintPermission(): boolean {
    return getPermission(['update_constraint_by_pk']);
  },

  async updateExpansionRule(id: number, rule: Partial<ExpansionRule>): Promise<string | null> {
    try {
      savingExpansionRule.set(true);

      if (!effects.updateExpansionRulePermission()) {
        throwPermissionError('update this expansion rule');
      }

      const data = await reqHasura(gql.UPDATE_EXPANSION_RULE, { id, rule });
      const { updateExpansionRule } = data;
      const { updated_at } = updateExpansionRule;
      showSuccessToast('Expansion Rule Updated Successfully');
      savingExpansionRule.set(false);
      return updated_at;
    } catch (e) {
      catchError('Expansion Rule Update Failed', e as Error);
      showFailureToast('Expansion Rule Update Failed');
      savingExpansionRule.set(false);
      return null;
    }
  },

  /**
   * @description For `updateExpansionRule` permission
   * @returns boolean
   */
  updateExpansionRulePermission(): boolean {
    return getPermission(['update_expansion_rule_by_pk']);
  },

  async updateSchedulingCondition(
    id: number,
    condition: Partial<SchedulingCondition>,
  ): Promise<Pick<SchedulingCondition, 'id' | 'last_modified_by' | 'modified_date'> | null> {
    try {
      if (!effects.updateSchedulingConditionPermission()) {
        throwPermissionError('update this expansion rule');
      }

      const data = await reqHasura(gql.UPDATE_SCHEDULING_CONDITION, { condition, id });
      const { updateSchedulingCondition: updatedCondition } = data;

      showSuccessToast('Scheduling Condition Updated Successfully');
      return updatedCondition;
    } catch (e) {
      catchError('Scheduling Condition Update Failed', e as Error);
      showFailureToast('Scheduling Condition Update Failed');
      return null;
    }
  },

  /**
   * @description For `updateSchedulingCondition` permission
   * @returns boolean
   */
  updateSchedulingConditionPermission(): boolean {
    return getPermission(['update_scheduling_condition_by_pk']);
  },

  async updateSchedulingGoal(
    id: number,
    goal: Partial<SchedulingGoal>,
  ): Promise<Pick<SchedulingGoal, 'id' | 'last_modified_by' | 'modified_date'> | null> {
    try {
      if (!effects.updateSchedulingGoalPermission()) {
        throwPermissionError('update this scheduling goal');
      }

      const data = await reqHasura(gql.UPDATE_SCHEDULING_GOAL, { goal, id });
      const { updateSchedulingGoal: updatedGoal } = data;

      showSuccessToast('Scheduling Goal Updated Successfully');
      return updatedGoal;
    } catch (e) {
      catchError('Scheduling Goal Update Failed', e as Error);
      showFailureToast('Scheduling Goal Update Failed');
      return null;
    }
  },

  /**
   * @description For `updateSchedulingGoal` permission
   * @returns boolean
   */
  updateSchedulingGoalPermission(): boolean {
    return getPermission(['update_scheduling_goal_by_pk']);
  },

  async updateSchedulingSpec(id: number, spec: Partial<SchedulingSpec>): Promise<void> {
    try {
      if (!effects.updateSchedulingSpecPermission()) {
        throwPermissionError('update this scheduling spec');
      }

      await reqHasura(gql.UPDATE_SCHEDULING_SPEC, { id, spec });
    } catch (e) {
      catchError(e as Error);
    }
  },

  /**
   * @description For `updateSchedulingSpec` permission
   * @returns boolean
   */
  updateSchedulingSpecPermission(): boolean {
    return getPermission(['update_scheduling_specification_by_pk']);
  },

  async updateSchedulingSpecCondition(
    condition_id: number,
    specification_id: number,
    spec_condition: Partial<SchedulingSpecCondition>,
  ): Promise<void> {
    try {
      if (!effects.updateSchedulingSpecConditionPermission()) {
        throwPermissionError('update this scheduling spec condition');
      }

      await reqHasura(gql.UPDATE_SCHEDULING_SPEC_CONDITION, { condition_id, spec_condition, specification_id });
      showSuccessToast('Scheduling Spec Condition Updated Successfully');
    } catch (e) {
      catchError('Scheduling Spec Condition Update Failed', e as Error);
      showFailureToast('Scheduling Spec Condition Update Failed');
    }
  },

  /**
   * @description For `updateSchedulingSpecCondition` permission
   * @returns boolean
   */
  updateSchedulingSpecConditionPermission(): boolean {
    return getPermission(['update_scheduling_specification_conditions_by_pk']);
  },

  async updateSchedulingSpecConditionId(
    condition_id: number,
    specification_id: number,
    new_specification_id: number,
  ): Promise<void> {
    try {
      if (!effects.updateSchedulingSpecConditionIdPermission()) {
        throwPermissionError('update this scheduling spec condition');
      }

      await reqHasura(gql.UPDATE_SCHEDULING_SPEC_CONDITION_ID, {
        condition_id,
        new_specification_id,
        specification_id,
      });
      showSuccessToast('Scheduling Spec Condition Updated Successfully');
    } catch (e) {
      catchError('Scheduling Spec Condition Update Failed', e as Error);
      showFailureToast('Scheduling Spec Condition Update Failed');
    }
  },

  /**
   * @description For `updateSchedulingSpecConditionId` permission
   * @returns boolean
   */
  updateSchedulingSpecConditionIdPermission(): boolean {
    return effects.updateSchedulingSpecConditionPermission();
  },

  async updateSchedulingSpecGoal(
    goal_id: number,
    specification_id: number,
    spec_goal: Partial<SchedulingSpecGoal>,
  ): Promise<void> {
    try {
      if (!effects.updateSchedulingSpecGoalPermission()) {
        throwPermissionError('update this scheduling spec goal');
      }

      await reqHasura(gql.UPDATE_SCHEDULING_SPEC_GOAL, { goal_id, spec_goal, specification_id });
      showSuccessToast('Scheduling Spec Goal Updated Successfully');
    } catch (e) {
      catchError('Scheduling Spec Goal Update Failed', e as Error);
      showFailureToast('Scheduling Spec Goal Update Failed');
    }
  },

  /**
   * @description For `updateSchedulingSpecGoal` permission
   * @returns boolean
   */
  updateSchedulingSpecGoalPermission(): boolean {
    return getPermission(['update_scheduling_specification_goals_by_pk']);
  },

  async updateSimulation(simulationSetInput: Simulation, newFiles: File[] = []): Promise<void> {
    try {
      if (!effects.updateSimulationPermission()) {
        throwPermissionError('update this simulation');
      }

      await reqHasura<Pick<Simulation, 'id'>>(gql.UPDATE_SIMULATION, {
        id: simulationSetInput.id,
        simulation: {
          arguments: simulationSetInput.arguments,
          simulation_end_time: simulationSetInput?.simulation_end_time ?? null,
          simulation_start_time: simulationSetInput?.simulation_start_time ?? null,
          simulation_template_id: simulationSetInput?.template?.id ?? null,
        },
      });
      await effects.uploadFiles(newFiles);
      showSuccessToast('Simulation Updated Successfully');
    } catch (e) {
      catchError('Simulation Update Failed', e as Error);
      showFailureToast('Simulation Update Failed');
    }
  },

  /**
   * @description For `updateSimulation` permission
   * @returns boolean
   */
  updateSimulationPermission(): boolean {
    return getPermission(['update_simulation_by_pk']);
  },

  async updateSimulationTemplate(id: number, partialSimulationTemplate: SimulationTemplateSetInput): Promise<void> {
    try {
      if (!effects.updateSimulationTemplatePermission()) {
        throwPermissionError('update this simulation template');
      }

      const simulationTemplateSetInput: SimulationTemplateSetInput = {};

      if (partialSimulationTemplate.arguments) {
        simulationTemplateSetInput.arguments = partialSimulationTemplate.arguments;
      }
      if (partialSimulationTemplate.description) {
        simulationTemplateSetInput.description = partialSimulationTemplate.description;
      }
      if (partialSimulationTemplate.model_id) {
        simulationTemplateSetInput.model_id = partialSimulationTemplate.model_id;
      }

      const {
        update_simulation_template_by_pk: { description: templateDescription },
      } = await reqHasura<SimulationTemplate>(gql.UPDATE_SIMULATION_TEMPLATE, {
        id,
        simulationTemplateSetInput,
      });

      showSuccessToast(`Simulation Template ${templateDescription} Updated Successfully`);
    } catch (e) {
      catchError('Simulation Template Update Failed', e as Error);
      showFailureToast('Simulation Template Update Failed');
    }
  },

  /**
   * @description For `updateSimulationTemplate` permission
   * @returns boolean
   */
  updateSimulationTemplatePermission(): boolean {
    return getPermission(['update_simulation_template_by_pk']);
  },

  async updateUserSequence(id: number, sequence: Partial<UserSequence>): Promise<string | null> {
    try {
      if (!effects.updateUserSequencePermission()) {
        throwPermissionError('update this user sequence');
      }

      const data = await reqHasura<Pick<UserSequence, 'id' | 'updated_at'>>(gql.UPDATE_USER_SEQUENCE, { id, sequence });
      const { updateUserSequence } = data;
      const { updated_at } = updateUserSequence;
      showSuccessToast('User Sequence Updated Successfully');
      return updated_at;
    } catch (e) {
      catchError('User Sequence Update Failed', e as Error);
      showFailureToast('User Sequence Update Failed');
      return null;
    }
  },

  /**
   * @description For `updateUserSequence` permission
   * @returns boolean
   */
  updateUserSequencePermission(): boolean {
    return getPermission(['update_user_sequence_by_pk']);
  },

  async updateView(id: number, view: Partial<View>): Promise<boolean> {
    try {
      if (!effects.updateViewPermission()) {
        throwPermissionError('update this view');
      }

      await reqHasura<Pick<View, 'id'>>(gql.UPDATE_VIEW, { id, view });
      showSuccessToast('View Updated Successfully');
      return true;
    } catch (e) {
      catchError('View Update Failed', e as Error);
      showFailureToast('View Update Failed');
      return false;
    }
  },

  /**
   * @description For `updateView` permission
   * @returns boolean
   */
  updateViewPermission(): boolean {
    return getPermission(['update_view_by_pk']);
  },

  async uploadFile(file: File): Promise<number | null> {
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      const data = await reqGateway<{ id: number }>('/file', 'POST', body, null, true);
      const { id } = data;
      return id;
    } catch (e) {
      catchError(e as Error);
      return null;
    }
  },

  async uploadFiles(files: File[]): Promise<boolean> {
    try {
      for (const file of files) {
        await effects.uploadFile(file);
      }
      return true;
    } catch (e) {
      catchError(e as Error);
      return false;
    }
  },

  async uploadView(owner: string): Promise<boolean> {
    try {
      if (!effects.uploadViewPermission()) {
        throwPermissionError('upload a new view');
      }

      const { confirm, value = null } = await showUploadViewModal();
      if (confirm && value) {
        const { name, definition } = value;

        const viewInsertInput: ViewInsertInput = { definition, name, owner };
        const data = await reqHasura<View>(gql.CREATE_VIEW, { view: viewInsertInput });
        const { newView } = data;

        view.update(() => newView);
        setQueryParam('viewId', `${newView.id}`);
        return true;
      }
    } catch (e) {
      catchError('View Upload Failed', e as Error);
      showFailureToast('View Upload Failed');
    }

    return false;
  },

  /**
   * @description For `uploadView` permission
   * @returns boolean
   */
  uploadViewPermission(): boolean {
    return effects.createViewPermission();
  },

  async validateActivityArguments(
    activityTypeName: string,
    modelId: number,
    argumentsMap: ArgumentsMap,
  ): Promise<ParameterValidationResponse> {
    try {
      const data = await reqHasura<ParameterValidationResponse>(gql.VALIDATE_ACTIVITY_ARGUMENTS, {
        activityTypeName,
        arguments: argumentsMap,
        modelId,
      });

      const { validateActivityArguments } = data;
      return validateActivityArguments;
    } catch (e) {
      catchError(e as Error);
      const { message } = e as Error;
      return { errors: [{ message } as ParameterValidationError], success: false };
    }
  },

  async validateViewJSON(unValidatedView: unknown): Promise<{ errors?: string[]; valid: boolean }> {
    try {
      const { errors, valid } = validateViewJSONAgainstSchema(unValidatedView);
      return {
        errors: errors?.map(({ message }) => message) ?? [],
        valid,
      };
    } catch (e) {
      catchError(e as Error);
      const { message } = e as Error;
      return { errors: [message], valid: false };
    }
  },
};

export default effects;
