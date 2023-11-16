import { derived, writable, type Readable, type Writable } from 'svelte/store';
import type {
  ActivityDirectiveValidationFailureStatus,
  ActivityValidationErrors,
  AnchorValidationError,
  BaseError,
  CaughtError,
  SchedulingError,
  SimulationDatasetError,
} from '../types/errors';
import { ErrorTypes } from '../utilities/errors';
import { compare } from '../utilities/generic';
import gql from '../utilities/gql';
import { activityDirectivesMap, anchorValidationStatuses } from './activities';
import { planId } from './plan';
import { simulationDataset } from './simulation';
import { gqlSubscribable } from './subscribable';

export function parseErrorReason(error: string) {
  return error.replace(/\s*at\s(gov|com)/, ' : ').replace(/gov\S*:\s*(?<reason>[^:]+)\s*:(.|\s|\n|\t|\r)*/, '$1');
}

/* Subscriptions. */

export const activityDirectiveValidationFailures = gqlSubscribable<ActivityDirectiveValidationFailureStatus[]>(
  gql.SUB_ACTIVITY_DIRECTIVE_VALIDATION_ERRORS,
  { planId },
  [],
  null,
);

/* Derived. */

export const anchorValidationErrors: Readable<AnchorValidationError[]> = derived(
  [anchorValidationStatuses],
  ([$anchorValidationStatuses]) => {
    return $anchorValidationStatuses
      .filter(({ reason_invalid }) => !!reason_invalid)
      .map(({ activity_id, reason_invalid }) => {
        const error: AnchorValidationError = {
          activityId: activity_id,
          message: reason_invalid,
          timestamp: `${new Date()}`,
          type: ErrorTypes.ANCHOR_VALIDATION_ERROR,
        };
        return error;
      });
  },
  [],
);

export const activityValidationErrors: Readable<ActivityValidationErrors[]> = derived(
  [activityDirectiveValidationFailures, anchorValidationErrors, activityDirectivesMap],
  ([$activityDirectiveValidationFailures, $anchorValidationErrors, $activityDirectivesMap]) => {
    const tableErrorsMap: Record<string, ActivityValidationErrors> = {};

    $activityDirectiveValidationFailures.forEach(({ validations, directive_id: directiveId }) => {
      if (tableErrorsMap[directiveId] === undefined) {
        tableErrorsMap[directiveId] = {
          activityId: directiveId,
          errors: [validations],
          type: $activityDirectivesMap[directiveId]?.type,
        };
      } else {
        tableErrorsMap[directiveId].errors.push(validations);
      }
    });

    $anchorValidationErrors.forEach(anchorValidationError => {
      const { activityId } = anchorValidationError;
      if (tableErrorsMap[activityId] === undefined) {
        tableErrorsMap[activityId] = {
          activityId: activityId,
          errors: [anchorValidationError],
          type: $activityDirectivesMap[activityId]?.type,
        };
      } else {
        tableErrorsMap[activityId].errors.push(anchorValidationError);
      }
    });

    return Object.values(tableErrorsMap);
  },
);

export const simulationDatasetErrors: Readable<SimulationDatasetError[]> = derived(
  [simulationDataset],
  ([$simulationDataset]) => {
    return $simulationDataset && $simulationDataset.reason
      ? [
          {
            ...$simulationDataset.reason,
            message: parseErrorReason($simulationDataset.reason.message),
          },
        ]
      : [];
  },
  [],
);

export const schedulingErrors: Writable<SchedulingError[]> = writable([]);

const caughtErrors: Writable<CaughtError[]> = writable([]);

export const allErrors: Readable<BaseError[]> = derived(
  [simulationDatasetErrors, schedulingErrors, anchorValidationErrors, caughtErrors],
  ([$simulationDatasetErrors, $schedulingErrors, $anchorValidationErrors, $caughtErrors]) =>
    [
      ...($simulationDatasetErrors ?? []),
      ...($schedulingErrors ?? []),
      ...($anchorValidationErrors ?? []),
      ...($caughtErrors ?? []),
    ].sort((errorA: BaseError, errorB: BaseError) =>
      compare(`${new Date(errorA.timestamp)}`, `${new Date(errorB.timestamp)}`, false),
    ),
);

/* Helper Functions. */

export function catchError(error: string | Error, details?: string | Error, shouldLog: boolean = true): void {
  caughtErrors.update(errors => {
    errors.push({
      message: `${error}`,
      timestamp: `${new Date()}`,
      ...(details ? { trace: `${details}` } : {}),
      type: ErrorTypes.CAUGHT_ERROR,
    });
    return [...errors];
  });

  if (shouldLog) {
    console.log(details ?? error);
  }
}

export function catchSchedulingError(error: SchedulingError) {
  schedulingErrors.update(errors => {
    errors.push({
      ...error,
      message: parseErrorReason(error.message),
    });
    return [...errors];
  });
}

export function clearSchedulingErrors(): void {
  schedulingErrors.set([]);
}

export function clearAllErrors(): void {
  clearSchedulingErrors();
  caughtErrors.set([]);
}
