import { writable, type Writable } from 'svelte/store';

/* Writeable. */
export const resourceTypes: Writable<ResourceType[]> = writable([]);

/* Subscriptions. */

// export const resourceTypes = gqlSubscribable<Resource[]>(
//   gql.SUB_RESOURCE_TYPES,
//   { modelId },
//   [],
//   ({ resourceTypes }) => {
//     console.log(resourceTypes);
//     return resourceTypes;
//   },
// );
