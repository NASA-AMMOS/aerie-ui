<script lang="ts">
  // NOTE: this does NOT refresh/clear/reset if the database is cleared or restarted! So stuff from the old database just lingers around...to clear it, just press dismiss

  import LightningCharge from 'bootstrap-icons/icons/lightning-charge.svg?component';
  import XIcon from 'bootstrap-icons/icons/x.svg?component';
  import { createEventDispatcher } from 'svelte';
  import type { UserSeenEntry } from '../../types/external-source';
  import Collapse from '../Collapse.svelte';

  export let deleted: boolean = false;
  export let sources: UserSeenEntry[] = [];

  const dispatch = createEventDispatcher<{
    dismiss: void;
  }>();
  let mappedSources: { [sourceType: string]: { [derivationGroup: string]: UserSeenEntry[] } } = {};

  $: sources.forEach(source => {
    let sourceType = source.source_type_name;
    let derivationGroup = source.derivation_group_name;
    if (sourceType && derivationGroup) {
      if (mappedSources[sourceType] && mappedSources[sourceType][derivationGroup]) {
        mappedSources[sourceType][derivationGroup]?.push(source);
      } else if (mappedSources[sourceType] && !mappedSources[sourceType][derivationGroup]) {
        mappedSources[sourceType][derivationGroup] = [source];
      } else if (!mappedSources[sourceType]) {
        mappedSources[sourceType] = { [derivationGroup]: [source] };
      }
    }
  });
</script>

<div
  class="card st-typography-label"
  style="--border-color: {deleted ? 'rgba(152, 35, 35, 0.5)' : 'rgba(152, 101, 35, 0.5)'}"
>
  <div
    class="card--row card--title-row"
    style=" background: {deleted ? 'rgb(254, 234, 234)' : 'rgb(254, 252, 234)'};display:flex"
  >
    <div
      class="card--title t-typography-medium"
      style=" align-items: center; display: flex; gap: 5px;padding-left:5px; width: 100%"
    >
      <LightningCharge
        class="filter-search-icon"
        style="color: {deleted ? 'rgba(152, 35, 35, 0.5)' : 'rgba(152, 101, 35, 0.5)'}"
      />
      {#if sources.length === 1 && !deleted}
        1 new file has been uploaded
      {:else if sources.length === 1 && deleted}
        1 file has been deleted
      {:else if deleted}
        {sources.length} files have been deleted
      {:else}
        {sources.length} new files have been uploaded
      {/if}
    </div>
    <slot name="right">
      <button class="st-button icon fs-6" on:click={() => dispatch('dismiss')}>
        <XIcon />
      </button>
    </slot>
  </div>
  <div style="padding: 4px 14px 12px;">
    <div class="card--row" style="padding-top: 5px">
      <span class="st-typography-body">
        {!deleted
          ? 'New files matching source types and derivation groups in the current plan:'
          : 'Deleted files organized by source type and derivation group:'}
      </span>
    </div>
    <div class="card--body st-typography-body">
      {#each Object.keys(mappedSources) as sourceType}
        <Collapse title={sourceType} tooltipContent={'Source Type'} defaultExpanded={true}>
          {#each Object.keys(mappedSources[sourceType]) as derivationGroup}
            <Collapse title={derivationGroup} tooltipContent={'Derivation Group'} defaultExpanded={true}>
              {#each mappedSources[sourceType][derivationGroup] as source}
                <div class="card--source-info">
                  <p
                    style="flex-shrink: 1; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap"
                  >
                    {source.key}
                  </p>
                  <!-- <p
                    style=" color: gray;flex-shrink: 0; margin-left: auto; padding-right: 0.25rem; padding-top: 0.1rem; white-space: nowrap"
                  >
                    {getTimeAgo(new Date(source.change_date), new Date(), Number.MAX_SAFE_INTEGER)}
                  </p> -->
                </div>
              {/each}
            </Collapse>
          {/each}
        </Collapse>
      {/each}
    </div>
    <div style="padding-top:5px">
      <button
        class="st-button secondary hover-fix"
        style="border: 0px; width: 100px"
        on:click={() => dispatch('dismiss')}>Dismiss</button
      >
    </div>
    <slot />
  </div>
</div>

<style>
  .card {
    background: var(--bg-color, rgba(245, 245, 245, 0.35));
    border: 1px solid var(--border-color, rgba(152, 101, 35, 0.5));
    border-radius: 4px;
    color: var(--st-gray-70);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    /* padding: 4px 14px 12px; */
    text-align: left;
  }

  .card--row {
    align-items: center;
    display: flex;
    justify-content: space-between;
    min-height: 24px;
    width: 100%;
  }

  .card--title-row {
    background: var(--title-bg-color, rgb(254, 252, 234));
    padding: 4px 0px;
  }

  .card--title {
    color: var(--st-gray-80);
    line-height: 24px;
  }

  .card--body {
    color: var(--st-gray-70);
    padding: 4px 0px;
  }

  .card--source-info {
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    white-space: nowrap;
  }

  .hover-fix {
    background-color: rgb(235, 235, 235);
  }

  .hover-fix:hover {
    background-color: rgb(225, 225, 225) !important;
  }
</style>
