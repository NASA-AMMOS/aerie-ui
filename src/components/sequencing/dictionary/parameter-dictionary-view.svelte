<svelte:options immutable={true} />

<script lang="ts">
  import type { Parameter, ParameterDictionary } from '@nasa-jpl/aerie-ampcs';
  import ParameterView from './parameter-view.svelte';

  export let parameterDictionary: ParameterDictionary;

  let parameter: Parameter | null;
  let parameters: Parameter[] = [];
  let filteredParameters: Parameter[] = [];
  let stemFilter: string = '';

  $: {
    parameters = parameterDictionary.params.slice().sort((a, b) => a.param_name.localeCompare(b.param_name));
  }

  $: {
    if (stemFilter) {
      try {
        const stemRegExp: RegExp | null = new RegExp(stemFilter, 'ig');
        filteredParameters = parameters.filter(param => stemRegExp.test(param.param_name));
      } catch {
        // user entered invalid regexp
        const upperCaseFilter = stemFilter.toUpperCase();
        filteredParameters = parameters.filter(param => param.param_name.includes(upperCaseFilter));
      }
    } else {
      filteredParameters = parameters;
    }
  }
</script>

<div>Parameter Filter <input bind:value={stemFilter} /></div>
<div class="detail-view" role="listbox">
  {#each filteredParameters as param}
    <a on:click={() => (parameter = param)} href="#parcel">
      <div class={parameter === param ? 'selected' : undefined}>
        {param.param_name}
      </div>
    </a>
  {/each}
</div>
<hr />
{#if parameter}
  <ParameterView param={parameter} />
{/if}

<style>
  .detail-view {
    height: 100px;
    overflow: scroll;
  }

  .selected {
    background: var(--st-gray-20);
    border: solid 1px var(--st-gray-70);
  }

  a:visited {
    color: var(--st-primary-text-color);
  }
</style>
