import type {
  ActivityDirectiveInstantiationFailure,
  ActivityDirectiveUnknownTypeFailure,
  ActivityDirectiveValidationFailures,
  ActivityDirectiveValidationNoticesFailure,
  AnchorValidationError,
} from '../types/errors';

export enum ErrorTypes {
  ANCHOR_VALIDATION_ERROR = 'ANCHOR_VALIDATION_ERROR',
  CAUGHT_ERROR = 'CAUGHT_ERROR',
  GLOBAL_SCHEDULING_CONDITIONS_FAILED = 'GLOBAL_SCHEDULING_CONDITIONS_FAILED',
  IO_EXCEPTION = 'IO_EXCEPTION',
  INSTANTIATION_ERRORS = 'INSTANTIATION_ERRORS',
  NO_SUCH_ACTIVITY_TYPE = 'NO_SUCH_ACTIVITY_TYPE',
  NO_SUCH_MISSION_MODEL = 'NO_SUCH_MISSION_MODEL',
  NO_SUCH_PLAN = 'NO_SUCH_PLAN',
  NO_SUCH_SPECIFICATION = 'NO_SUCH_SPECIFICATION',
  PLAN_CONTAINS_UNCONSTRUCTABLE_ACTIVITIES = 'PLAN_CONTAINS_UNCONSTRUCTABLE_ACTIVITIES',
  PLAN_SERVICE_EXCEPTION = 'PLAN_SERVICE_EXCEPTION',
  RESULTS_PROTOCOL_FAILURE = 'RESULTS_PROTOCOL_FAILURE',
  SCHEDULING_GOALS_FAILED = 'SCHEDULING_GOALS_FAILED',
  SIMULATION_REQUEST_NOT_RELEVANT = 'SIMULATION_REQUEST_NOT_RELEVANT',
  SPECIFICATION_LOAD_EXCEPTION = 'SPECIFICATION_LOAD_EXCEPTION',
  UNEXPECTED_SCHEDULER_EXCEPTION = 'UNEXPECTED_SCHEDULER_EXCEPTION',
  UNEXPECTED_SIMULATION_EXCEPTION = 'UNEXPECTED_SIMULATION_EXCEPTION',
  VALIDATION_NOTICES = 'VALIDATION_NOTICES',
}

export function isInstantiationError(
  validation: ActivityDirectiveValidationFailures | AnchorValidationError,
): validation is ActivityDirectiveInstantiationFailure {
  return (validation as ActivityDirectiveInstantiationFailure).type === ErrorTypes.INSTANTIATION_ERRORS;
}

export function isUnknownTypeError(
  validation: ActivityDirectiveValidationFailures | AnchorValidationError,
): validation is ActivityDirectiveUnknownTypeFailure {
  return (validation as ActivityDirectiveUnknownTypeFailure).type === ErrorTypes.NO_SUCH_ACTIVITY_TYPE;
}

export function isValidationNoticesError(
  validation: ActivityDirectiveValidationFailures | AnchorValidationError,
): validation is ActivityDirectiveValidationNoticesFailure {
  return (validation as ActivityDirectiveValidationNoticesFailure).type === ErrorTypes.VALIDATION_NOTICES;
}
