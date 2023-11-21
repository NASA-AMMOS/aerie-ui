import type {
  ActivityDirectiveInstantiationFailure,
  ActivityDirectiveUnknownTypeFailure,
  ActivityDirectiveValidationFailures,
  ActivityDirectiveValidationNoticesFailure,
  ActivityErrorRollup,
  ActivityValidationErrors,
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

export function generateActivityValidationErrorRollups(
  activityValidationErrors: ActivityValidationErrors[],
): ActivityErrorRollup[] {
  return activityValidationErrors.map(({ activityId, errors, type }) => {
    let extra = 0;
    let invalidAnchor = 0;
    let invalidParameter = 0;
    let missing = 0;
    let outOfBounds = 0;
    let wrongType = 0;

    const location: string[] = [];

    errors.forEach(error => {
      if (isInstantiationError(error)) {
        const extraCount = error.errors.extraneousArguments.length;
        const missingCount = error.errors.missingArguments.length;
        const invalidParameterCount = error.errors.unconstructableArguments.length;

        extra += extraCount;
        missing += missingCount;
        invalidParameter += invalidParameterCount;

        location.push(...error.errors.extraneousArguments);
        location.push(...error.errors.missingArguments);
        error.errors.unconstructableArguments.forEach(({ name }) => {
          location.push(name);
        });
      } else if (isUnknownTypeError(error)) {
        wrongType += 1;
      } else if (isValidationNoticesError(error)) {
        error.errors.validationNotices.forEach(({ subjects }) => {
          invalidParameter += subjects.length;
          location.push(...subjects);
        });
      } else {
        const { message } = error;
        if (/end-time\sanchor/i.test(message)) {
          invalidAnchor += 1;
        } else if (/plan\sstart/i.test(message)) {
          outOfBounds += 1;
        }
      }
    });

    return {
      errorCounts: {
        extra,
        invalidAnchor,
        invalidParameter,
        missing,
        outOfBounds,
        wrongType,
      },
      id: activityId,
      location,
      type,
    };
  });
}
