<svelte:options immutable={true} />

<script lang="ts">
  import type { Property } from '../../types/property';
  import Input from '../form/Input.svelte';
  import Highlight from '../ui/Highlight.svelte';

  export let disabled: boolean = true;
  export let formProperty: Property;
  export let highlightKeysMap: Record<string, boolean> = {};

  let clientWidth: number;
  $: console.log(formProperty)
</script>

<div class="parameters-container">
  <Highlight highlight={highlightKeysMap[formProperty.name]}>
    <div bind:clientWidth class="parameter">
      <div class="parameter-base-string">
        <Input layout="inline">
          {formProperty.name}
          <Input>
            <!--with introduction of event types and event schemas, may have type schemas and diff formatting for durations, times, strings, ints, etc. They are uneditable so maybe its not important-->
            <!--but at least handling for units... something should be done there-->
            <input bind:value={formProperty.value} class="st-input w-100" {disabled}/>
          </Input>
      </Input>
      </div>
    </div>
  </Highlight>
</div>

<style>
  .parameter {
    column-gap: 4px;
    display: grid;
    grid-template-columns: auto 16px;
  }

  .parameter :global(.st-input) {
    text-overflow: ellipsis;
  }

  .parameter :global(.st-input.error) {
    background-color: inherit;
    color: inherit;
  }

  .parameters-container :global(> div.highlight) {
    border: 1px solid transparent;
    box-sizing: border-box;
    margin-bottom: -1px;
    margin-top: -1px;
    padding: 4px 0;
  }

  .parameters-container :global(> div.highlight:hover) {
    border-bottom: 1px solid var(--st-gray-20);
    border-top: 1px solid var(--st-gray-20);
  }

  .parameters-container :global(> div.highlight:hover .parameter-info) {
    visibility: visible;
  }
</style>
