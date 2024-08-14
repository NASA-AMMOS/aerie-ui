import { keyBy } from 'lodash-es';
import { derived, get, writable, type Readable, type Writable } from 'svelte/store';
import { Status } from '../enums/status';
import type {
  ConstraintDefinition,
  ConstraintMetadata,
  ConstraintPlanSpec,
  ConstraintResponse,
  ConstraintResultWithName,
  ConstraintRun,
} from '../types/constraint';
import gql from '../utilities/gql';
import { planId, planStartTimeMs } from './plan';
import { simulationDatasetId } from './simulation';
import { gqlSubscribable } from './subscribable';

/* Writeable. */

export const constraintMetadataId: Writable<number> = writable(-1);

export const constraintsViolationStatus: Writable<Status | null> = writable(null);

export const constraintVisibilityMapWritable: Writable<Record<ConstraintMetadata['id'], boolean>> = writable({});

export const rawConstraintResponses: Writable<ConstraintResponse[]> = writable([]);

export const constraintsColumns: Writable<string> = writable('1fr 3px 1fr');

/* Subscriptions. */

export const constraints = gqlSubscribable<ConstraintMetadata[]>(gql.SUB_CONSTRAINTS, {}, [], null);

export const constraintRuns = gqlSubscribable<ConstraintRun[]>(
  gql.SUB_CONSTRAINT_RUNS,
  { simulationDatasetId },
  [],
  null,
);

export const constraintPlanSpecs = gqlSubscribable<ConstraintPlanSpec[]>(
  gql.SUB_CONSTRAINT_PLAN_SPECIFICATIONS,
  { planId },
  [],
  null,
);

export const constraintMetadata = gqlSubscribable<ConstraintMetadata | null>(
  gql.SUB_CONSTRAINT,
  { id: constraintMetadataId },
  null,
  null,
);

/* Derived. */
export const constraintsMap: Readable<Record<string, ConstraintMetadata>> = derived([constraints], ([$constraints]) =>
  keyBy($constraints, 'id'),
);

export const constraintPlanSpecsMap: Readable<Record<string, ConstraintPlanSpec>> = derived(
  [constraintPlanSpecs],
  ([$constraintPlanSpecs]) => keyBy($constraintPlanSpecs, 'constraint_id'),
);

export const allowedConstraintSpecs: Readable<ConstraintPlanSpec[]> = derived(
  [constraintPlanSpecs],
  ([$constraintPlanSpecs]) =>
    $constraintPlanSpecs.filter(({ constraint_metadata: constraintMetadata }) => constraintMetadata !== null),
);

export const allowedConstraintPlanSpecMap: Readable<Record<string, ConstraintPlanSpec>> = derived(
  [allowedConstraintSpecs],
  ([$allowedConstraintSpecs]) => keyBy($allowedConstraintSpecs, 'constraint_id'),
);

export const constraintVisibilityMap: Readable<Record<ConstraintMetadata['id'], boolean>> = derived(
  [allowedConstraintPlanSpecMap, constraintVisibilityMapWritable],
  ([$allowedConstraintPlanSpecMap, $constraintVisibilityMapWritable]) => {
    return Object.values($allowedConstraintPlanSpecMap).reduce((map: Record<number, boolean>, constraint) => {
      if (constraint.constraint_id in $constraintVisibilityMapWritable) {
        map[constraint.constraint_id] = $constraintVisibilityMapWritable[constraint.constraint_id];
      } else {
        map[constraint.constraint_id] = true;
      }
      return map;
    }, {});
  },
);

export const constraintResponseMap: Readable<Record<ConstraintDefinition['constraint_id'], ConstraintResponse>> =
  derived([constraintRuns, planStartTimeMs], ([$constraintRuns, $planStartTimeMs]) =>
    keyBy(
      $constraintRuns.map(
        run =>
          ({
            constraintId: run.constraint_id,
            constraintName: '',
            errors: [],
            results: {
              ...run.results,
              violations:
                run.results.violations?.map(violation => ({
                  ...violation,
                  windows: violation.windows.map(({ end, start }) => ({
                    end: $planStartTimeMs + end / 1000,
                    start: $planStartTimeMs + start / 1000,
                  })),
                })) ?? null,
            },
            success: true,
            type: 'plan',
          }) as ConstraintResponse,
      ),
      'constraintId',
    ),
  );

export const uncheckedConstraintCount: Readable<number> = derived(
  [allowedConstraintSpecs, constraintResponseMap],
  ([$allowedConstraintSpecs, $constraintResponseMap]) => {
    const foo = $allowedConstraintSpecs.reduce((count, prev) => {
      if (!(prev.constraint_id in $constraintResponseMap)) {
        count++;
      }
      return count;
    }, 0);
    return foo;
  },
);

export const relevantConstraintRuns: Readable<ConstraintRun[]> = derived(
  [constraintRuns, constraintPlanSpecsMap],
  ([$constraintRuns, $constraintPlanSpecsMap]) => {
    return $constraintRuns.filter(constraintRun => {
      const constraintPlanSpec = $constraintPlanSpecsMap[constraintRun.constraint_id];
      let revision = -1;

      if (constraintPlanSpec) {
        if (constraintPlanSpec.constraint_revision === null) {
          revision =
            constraintPlanSpec.constraint_metadata?.versions[
              (constraintPlanSpec.constraint_metadata?.versions.length ?? 0) - 1
            ]?.revision ?? -1;
        } else {
          revision = constraintPlanSpec.constraint_revision;
        }
      }

      return revision === constraintRun.constraint_revision;
    });
  },
);

export const visibleConstraintResults: Readable<ConstraintResultWithName[]> = derived(
  [constraintRuns, allowedConstraintPlanSpecMap],
  ([$constraintRuns, $allowedConstraintPlanSpecMap]) =>
    $constraintRuns
      .filter(constraintRun => {
        return (
          $allowedConstraintPlanSpecMap[constraintRun.constraint_id] &&
          $allowedConstraintPlanSpecMap[constraintRun.constraint_id].constraint_revision ===
            constraintRun.constraint_revision
        );
      })
      .map(constraintRun => constraintRun.results),
);

export const cachedConstraintsStatus: Readable<Status | null> = derived(
  [relevantConstraintRuns],
  ([$relevantConstraintRuns]) => {
    return $relevantConstraintRuns.reduce((status: Status, constraintRun: ConstraintRun) => {
      if (constraintRun.results.violations?.length) {
        return Status.Failed;
      } else if (status !== Status.Failed) {
        return Status.Complete;
      }

      return status;
    }, Status.Unchecked);
  },
);

export const constraintsStatus: Readable<Status | null> = derived(
  [cachedConstraintsStatus, constraintsViolationStatus, uncheckedConstraintCount],
  ([$cachedConstraintsStatus, $constraintsViolationStatus, $uncheckedConstraintCount]) => {
    if (!$cachedConstraintsStatus) {
      return null;
    } else if ($cachedConstraintsStatus !== Status.Complete || $constraintsViolationStatus) {
      return $constraintsViolationStatus ?? $cachedConstraintsStatus;
    } else if ($uncheckedConstraintCount > 0) {
      return Status.PartialSuccess;
    }

    return $constraintsViolationStatus ?? $cachedConstraintsStatus;
  },
);

/* Helper Functions. */

export function setConstraintVisibility(constraintId: ConstraintDefinition['constraint_id'], visible: boolean) {
  constraintVisibilityMapWritable.set({ ...get(constraintVisibilityMapWritable), [constraintId]: visible });
}

export function setAllConstraintsVisible(visible: boolean) {
  constraintVisibilityMapWritable.set(
    Object.values(get(constraintsMap)).reduce((map: Record<number, boolean>, constraint) => {
      map[constraint.id] = visible;
      return map;
    }, {}),
  );
}

export function resetPlanConstraintStores() {
  constraintPlanSpecs.updateValue(() => []);
}

export function resetConstraintStores(): void {
  // cachedConstraintsStatus.set(null);
  rawConstraintResponses.set([]);
}

export function resetConstraintStoresForSimulation(): void {
  // cachedConstraintsStatus.set(Status.Unchecked);
  rawConstraintResponses.set([]);
}
