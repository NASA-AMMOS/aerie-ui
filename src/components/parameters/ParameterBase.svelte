<svelte:options immutable={true} />

<script lang="ts">
  import type { ParameterType, SimpleFormParameter } from '../../types/parameter';
  import type { ActionArray } from '../../utilities/useActions';
  import ParameterBaseBoolean from './ParameterBaseBoolean.svelte';
  import ParameterBaseDuration from './ParameterBaseDuration.svelte';
  import ParameterBaseNumber from './ParameterBaseNumber.svelte';
  import ParameterBasePath from './ParameterBasePath.svelte';
  import ParameterBaseString from './ParameterBaseString.svelte';
  import ParameterBaseVariant from './ParameterBaseVariant.svelte';
  import ParameterInfo from './ParameterInfo.svelte';

  export let disabled: boolean = false;
  export let formParameter: SimpleFormParameter;
  export let hideRightAdornments: boolean = false;
  export let labelColumnWidth: number = 200;
  export let level: number = 0;
  export let levelPadding: number = 20;
  export let parameterType: ParameterType = 'activity';
  export let use: ActionArray = [];
</script>

<div class="parameter-container">
  {#if formParameter.schema.type === 'boolean'}
    <ParameterBaseBoolean
      {disabled}
      {hideRightAdornments}
      {labelColumnWidth}
      {level}
      {levelPadding}
      {formParameter}
      {parameterType}
      {use}
      on:change
      on:reset
    />
  {:else if formParameter.schema.type === 'duration'}
    <ParameterBaseDuration
      {disabled}
      hideValueSource={hideRightAdornments}
      {labelColumnWidth}
      {level}
      {levelPadding}
      {formParameter}
      {parameterType}
      {use}
      on:change
      on:reset
    />
  {:else if formParameter.schema.type === 'int'}
    <ParameterBaseNumber
      {hideRightAdornments}
      {disabled}
      {labelColumnWidth}
      {level}
      {levelPadding}
      {formParameter}
      {parameterType}
      {use}
      on:change
      on:reset
    />
  {:else if formParameter.schema.type === 'path'}
    <ParameterBasePath
      {hideRightAdornments}
      {labelColumnWidth}
      {level}
      {levelPadding}
      {formParameter}
      {parameterType}
      {use}
      on:change
      on:reset
    />
  {:else if formParameter.schema.type === 'real'}
    <ParameterBaseNumber
      {disabled}
      {hideRightAdornments}
      {labelColumnWidth}
      {level}
      {levelPadding}
      {formParameter}
      {parameterType}
      {use}
      on:change
      on:reset
    />
  {:else if formParameter.schema.type === 'string'}
    <ParameterBaseString
      {disabled}
      {hideRightAdornments}
      {labelColumnWidth}
      {level}
      {levelPadding}
      {formParameter}
      {parameterType}
      {use}
      on:change
      on:reset
    />
  {:else if formParameter.schema.type === 'variant'}
    <ParameterBaseVariant
      {disabled}
      {hideRightAdornments}
      {labelColumnWidth}
      {level}
      {levelPadding}
      {formParameter}
      {parameterType}
      {use}
      on:change
      on:reset
    />
  {/if}
  <div class="parameter-info">
    <ParameterInfo {formParameter} on:reset />
  </div>
</div>

<style>
  .parameter-container {
    align-items: center;
    box-sizing: border-box;
    column-gap: 4px;
    display: grid;
    grid-template-columns: auto 16px;
    padding: 4px 0;
  }

  .parameter-container:hover {
    border-bottom: 1px solid var(--st-gray-20, #ebecec);
    border-top: 1px solid var(--st-gray-20, #ebecec);
    padding: 3px 0;
  }

  .parameter-container:hover .parameter-info {
    visibility: visible;
  }

  .parameter-info {
    visibility: hidden;
  }
</style>
