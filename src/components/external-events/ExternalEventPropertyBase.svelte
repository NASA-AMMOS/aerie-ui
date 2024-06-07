<svelte:options immutable={true} />

<script lang="ts">
  import type { ExternalEventProperty } from '../../types/external-event-property';
  import Input from '../form/Input.svelte';
  import Highlight from '../ui/Highlight.svelte';

  export let disabled: boolean = true;
  export let formProperty: ExternalEventProperty;
  export let highlightKeysMap: Record<string, boolean> = {};

  let clientWidth: number;
</script>

<div class="properties-container">
  <Highlight highlight={highlightKeysMap[formProperty.name]}>
    <div bind:clientWidth class="property">
      <div class="property-base-string">
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
  .property {
    column-gap: 4px;
    display: grid;
    grid-template-columns: auto 16px;
  }

  .property :global(.st-input) {
    text-overflow: ellipsis;
  }

  .property :global(.st-input.error) {
    background-color: inherit;
    color: inherit;
  }

  .properties-container :global(> div.highlight) {
    border: 1px solid transparent;
    box-sizing: border-box;
    margin-bottom: -1px;
    margin-top: -1px;
    padding: 4px 0;
  }

  .properties-container :global(> div.highlight:hover) {
    border-bottom: 1px solid var(--st-gray-20);
    border-top: 1px solid var(--st-gray-20);
  }

  .properties-container :global(> div.highlight:hover .property-info) {
    visibility: visible;
  }
</style>
