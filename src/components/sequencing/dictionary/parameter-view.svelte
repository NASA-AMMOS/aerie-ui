<svelte:options immutable={true} />

<script lang="ts">
  import {
    isParameterEnum,
    isParameterFloat,
    isParameterInteger,
    isParameterString,
    isParameterUnsigned,
    type Parameter,
  } from '@nasa-jpl/aerie-ampcs';

  export let param: Parameter;
</script>

<div class="param-info">
  <div>Parameter</div>
  <div>{param.param_name}</div>
  <div>Type</div>
  <div>{param.param_type}</div>
  <div>ID</div>
  <div>{param.param_id}</div>
  {#if param.parameter_group}
    <div>Group</div>
    <div>{param.parameter_group}</div>
  {/if}
  <div>Description</div>
  <div>{param.description}</div>
  <div>Rationale</div>
  <div>{param.rationale}</div>
  {#if param.default_value}
    <div>Default Value</div>
    <div>{param.default_value}</div>
  {/if}
  {#if isParameterFloat(param) || isParameterInteger(param) || isParameterUnsigned(param) || isParameterEnum(param)}
    {#if param.bit_length}
      <div>Bit Length</div>
      <div>{param.bit_length}</div>
    {/if}
    {#if param.units}
      <div>Units</div>
      <div>{param.units}</div>
    {/if}
    {#if param.range}
      <div>Range</div>
      <div>{`[${param.range.min}, ${param.range.max}]`}</div>
    {/if}
  {:else if isParameterString(param)}
    {#if param.max_bit_length}
      <div>Max Bit Length</div>
      <div>{param.max_bit_length}</div>
    {/if}
  {/if}
</div>

<style>
  .param-info {
    display: grid;
    grid-template-columns: 130px 1fr;
    overflow: scroll;
    width: 100%;
  }

  .param-info > div:nth-child(odd)::after {
    content: ':';
  }
</style>
