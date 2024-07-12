<script lang="ts">
  import LightningCharge from 'bootstrap-icons/icons/lightning-charge.svg?component';
  import XIcon from 'bootstrap-icons/icons/x.svg?component';
  import { createEventDispatcher } from 'svelte';
  import type { ExternalSourceWithDateInfo } from '../../types/external-source';
  import { getTimeAgo } from '../../utilities/time';
  import Collapse from '../Collapse.svelte';

  export let deleted: boolean = false;
  export let sources: ExternalSourceWithDateInfo[] = [];

  const dispatch = createEventDispatcher<{
    dismiss: void;
  }>();
  let mappedSources: { [sourceType: string]: {[derivationGroup: string]: ExternalSourceWithDateInfo[]} } = {};

  $: sources.forEach(source => {
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
</script>

<div class="card st-typography-label" style="--border-color: {deleted ? "rgba(152, 35, 35, 0.5)" : "rgba(152, 101, 35, 0.5)"}">
  <div class="card--row card--title-row" style="display:flex; background: {deleted ? "rgb(254, 234, 234)" : "rgb(254, 252, 234)"}">
    <div class="card--title t-typography-medium" style="padding-left:5px; align-items: center; display: flex; width: 100%; gap: 5px">
      <LightningCharge class="filter-search-icon" style="color: {deleted ? "rgba(152, 35, 35, 0.5)" : "rgba(152, 101, 35, 0.5)"}"/>
      {#if sources.length == 1 && !deleted} 1 new file has been uploaded
      {:else if sources.length == 1 && deleted} 1 file has been deleted
      {:else if deleted} {sources.length} files have been deleted
      {:else} {sources.length} new files have been uploaded
      {/if}
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
        {!deleted ? "New files matching source types and derivation groups in the current plan:" : "Deleted files organized by source type and derivation group:"} 
      </span>
    </div>
    <div class="card--body st-typography-body">
      {#each Object.keys(mappedSources) as sourceType}
        <Collapse title={sourceType} tooltipContent={"Source Type"} defaultExpanded={false}>
          {#each Object.keys(mappedSources[sourceType]) as derivationGroup}
            <Collapse title={derivationGroup} tooltipContent={"Derivation Group"} defaultExpanded={false}>
              {#each mappedSources[sourceType][derivationGroup] as source}
                <div class="card--row">
                  <div class="card--metadata-row">
                      <div class="card--date">
                        <span class="st-typography-body">
                          <!--TODO: figure out how to make this go "..." so that we can always see getTimeAgo below-->
                          <p>{source.key}</p>
                        </span>
                        <span class="card--date-time-ago">
                          <p style:float="left" style:padding-top="0.1rem" style:padding-right="0.25rem" style:color="gray">
                            {getTimeAgo(new Date(source.change_date),new Date(), Number.MAX_SAFE_INTEGER)}
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
    /* border: 1px solid var(--border-color, rgba(152, 35, 35, 0.5));  // if deleted */
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
    /* background: var(--title-bg-color, rgb(254, 234, 234)); // if deleted  */
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
