import { writable, type Writable } from 'svelte/store';
import type { Adaptations } from '../types/adaptation';

/* Writeable. */

export const adaptations: Writable<Adaptations> = writable({});
