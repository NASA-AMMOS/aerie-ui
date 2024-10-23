import type { User } from '../../../types/app';

export const mockUser: User = {
  activeRole: 'aerie_admin',
  allowedRoles: ['aerie_admin'],
  defaultRole: 'aerie_admin',
  id: 'test',
  permissibleQueries: {
    activity_presets: true,
    apply_preset_to_activity: true,
    begin_merge: true,
    cancel_merge: true,
    commit_merge: true,
    constraint: true,
    constraintViolations: true,
    createExpansionSet: true,
    create_merge_request: true,
    delete_activity_by_pk_delete_subtree_bulk: true,
    delete_activity_by_pk_reanchor_plan_start_bulk: true,
    delete_activity_by_pk_reanchor_to_anchor_bulk: true,
    delete_activity_directive: true,
    delete_activity_directive_tag: true,
    delete_activity_presets_by_pk: true,
    delete_command_dictionary_by_pk: true,
    delete_constraint_by_pk: true,
    delete_constraint_tags: true,
    delete_expansion_rule_by_pk: true,
    delete_expansion_rule_tags: true,
    delete_expansion_set_by_pk: true,
    delete_mission_model_by_pk: true,
    delete_plan_by_pk: true,
    delete_plan_tag: true,
    delete_preset_to_directive_by_pk: true,
    delete_scheduling_condition_by_pk: true,
    delete_scheduling_goal_by_pk: true,
    delete_scheduling_goal_tags: true,
    delete_scheduling_specification: true,
    delete_scheduling_specification_goals_by_pk: true,
    delete_sequence_by_pk: true,
    delete_sequence_to_simulated_activity_by_pk: true,
    delete_simulation_template_by_pk: true,
    delete_tags_by_pk: true,
    delete_user_sequence_by_pk: true,
    delete_view: true,
    delete_view_by_pk: true,
    deny_merge: true,
    duplicate_plan: true,
    expandAllActivities: true,
    expansion_rule: true,
    expansion_run: true,
    expansion_set: true,
    insert_activity_directive_one: true,
    insert_activity_directive_tags: true,
    insert_activity_presets_one: true,
    insert_constraint_one: true,
    insert_constraint_tags: true,
    insert_expansion_rule_one: true,
    insert_expansion_rule_tags: true,
    insert_mission_model_one: true,
    insert_plan_one: true,
    insert_plan_tags: true,
    insert_scheduling_condition_one: true,
    insert_scheduling_goal_one: true,
    insert_scheduling_goal_tags: true,
    insert_scheduling_specification_conditions_one: true,
    insert_scheduling_specification_goals_one: true,
    insert_scheduling_specification_one: true,
    insert_sequence_one: true,
    insert_sequence_to_simulated_activity_one: true,
    insert_simulation_template_one: true,
    insert_tags: true,
    insert_user_sequence_one: true,
    insert_view_one: true,
    mission_model: true,
    plan_by_pk: true,
    set_resolution: true,
    set_resolution_bulk: true,
    simulate: true,
    simulation: true,
    simulation_template: true,
    tag: true,
    update_activity_directive_by_pk: true,
    update_activity_presets_by_pk: true,
    update_constraint_by_pk: true,
    update_expansion_rule_by_pk: true,
    update_plan_by_pk: true,
    update_scheduling_condition_by_pk: true,
    update_scheduling_goal_by_pk: true,
    update_scheduling_specification_by_pk: true,
    update_scheduling_specification_conditions_by_pk: true,
    update_scheduling_specification_goals_by_pk: true,
    update_simulation: true,
    update_simulation_by_pk: true,
    update_simulation_template_by_pk: true,
    update_tags_by_pk: true,
    update_user_sequence_by_pk: true,
    update_view_by_pk: true,
    uploadDictionary: true,
    user_sequence: true,
    view: true,
    withdraw_merge_request: true,
  },
  rolePermissions: {},
  token: '',
};
