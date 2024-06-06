<svelte:options immutable={true} />

<script lang="ts">
  import type { Property } from '../../types/property';
  import { compare } from '../../utilities/generic';
  import Input from '../form/Input.svelte';
  import Highlight from '../ui/Highlight.svelte';

  export let disabled: boolean = false;
  export let formProperties: Property[] = [];
  export let highlightKeysMap: Record<string, boolean> = {};

  let clientWidth: number;
  
  $: sortedFormProperties = formProperties.sort((a, b) => compare(a.name, b.name));
</script>

<div class="parameters-container">
  {#each sortedFormProperties as formProperty (formProperty.name)}
    <Highlight highlight={highlightKeysMap[formProperty.name]}>
      <div bind:clientWidth class="parameter">
        <div class="parameter-base-string">
          <div class="form-parameter-name st-typography-body">
            <div
              class="name"
            >
              {formProperty.name}
            </div>
          </div>
          <Input>
            <!--INSANELY SIMPLIFIED. The parameter analogue has a ton of stuff for how to handle objects, times, durations, etc...-->
            <input
              bind:value={formProperty.value}
              class="st-input w-100"
              {disabled}
              type="text"
            />
          </Input>
        </div>
      </div>
    </Highlight>
  {/each}
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
