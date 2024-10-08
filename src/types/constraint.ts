import type { ConstraintDefinitionType } from '../enums/constraint';
import type { PartialWith } from './app';
import type { BaseDefinition, BaseMetadata } from './metadata';
import type { ValueSchema } from './schema';
import type { ConstraintTagsInsertInput } from './tags';
import type { TimeRange } from './timeline';

export type ConstraintDefinition = BaseDefinition & {
  constraint_id: number;
  parameter_schema?: ValueSchema;
  type: ConstraintDefinitionType;
};

export type ConstraintMetadataVersionDefinition = Pick<
  ConstraintDefinition,
  'author' | 'definition' | 'revision' | 'tags'
>;

export type ConstraintMetadata = BaseMetadata<ConstraintDefinition>;

export type ConstraintMetadataSlim = Omit<ConstraintMetadata, 'models_using' | 'plans_using' | 'versions'>;

export type ConstraintModelSpecification = {
  constraint_id: number;
  constraint_metadata: Pick<ConstraintMetadata, 'id' | 'name'> | null;
  constraint_revision: number | null;
  model_id: number;
  // constraint_definition: ConstraintDefinition;
  // model: Model;
};

export type ConstraintPlanSpecification = {
  arguments: any;
  constraint_id: number;
  constraint_invocation_id?: number;
  constraint_metadata:
    | (Pick<ConstraintMetadata, 'name' | 'owner' | 'public'> & {
        versions: Pick<ConstraintDefinition, 'parameter_schema' | 'revision' | 'type'>[];
      })
    | null;
  constraint_revision: number | null;
  enabled: boolean;
  plan_id: number;
  specification_id: number;
  // constraint_definition: ConstraintDefinition;
  // plan: Plan;
};

export type ConstraintModelSpecInsertInput = Omit<ConstraintModelSpecification, 'constraint_metadata'>;
export type ConstraintPlanSpecSetInput = Omit<ConstraintPlanSpecification, 'constraint_metadata'>;
export type ConstraintPlanSpecInsertInput = Omit<ConstraintPlanSpecSetInput, 'constraint_invocation_id'>;

export type ConstraintDefinitionInsertInput = Pick<ConstraintDefinition, 'constraint_id' | 'definition'> & {
  tags: {
    data: ConstraintTagsInsertInput[];
  };
};

export type ConstraintInsertInput = Omit<
  ConstraintMetadataSlim,
  'id' | 'created_at' | 'updated_at' | 'owner' | 'updated_by' | 'tags'
> & {
  tags: {
    data: ConstraintTagsInsertInput[];
  };
  versions: {
    data: Omit<ConstraintDefinitionInsertInput, 'constraint_id'>[];
  };
};

export type ConstraintMetadataSetInput = PartialWith<ConstraintMetadata, 'owner'>;

export type ConstraintType = 'model' | 'plan';

export type ConstraintViolation = {
  activityInstanceIds: number[];
  windows: TimeRange[];
};

export type ConstraintResult = {
  gaps: TimeRange[];
  resourceIds: string[];
  violations: ConstraintViolation[] | null;
};

export type ConstraintResultWithName = ConstraintResult & { constraintName: string };

export type ConstraintResponse = {
  constraintId: ConstraintMetadata['id'];
  constraintName: ConstraintMetadata['name'];
  errors: UserCodeError[];
  results: ConstraintResult;
  success: boolean;
  type: ConstraintType;
};

export type ConstraintRun = {
  arguments: any;
  constraint_id: number;
  constraint_metadata: {
    name: string;
  };
  constraint_revision: number;
  results: ConstraintResultWithName;
  simulation_data_id: number;
};

export type UserCodeError = {
  location: CodeLocation;
  message: string;
  stack: string;
};

export type CodeLocation = {
  column: number;
  line: number;
};
