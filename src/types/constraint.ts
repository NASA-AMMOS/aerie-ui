import type { TimeRange } from './timeline';

export type Constraint = {
  created_at: string;
  created_by: string;
  definition: string;
  description: string;
  id: number;
  model_id: number | null;
  name: string;
  owner: string;
  plan_id: number | null;
  updated_by: string;
};

export type ConstraintInsertInput = Omit<Constraint, 'id'>;

export type ConstraintType = 'model' | 'plan';

export type ConstraintViolationAssociations = {
  activityInstanceIds: number[];
  resourceIds: string[];
};

export type ConstraintViolation = {
  associations: ConstraintViolationAssociations;
  constraintId: Constraint['id'];
  constraintName: Constraint['name'];
  gaps: TimeRange[];
  type: ConstraintType;
  windows: TimeRange[];
};

export type ConstraintViolationsMap = Record<Constraint['id'], ConstraintViolation[]>;

export type ConstraintVisibilityMap = Record<Constraint['id'], boolean>;
