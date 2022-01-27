<svelte:options accessors={true} immutable={true} />

<script lang="ts">
  import type { editor as monaco } from 'monaco-editor/esm/vs/editor/editor.api';
  import type {
    Editor,
    ModelContentChangedEvent,
    Options,
    OverrideServices,
  } from './monaco';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { createMonacoEditor } from './monaco';

  const dispatch = createEventDispatcher();

  export let automaticLayout: boolean = true;
  export let language: string = '';
  export let lineNumbers: monaco.LineNumbersType = 'on';
  export let minimap: monaco.IEditorMinimapOptions = { enabled: false };
  export let options: Options = undefined;
  export let override: OverrideServices = undefined;
  export let scrollBeyondLastLine: boolean = false;
  export let value: string = '';

  let div: HTMLDivElement | null = null;
  let editor: Editor;

  $: if (editor) {
    const currentValue = editor.getValue();
    if (value !== currentValue) {
      const scrollTop = editor.getScrollTop(); // setValue can nuke scroll position.
      editor.getModel().setValue(value); // TODO: use applyEdits API instead?
      editor.setScrollPosition({ scrollTop });
    }
  }

  onMount(async () => {
    const individualOptions: Options = {
      automaticLayout,
      language,
      lineNumbers,
      minimap,
      scrollBeyondLastLine,
      value,
    };
    const monacoOptions: Options = options ?? individualOptions;

    editor = await createMonacoEditor(div, monacoOptions, override);
    editor.onDidChangeModelContent((e: ModelContentChangedEvent) => {
      const newValue = editor.getModel().getValue();
      dispatch('onDidChangeModelContent', { e, value: newValue });
    });
  });

  onDestroy(() => {
    if (editor) {
      editor.dispose();
    }
  });
</script>

{#if !editor}
  <slot name="loading">Loading Editor...</slot>
{/if}

<div bind:this={div} class="monaco-editor" />

<style>
  .monaco-editor {
    height: 100%;
  }
</style>
