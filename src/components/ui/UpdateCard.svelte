<script lang="ts">
  import LightningCharge from 'bootstrap-icons/icons/lightning-charge.svg?component';
  import XIcon from 'bootstrap-icons/icons/x.svg?component';
  import { createEventDispatcher } from 'svelte';
  import type { ExternalSourceWithResolvedNames } from '../../types/external-source';
  import { getTimeAgo } from '../../utilities/time';
  import Collapse from '../Collapse.svelte';

  export let newSources: ExternalSourceWithResolvedNames[] = [];

  const dispatch = createEventDispatcher<{
    dismiss: void;
  }>();
  let mappedSources: { [sourceType: string]: {[derivationGroup: string]: ExternalSourceWithResolvedNames[]} } = {};

  $: newSources.forEach(source => {
    let sourceType = source.source_type;
    let derivationGroup = source.derivation_group;
    if (sourceType && derivationGroup) {
      if (mappedSources[sourceType] && mappedSources[sourceType][derivationGroup]) { 
        mappedSources[sourceType][derivationGroup]?.push(source)
      }
      else if (mappedSources[sourceType] && !mappedSources[sourceType][derivationGroup]){
        mappedSources[sourceType][derivationGroup] = [source]
      }
      else if (!mappedSources[sourceType]){
        mappedSources[sourceType] = {[derivationGroup]: [source]}
      }
    }
  })

  function formatDateTime(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  }
</script>

<div class="card st-typography-label">
  <div class="card--row card--title-row" style="display:flex;">
    <div class="card--title t-typography-medium" style="padding-left:5px; align-items: center; display: flex; width: 100%; gap: 5px">
      <LightningCharge class="filter-search-icon" style="color:rgba(152, 101, 35, 0.5); "/>{newSources.length} new files have been uploaded
    </div>
    <slot name="right">
      <button class="st-button icon fs-6" on:click={() => dispatch("dismiss")}>
        <XIcon />
      </button>
    </slot>
  </div>
  <div style="padding: 4px 14px 12px;">
    <div class="card--row" style="padding-top: 5px">
      <span class="st-typography-body">
        New files matching source types in the current plan
      </span>
    </div>
    <div class="card--body st-typography-body">
      {#each Object.keys(mappedSources) as sourceType}
        <Collapse title={sourceType} tooltipContent={sourceType} defaultExpanded={false}>
          {#each Object.keys(mappedSources[sourceType]) as derivationGroup}
            <Collapse title={derivationGroup} tooltipContent={derivationGroup} defaultExpanded={false}>
              {#each mappedSources[sourceType][derivationGroup] as source}
                <div class="card--row">
                  <div class="card--metadata-row">
                      <div class="card--date">
                        <span class="st-typography-body">
                          <p>{source.key}</p>
                        </span>
                        <span class="card--date-time-ago">
                          <!-- {getTimeAgo(new Date(date), new Date(), Number.MAX_SAFE_INTEGER)} -->
                          <p style:float="left" style:padding-top="0.1rem" style:padding-right="0.25rem" style:color="gray">
                            {getTimeAgo(new Date(source.created_at), new Date(), Number.MAX_SAFE_INTEGER)}
                          </p>
                        </span>
                      </div>
                  </div>
                </div>
              {/each}
            </Collapse>
          {/each}
        </Collapse>
      {/each}
    </div>
    <div style="padding-top:5px">
      <button style="border: 0px; width: 100px; background: rgb(235, 235, 235)" on:click={() => dispatch("dismiss")}>Dismiss</button>
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

  .card--metadata-row {
    display: flex;
  }

  .card--title {
    color: var(--st-gray-80);
    line-height: 24px;
  }

  .card--date {
    display: flex;
    gap: 20px;
  }

  .card--date-time-ago {
    color: var(--st-gray-50);
  }

  .card--body {
    color: var(--st-gray-70);
    padding: 4px 0px;
  }
</style>
