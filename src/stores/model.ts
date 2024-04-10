import { writable, type Writable } from 'svelte/store';
import type { Model, ModelSlim } from '../types/model';
import gql from '../utilities/gql';
import { gqlSubscribable } from './subscribable';

/* Writeable. */
export const creatingModel: Writable<boolean> = writable(false);

export const createModelError: Writable<string | null> = writable(null);

export const modelId: Writable<number> = writable(-1);

/* Subscriptions. */

export const model: Writable<Model | null> = writable(null);
// export const model = gqlSubscribable<Model>(gql.SUB_MODEL, { id: modelId }, null, null);

export const models = gqlSubscribable<ModelSlim[]>(gql.SUB_MODELS, {}, [], null);

/* Helper Functions. */

export function resetModelStores() {
  creatingModel.set(false);
  createModelError.set(null);
}
