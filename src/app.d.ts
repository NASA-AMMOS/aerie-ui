/* eslint @typescript-eslint/no-unused-vars: 0 */
import type { GlobalType } from './types/global-type';

declare global {
  namespace App {
    interface Locals {
      user: import('./types/app').User | null;
    }
  }

  /**
   * Types for svelte-dnd-action.
   * @see https://github.com/isaacHagoel/svelte-dnd-action#typescript
   */
  declare type Item = import('svelte-dnd-action').Item;
  declare type DndEvent<ItemType = Item> = import('svelte-dnd-action').DndEvent<ItemType>;
  declare namespace svelteHTML {
    interface HTMLAttributes<T> {
      'on:consider'?: (event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T }) => void;
      'on:finalize'?: (event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T }) => void;
    }
  }

  /**
   *  Types for imported SVGs.
   *  @see https://github.com/poppa/sveltekit-svg#typescript
   */
  declare module '*.svg' {
    const content: any;
    export default content;
  }

  declare module '*.svg?component' {
    const content: any;
    export default content;
  }

  declare module '*.svg?src' {
    const content: string;
    export default content;
  }

  declare module '*.svg?url' {
    const content: string;
    export default content;
  }

  // eslint-disable no-var
  var GLOBALS: GlobalType[];
  var LOOP_KEYWORDS: {
    BREAK: string;
    CONTINUE: string;
    END_WHILE_LOOP: string;
    WHILE_LOOP: string;
  };
  var CONDITIONAL_KEYWORDS: { END_IF: string; ELSE_IF: string; IF: string };
  function LINT(commandDictionary, view, node);
}

export {};
