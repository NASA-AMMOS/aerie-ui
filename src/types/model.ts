import type { UserId } from './app';
import type { ConstraintModelSpec } from './constraint';
import type { ParametersMap } from './parameter';
import type { SchedulingConditionModelSpecification, SchedulingGoalModelSpecification } from './scheduling';
import type { View } from './view';

export type Model = ModelSchema;

export type ModelInsertInput = Pick<Model, 'description' | 'jar_id' | 'mission' | 'name' | 'version'>;
export type ModelSetInput = Pick<Model, 'description' | 'mission' | 'name' | 'owner' | 'version'>;

export type ModelLog = {
  // created_at: string;
  // delivered: boolean;
  // error: string | null;
  error_message: string | null;
  // error_type: string | null;
  // status: string | null;
  success: boolean;
  // tries: number;
  // triggering_user: UserId;
};

export type ModelSchema = {
  constraint_specification: ConstraintModelSpec[];
  created_at: string;
  description?: string;
  id: number;
  jar_id: number;
  mission: string;
  name: string;
  owner: UserId;
  parameters: { parameters: ParametersMap };
  plans: { id: number }[];
  refresh_activity_type_logs: ModelLog[];
  refresh_model_parameter_logs: ModelLog[];
  refresh_resource_type_logs: ModelLog[];
  scheduling_specification_conditions: SchedulingConditionModelSpecification[];
  scheduling_specification_goals: SchedulingGoalModelSpecification[];
  version: string;
  view: View | null;
};

export type ModelSlim = Pick<
  Model,
  'created_at' | 'description' | 'id' | 'jar_id' | 'name' | 'plans' | 'owner' | 'version'
>;
