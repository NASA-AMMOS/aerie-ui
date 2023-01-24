import { derived, writable, type Readable, type Writable } from 'svelte/store';
import type { Resource, Simulation, SimulationDataset, SimulationTemplate, Span } from '../types/simulation';
import gql from '../utilities/gql';
import { Status } from '../utilities/status';
import { modelId, planId, planRevision } from './plan';
import { gqlSubscribable } from './subscribable';
import { view } from './views';

/* Writeable. */

export const simulationDatasetId: Writable<number> = writable(-1);

export const externalResources: Writable<Resource[]> = writable([]);

export const resources: Writable<Resource[]> = writable([]);

export const spans: Writable<Span[]> = writable([]);

/* Subscriptions. */

export const simulation = gqlSubscribable<Simulation>(
  gql.SUB_SIMULATION,
  { planId },
  null,
  (simulations: Simulation[]): Simulation => simulations[0],
);

export const simulationDataset = gqlSubscribable<SimulationDataset | null>(
  gql.SUB_SIMULATION_DATASET,
  { simulationDatasetId },
  null,
);

export const simulationDatasetIds = gqlSubscribable<number[]>(
  gql.SUB_SIMULATION_DATASET_IDS,
  { planId },
  [],
  (simulations: { simulation_dataset_ids: { id: number }[] }[]): number[] => {
    if (simulations.length) {
      return simulations[0].simulation_dataset_ids.map(({ id }) => id);
    }
    return [];
  },
);

export const simulationTemplates = gqlSubscribable<SimulationTemplate[]>(gql.SUB_SIMULATION_TEMPLATES, { modelId }, []);

/* Derived. */

export const resourcesByViewLayerId: Readable<Record<number, Resource[]>> = derived(
  [externalResources, resources, view],
  ([$externalResources, $resources, $view]) => {
    const resources: Resource[] = [...$externalResources, ...$resources];
    const { definition } = $view;
    const { plan } = definition;
    const { timelines } = plan;
    const resourcesByViewLayerId: Record<number, Resource[]> = {};

    for (const resource of resources) {
      for (const timeline of timelines) {
        const { rows } = timeline;

        for (const row of rows) {
          const { layers } = row;

          for (const layer of layers) {
            const { filter } = layer;

            if (filter.resource !== undefined) {
              const { resource: resourceFilter } = filter;
              const { names } = resourceFilter;
              const includeResource = names.length < 1 || names.indexOf(resource.name) > -1;

              if (includeResource) {
                if (resourcesByViewLayerId[layer.id] === undefined) {
                  resourcesByViewLayerId[layer.id] = [resource];
                } else {
                  resourcesByViewLayerId[layer.id].push(resource);
                }
              }
            }
          }
        }
      }
    }

    return resourcesByViewLayerId;
  },
);

export const simulationStatus: Readable<Status | null> = derived(
  [planRevision, simulationDataset],
  ([$planRevision, $simulationDataset]) => {
    if ($simulationDataset) {
      const { status } = $simulationDataset;

      if ($planRevision !== $simulationDataset.plan_revision) {
        return Status.Modified;
      }

      if (status === 'success') {
        return Status.Complete;
      } else if (status === 'failed') {
        return Status.Failed;
      } else if (status === 'incomplete') {
        return Status.Incomplete;
      } else if (status === 'pending') {
        return Status.Pending;
      }
    }

    return null;
  },
  null,
);

/* Helper Functions. */

export function resetSimulationStores() {
  externalResources.set([]);
  resources.set([]);
  simulationDatasetId.set(-1);
  simulationDataset.updateValue(() => null);
  simulationTemplates.updateValue(() => []);
  simulation.updateValue(() => null);
  spans.set([]);
}
