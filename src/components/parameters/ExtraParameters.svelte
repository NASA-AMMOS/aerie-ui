<svelte:options immutable={true} />

<script lang="ts">
  import type { ArgumentsMap } from '../../types/parameter';
  import { tooltip } from '../../utilities/tooltip';
  import Input from '../form/Input.svelte';

  export let extraArguments: string[];
  export let argumentsMap: ArgumentsMap;
</script>

<div class="extra-parameters-container">
  <fieldset>
    <span class="extra-parameters-header">Extra Parameters:</span>
    <div class="extra-parameters-content">
      {#each extraArguments as extraArgument}
        <div class="name">
          <span use:tooltip={{ content: extraArgument, placement: 'top' }}>{extraArgument}</span>
        </div>
        <Input>
          <input
            value={argumentsMap[extraArgument] ? `${argumentsMap[extraArgument]}` : ''}
            class="st-input w-100 error"
            readonly
            type="text"
          />
        </Input>
      {/each}
    </div>
  </fieldset>
</div>

<style>
  .extra-parameters-header {
    color: var(--st-red);
    font-weight: bold;
    margin-bottom: 4px;
  }

  .extra-parameters-content {
    column-gap: 4px;
    display: grid;
    grid-template-columns: 1fr 2fr;
    margin-left: 32px;
    row-gap: 10px;
  }

  .name {
    align-items: center;
    display: flex;
    overflow: hidden;
  }

  .name span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
