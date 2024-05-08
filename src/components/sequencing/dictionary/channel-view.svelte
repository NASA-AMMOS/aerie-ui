<svelte:options immutable={true} />

<script lang="ts">
  import type { Telemetry } from '@nasa-jpl/aerie-ampcs';

  export let telemetry: Telemetry;
</script>

<div class="channel-info">
  <div>Channel</div>
  <div>{telemetry.name}</div>
  <div>Abbreviation</div>
  <div>{telemetry.abbreviation}</div>
  {#if telemetry.measurement_id}
    <div>Measurement Id</div>
    <div>{telemetry.measurement_id}</div>
  {/if}
  <div>Derivation</div>
  <div>{telemetry.channel_derivation}</div>
  <div>Description</div>
  <div>{telemetry.description}</div>
  {#if telemetry.group_name}
    <div>Group</div>
    <div>{telemetry.group_name}</div>
  {/if}
  <div>Type</div>
  <div>{telemetry.type}</div>
</div>

<style>
  .channel-info {
    display: grid;
    grid-template-columns: 130px 1fr;
    overflow: scroll;
    width: 100%;
  }

  .channel-info > div:nth-child(odd)::after {
    content: ':';
  }
</style>
