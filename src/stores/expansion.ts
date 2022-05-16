import Toastify from 'toastify-js';
import gql from '../utilities/gql';
import req from '../utilities/requests';
import { getGqlSubscribable } from './subscribable';

/* Subscriptions. */

export const activityTypeNames = getGqlSubscribable<Pick<ActivityType, 'name'>[]>(
  gql.SUB_ACTIVITY_TYPE_NAMES,
  { modelId: -1 },
  [],
);

export const dictionaries = getGqlSubscribable<CommandDictionary[]>(gql.SUB_COMMAND_DICTIONARIES, {}, []);

export const expansionRules = getGqlSubscribable<ExpansionRule[]>(gql.SUB_EXPANSION_RULES, {}, []);

export const models = getGqlSubscribable<ModelInput[]>(gql.SUB_MODELS, {}, []);

/* Action Functions. */

export const expansionActions = {
  async createExpansionRule(
    activity_type: string,
    expansion_logic: string,
    authoring_command_dict_id: number | null = null,
    authoring_mission_model_id: number | null = null,
  ): Promise<number | null> {
    const rule: ExpansionRuleInsertInput = {
      activity_type,
      authoring_command_dict_id,
      authoring_mission_model_id,
      expansion_logic,
    };
    const newRuleId = await req.createExpansionRule(rule);

    if (newRuleId !== null) {
      Toastify({
        backgroundColor: '#2da44e',
        duration: 3000,
        gravity: 'bottom',
        position: 'left',
        text: 'Expansion Rule Created Successfully',
      }).showToast();
      return newRuleId;
    } else {
      Toastify({
        backgroundColor: '#a32a2a',
        duration: 3000,
        gravity: 'bottom',
        position: 'left',
        text: 'Expansion Rule Create Failed',
      }).showToast();
      return null;
    }
  },

  async deleteExpansionRule(id: number): Promise<void> {
    const success = await req.deleteExpansionRule(id);

    if (success) {
      Toastify({
        backgroundColor: '#2da44e',
        duration: 3000,
        gravity: 'bottom',
        position: 'left',
        text: 'Expansion Rule Deleted Successfully',
      }).showToast();
    } else {
      Toastify({
        backgroundColor: '#a32a2a',
        duration: 3000,
        gravity: 'bottom',
        position: 'left',
        text: 'Expansion Rule Delete Failed',
      }).showToast();
    }
  },

  async updateExpansionRule(id: number, rule: Partial<ExpansionRule>): Promise<void> {
    const success = await req.updateExpansionRule(id, rule);

    if (success) {
      Toastify({
        backgroundColor: '#2da44e',
        duration: 3000,
        gravity: 'bottom',
        position: 'left',
        text: 'Expansion Rule Updated Successfully',
      }).showToast();
    } else {
      Toastify({
        backgroundColor: '#a32a2a',
        duration: 3000,
        gravity: 'bottom',
        position: 'left',
        text: 'Expansion Rule Update Failed',
      }).showToast();
    }
  },
};
