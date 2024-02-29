import type { PartialWith, UserId } from './app';
import type { SchedulingError } from './errors';
import type { BaseDefinition, BaseMetadata } from './metadata';
import type { Model } from './model';
import type { ArgumentsMap } from './parameter';
import type { Plan } from './plan';
import type { SchedulingTagsInsertInput, Tag } from './tags';

export type SchedulingConditionDefinition = BaseDefinition & {
  condition_id: number;
};

export type SchedulingConditionMetadata = BaseMetadata<SchedulingConditionDefinition>;

export type SchedulingConditionMetadataVersionDefinition = Pick<
  SchedulingConditionDefinition,
  'author' | 'definition' | 'revision' | 'tags'
>;

export type SchedulingGoalDefinition = {
  author: UserId;
  created_at: string;
  definition: string;
  goal_id: number;
  metadata: SchedulingGoalMetadata;
  // models_using: Model[];
  // plans_using: Plan[];
  revision: number;
  tags: { tag: Tag }[];
};

export type SchedulingGoalMetadata = {
  created_at: string;
  description?: string;
  id: number;
  models_using: Pick<Model, 'id'>[];
  name: string;
  owner: UserId;
  plans_using: Pick<Plan, 'id'>[];
  public: boolean;
  tags: { tag: Tag }[];
  updated_at: string;
  updated_by: UserId;
  versions: SchedulingGoalDefinition[];
};

export type SchedulingConditionMetadataSlim = Omit<
  SchedulingConditionMetadata,
  'models_using' | 'plans_using' | 'versions'
>;
export type SchedulingGoalMetadataSlim = Omit<SchedulingGoalMetadata, 'models_using' | 'plans_using' | 'versions'>;

export type SchedulingConditionDefinitionInsertInput = Pick<
  SchedulingConditionDefinition,
  'condition_id' | 'definition'
> & {
  tags: {
    data: SchedulingTagsInsertInput[];
  };
};

export type SchedulingGoalDefinitionInsertInput = Pick<SchedulingGoalDefinition, 'goal_id' | 'definition'> & {
  tags: {
    data: SchedulingTagsInsertInput[];
  };
};

export type SchedulingConditionInsertInput = Omit<
  SchedulingConditionMetadataSlim,
  'id' | 'created_at' | 'updated_at' | 'owner' | 'updated_by' | 'tags'
> & {
  tags: {
    data: SchedulingTagsInsertInput[];
  };
  versions: {
    data: Omit<SchedulingConditionDefinitionInsertInput, 'condition_id'>[];
  };
};

export type SchedulingGoalInsertInput = Omit<
  SchedulingGoalMetadataSlim,
  'id' | 'created_at' | 'updated_at' | 'owner' | 'updated_by' | 'tags'
> & {
  tags: {
    data: SchedulingTagsInsertInput[];
  };
  versions: {
    data: Omit<SchedulingGoalDefinitionInsertInput, 'goal_id'>[];
  };
};

export type SchedulingConditionMetadataSetInput = PartialWith<SchedulingConditionMetadata, 'owner'>;
export type SchedulingGoalMetadataSetInput = PartialWith<SchedulingGoalMetadata, 'owner'>;

export type SchedulingGoalAnalysis = {
  analysis_id: number;
  request: { specification_id: number };
  satisfied: boolean;
  satisfying_activities: { activity_id: number }[];
};

export type SchedulingResponse = {
  analysisId: number | null;
  reason: SchedulingError;
};

export type SchedulingSpec = {
  analysis_only: boolean;
  horizon_end: string;
  horizon_start: string;
  id: number;
  plan_id: number;
  plan_revision: number;
  revision: number;
  simulation_arguments: ArgumentsMap;
};

export type SchedulingSpecInsertInput = Omit<SchedulingSpec, 'id' | 'revision'>;

export type SchedulingSpecCondition = {
  condition: SchedulingConditionMetadata;
  enabled: boolean;
  specification: SchedulingSpec;
  specification_id: number;
};

export type SchedulingSpecGoal = {
  enabled: boolean;
  goal: SchedulingGoalMetadataSlim;
  priority: number;
  simulate_after: boolean;
  specification_id: number;
};

export type SchedulingSpecConditionInsertInput = {
  condition_id: number;
  enabled: boolean;
  specification_id: number;
};

export type SchedulingSpecGoalInsertInput = {
  enabled: boolean;
  goal_id: number;
  specification_id: number;
};

export type SchedulingRequest = {
  analysis_id: number;
  canceled: boolean;
  dataset_id: number | null;
  reason: SchedulingError | null;
  requested_at: string;
  requested_by: string;
  specification_id: number;
  specification_revision: number;
  status: 'success' | 'failed' | 'incomplete' | 'pending';
};
