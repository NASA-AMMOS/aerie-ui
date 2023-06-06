import { get } from 'svelte/store';
import { permissibleQueries as permissibleQueriesStore, user as userStore } from '../stores/app';
import { plan as planStore } from '../stores/plan';
import type { ActivityDirective, ActivityPreset } from '../types/activity';
import type { UserId } from '../types/app';
import type { ModelSlim } from '../types/model';
import type { PermissibleQueriesMap, PermissionCheck } from '../types/permissions';
import type { Plan, PlanSlim } from '../types/plan';

function getPermission(queries: string[]): boolean {
  const permissibleQueries = get(permissibleQueriesStore);
  if (permissibleQueries) {
    return queries.reduce((prevValue: boolean, queryName) => {
      return prevValue && !!permissibleQueries[queryName];
    }, true);
  }
  return false;
}

function isUserOwner(thingWithOwner?: { owner: UserId } | null): boolean {
  if (thingWithOwner !== null) {
    const user = get(userStore);

    if (thingWithOwner && user) {
      return thingWithOwner.owner === user.id;
    }
  }
  return false;
}

function isPlanOwner(plan?: Plan | PlanSlim): boolean {
  const currentPlan = plan ?? get(planStore);
  return isUserOwner(currentPlan);
}

function isPlanCollaborator(): boolean {
  const plan = get(planStore);
  const user = get(userStore);

  if (plan && user) {
    return !!plan.collaborators.find(({ collaborator }) => collaborator === user.id);
  }
  return false;
}

const queryPermissions = {
  APPLY_PRESET_TO_ACTIVITY: (): boolean => {
    return getPermission(['apply_preset_to_activity']);
  },
  CREATE_ACTIVITY_DIRECTIVE: (): boolean => {
    return getPermission(['insert_activity_directive_one']);
  },
  CREATE_ACTIVITY_PRESET: (): boolean => {
    return getPermission(['insert_activity_presets_one']);
  },
  CREATE_COMMAND_DICTIONARY: (): boolean => {
    return getPermission(['uploadDictionary']);
  },
  CREATE_CONSTRAINT: (): boolean => {
    return getPermission(['insert_constraint_one']);
  },
  CREATE_EXPANSION_RULE: (): boolean => {
    return getPermission(['insert_expansion_rule_one']);
  },
  CREATE_EXPANSION_SEQUENCE: (): boolean => {
    return getPermission(['insert_sequence_one']);
  },
  CREATE_EXPANSION_SET: (): boolean => {
    return getPermission(['createExpansionSet']);
  },
  CREATE_MODEL: (): boolean => {
    return getPermission(['insert_mission_model_one']);
  },
  CREATE_PLAN: (): boolean => {
    return getPermission(['insert_plan_one']);
  },
  CREATE_PLAN_MERGE_REQUEST: (): boolean => {
    return getPermission(['create_merge_request']);
  },
  CREATE_SCHEDULING_CONDITION: (): boolean => {
    return getPermission(['insert_scheduling_condition_one']);
  },
  CREATE_SCHEDULING_GOAL: (): boolean => {
    return getPermission(['insert_scheduling_goal_one']);
  },
  CREATE_SCHEDULING_SPEC: (): boolean => {
    return getPermission(['insert_scheduling_specification_one']);
  },
  CREATE_SCHEDULING_SPEC_CONDITION: (): boolean => {
    return getPermission(['insert_scheduling_specification_conditions_one']);
  },
  CREATE_SCHEDULING_SPEC_GOAL: (): boolean => {
    return getPermission(['insert_scheduling_specification_goals_one']);
  },
  CREATE_SIMULATION_TEMPLATE: (): boolean => {
    return getPermission(['insert_simulation_template_one']);
  },
  CREATE_USER_SEQUENCE: (): boolean => {
    return getPermission(['insert_user_sequence_one']);
  },
  CREATE_VIEW: (): boolean => {
    return getPermission(['insert_view_one']);
  },
  DELETE_ACTIVITY_DIRECTIVES: (): boolean => {
    return getPermission(['delete_activity_directive']);
  },
  DELETE_ACTIVITY_DIRECTIVES_REANCHOR_PLAN_START: (): boolean => {
    return getPermission(['delete_activity_by_pk_reanchor_plan_start_bulk']);
  },
  DELETE_ACTIVITY_DIRECTIVES_REANCHOR_TO_ANCHOR: (): boolean => {
    return getPermission(['delete_activity_by_pk_reanchor_to_anchor_bulk']);
  },
  DELETE_ACTIVITY_DIRECTIVES_SUBTREE: (): boolean => {
    return getPermission(['delete_activity_by_pk_delete_subtree_bulk']);
  },
  DELETE_ACTIVITY_PRESET: (): boolean => {
    return getPermission(['delete_activity_presets_by_pk']);
  },
  DELETE_COMMAND_DICTIONARY: (): boolean => {
    return getPermission(['delete_command_dictionary_by_pk']);
  },
  DELETE_CONSTRAINT: (): boolean => {
    return getPermission(['delete_constraint_by_pk']);
  },
  DELETE_EXPANSION_RULE: (): boolean => {
    return getPermission(['delete_expansion_rule_by_pk']);
  },
  DELETE_EXPANSION_SEQUENCE: (): boolean => {
    return getPermission(['delete_sequence_by_pk']);
  },
  DELETE_EXPANSION_SEQUENCE_TO_ACTIVITY: (): boolean => {
    return getPermission(['delete_sequence_to_simulated_activity_by_pk']);
  },
  DELETE_EXPANSION_SET: (): boolean => {
    return getPermission(['delete_expansion_set_by_pk']);
  },
  DELETE_MODEL: (): boolean => {
    return getPermission(['delete_mission_model_by_pk']);
  },
  DELETE_PLAN: (): boolean => {
    return getPermission(['delete_plan_by_pk', 'delete_scheduling_specification', 'delete_simulation']);
  },
  DELETE_PRESET_TO_DIRECTIVE: (): boolean => {
    return getPermission(['delete_preset_to_directive_by_pk']);
  },
  DELETE_SCHEDULING_CONDITION: (): boolean => {
    return getPermission(['delete_scheduling_condition_by_pk']);
  },
  DELETE_SCHEDULING_GOAL: (): boolean => {
    return getPermission(['delete_scheduling_goal_by_pk']);
  },
  DELETE_SCHEDULING_SPEC_GOAL: (): boolean => {
    return getPermission(['delete_scheduling_specification_goals_by_pk']);
  },
  DELETE_SIMULATION_TEMPLATE: (): boolean => {
    return getPermission(['delete_simulation_template_by_pk']);
  },
  DELETE_USER_SEQUENCE: (): boolean => {
    return getPermission(['delete_user_sequence_by_pk']);
  },
  DELETE_VIEW: (): boolean => {
    return getPermission(['delete_view_by_pk']);
  },
  DELETE_VIEWS: (): boolean => {
    return getPermission(['delete_view']);
  },
  DUPLICATE_PLAN: (): boolean => {
    return getPermission(['duplicate_plan']);
  },
  EXPAND: (): boolean => {
    return getPermission(['expandAllActivities']);
  },
  GET_PLAN: (): boolean => {
    return getPermission(['plan_by_pk']);
  },
  GET_PLANS_AND_MODELS: (): boolean => {
    return getPermission(['mission_model']);
  },
  INITIAL_SIMULATION_UPDATE: (): boolean => {
    return getPermission(['update_simulation']);
  },
  INSERT_EXPANSION_SEQUENCE_TO_ACTIVITY: (): boolean => {
    return getPermission(['insert_sequence_to_simulated_activity_one']);
  },
  PLAN_MERGE_BEGIN: (): boolean => {
    return getPermission(['begin_merge']);
  },
  PLAN_MERGE_CANCEL: (): boolean => {
    return getPermission(['cancel_merge']);
  },
  PLAN_MERGE_COMMIT: (): boolean => {
    return getPermission(['commit_merge']);
  },
  PLAN_MERGE_DENY: (): boolean => {
    return getPermission(['deny_merge']);
  },
  PLAN_MERGE_REQUEST_WITHDRAW: (): boolean => {
    return getPermission(['withdraw_merge_request']);
  },
  PLAN_MERGE_RESOLVE_ALL_CONFLICTS: (): boolean => {
    return getPermission(['set_resolution_bulk']);
  },
  PLAN_MERGE_RESOLVE_CONFLICT: (): boolean => {
    return getPermission(['set_resolution']);
  },
  SIMULATE: (): boolean => {
    return getPermission(['simulate']);
  },
  SUB_ACTIVITY_PRESETS: (): boolean => {
    return getPermission(['activity_presets']);
  },
  UPDATE_ACTIVITY_DIRECTIVE: (): boolean => {
    return getPermission(['update_activity_directive_by_pk']);
  },
  UPDATE_ACTIVITY_PRESET: (): boolean => {
    return getPermission(['update_activity_presets_by_pk']);
  },
  UPDATE_CONSTRAINT: (): boolean => {
    return getPermission(['update_constraint_by_pk']);
  },
  UPDATE_EXPANSION_RULE: (): boolean => {
    return getPermission(['update_expansion_rule_by_pk']);
  },
  UPDATE_SCHEDULING_CONDITION: (): boolean => {
    return getPermission(['update_scheduling_condition_by_pk']);
  },
  UPDATE_SCHEDULING_GOAL: (): boolean => {
    return getPermission(['update_scheduling_goal_by_pk']);
  },
  UPDATE_SCHEDULING_SPEC: (): boolean => {
    return getPermission(['update_scheduling_specification_by_pk']);
  },
  UPDATE_SCHEDULING_SPEC_CONDITION_ID: (): boolean => {
    return getPermission(['update_scheduling_specification_conditions_by_pk']);
  },
  UPDATE_SCHEDULING_SPEC_GOAL: (): boolean => {
    return getPermission(['update_scheduling_specification_goals_by_pk']);
  },
  UPDATE_SIMULATION: (): boolean => {
    return getPermission(['update_simulation_by_pk']);
  },
  UPDATE_SIMULATION_TEMPLATE: (): boolean => {
    return getPermission(['update_simulation_template_by_pk']);
  },
  UPDATE_USER_SEQUENCE: (): boolean => {
    return getPermission(['update_user_sequence_by_pk']);
  },
  UPDATE_VIEW: (): boolean => {
    return getPermission(['update_view_by_pk']);
  },
};

interface CRUDPermission<T = null> {
  canCreate: PermissionCheck<T>;
  canDelete: PermissionCheck<T>;
  canRead: PermissionCheck<T>;
  canUpdate: PermissionCheck<T>;
}

interface AssignableAsset<T = null> extends Omit<CRUDPermission<T>, 'canDelete' | 'canUpdate'> {
  canAssign: () => boolean;
  canDelete: (entry: T) => boolean;
  canUpdate: (entry: T) => boolean;
}

interface FeaturePermissions {
  activityDirective: CRUDPermission<ActivityDirective>;
  activityPresets: AssignableAsset<ActivityPreset>;
  model: CRUDPermission<ModelSlim>;
  plan: CRUDPermission<PlanSlim>;
}

const featurePermissions: FeaturePermissions = {
  activityDirective: {
    canCreate: () => (isPlanOwner() || isPlanCollaborator()) && queryPermissions.CREATE_ACTIVITY_DIRECTIVE(),
    canDelete: () => (isPlanOwner() || isPlanCollaborator()) && queryPermissions.DELETE_ACTIVITY_DIRECTIVES(),
    canRead: queryPermissions.GET_PLAN,
    canUpdate: () => (isPlanOwner() || isPlanCollaborator()) && queryPermissions.UPDATE_ACTIVITY_DIRECTIVE(),
  },
  activityPresets: {
    canAssign: () => (isPlanOwner() || isPlanCollaborator()) && queryPermissions.APPLY_PRESET_TO_ACTIVITY(),
    canCreate: queryPermissions.CREATE_ACTIVITY_PRESET,
    canDelete: (preset: ActivityPreset) => isUserOwner(preset) && queryPermissions.DELETE_ACTIVITY_PRESET(),
    canRead: queryPermissions.SUB_ACTIVITY_PRESETS,
    canUpdate: (preset: ActivityPreset) => isUserOwner(preset) && queryPermissions.UPDATE_ACTIVITY_PRESET(),
  },
  model: {
    canCreate: queryPermissions.CREATE_MODEL,
    canDelete: queryPermissions.DELETE_MODEL,
    canRead: queryPermissions.GET_PLANS_AND_MODELS,
    canUpdate: () => false, // no feature to update models exists
  },
  plan: {
    canCreate: queryPermissions.CREATE_PLAN,
    canDelete: (plan?: PlanSlim) => isPlanOwner(plan) && queryPermissions.DELETE_PLAN(),
    canRead: queryPermissions.GET_PLAN,
    canUpdate: () => false, // no feature to update plans exists
  },
};

function hasNoAuthorization(permissibleQueries?: PermissibleQueriesMap | null) {
  return permissibleQueries && !Object.keys(permissibleQueries).length;
}

export { featurePermissions, hasNoAuthorization, queryPermissions };
