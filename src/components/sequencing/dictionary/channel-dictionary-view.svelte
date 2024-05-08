<svelte:options immutable={true} />

<script lang="ts">
  import type { ChannelDictionary, Telemetry } from '@nasa-jpl/aerie-ampcs';
  import ChannelView from './channel-view.svelte';

  export let channelDictionary: ChannelDictionary;

  let telemetry: Telemetry | null;
  let telemetries: Telemetry[] = [];
  let filteredTelemetries: Telemetry[] = [];
  let channelFilter: string = '';
  let includeDerived = false;

  $: {
    telemetries = channelDictionary.telemetries.slice().sort((a, b) => a.name.localeCompare(b.name));
  }

  $: {
    filteredTelemetries = telemetries.slice();
    if (!includeDerived) {
      filteredTelemetries = filteredTelemetries.filter(t => t.channel_derivation === 'None');
    }
    if (channelFilter) {
      try {
        const stemRegExp: RegExp | null = new RegExp(channelFilter, 'ig');
        filteredTelemetries = filteredTelemetries.filter(param => stemRegExp.test(param.name));
      } catch {
        // user entered invalid regexp
        const upperCaseFilter = channelFilter.toUpperCase();
        filteredTelemetries = filteredTelemetries.filter(param => param.name.includes(upperCaseFilter));
      }
    }
  }
</script>

<div>
  <label for="channelFilterInput">Channel Filter</label>
  <input id="channelFilterInput" bind:value={channelFilter} />
  <input id="derivedChannelCheck" type="checkbox" bind:checked={includeDerived} />
  <label for="derivedChannelCheck">Include Derived</label>
</div>
<div class="detail-view" role="listbox">
  {#each filteredTelemetries as channel}
    <a on:click={() => (telemetry = channel)} href="#parcel">
      <div class={telemetry === channel ? 'selected' : undefined}>
        {channel.name}
      </div>
    </a>
  {/each}
</div>
<hr />
{#if telemetry}
  <ChannelView {telemetry} />
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
