import { writable, type Writable } from 'svelte/store';
import type { Plugins } from '../types/plugin';

/* Writeable. */

export const plugins: Writable<Plugins> = writable({});
export const pluginsLoaded: Writable<boolean> = writable(false);
