import type { Readable } from 'svelte/motion';
import { derived, writable, type Writable } from 'svelte/store';
import type { Model, ModelSlim } from '../types/model';
import gql from '../utilities/gql';
import { gqlSubscribable } from './subscribable';

/* Writeable. */
export const creatingModelStatus: Writable<'idle' | 'creating' | 'pending' | 'done' | 'error'> = writable('idle');

export const createModelError: Writable<string | null> = writable(null);

export const initialModel: Writable<Model | null> = writable(null);

/* Derived. */
export const modelId: Readable<number> = derived(initialModel, $model => ($model ? $model.id : -1));

/* Subscriptions. */

export const model = gqlSubscribable<Model | null>(gql.SUB_MODEL, { id: modelId }, null, null);

export const models = gqlSubscribable<ModelSlim[]>(gql.SUB_MODELS, {}, [], null);

/* Helper Functions. */

export function resetModelStores() {
  initialModel.set(null);
  model.updateValue(() => null);
  creatingModelStatus.set('idle');
  createModelError.set(null);
}
