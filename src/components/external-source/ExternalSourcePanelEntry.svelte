<svelte:options immutable={true} />

<script lang="ts">
  import Eye from 'bootstrap-icons/icons/eye-fill.svg?component';
  import EyeSlash from 'bootstrap-icons/icons/eye-slash.svg?component';
  import { externalSourceWithResolvedNames, planDerivationGroupIdsToFilter } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import { plugins } from '../../stores/plugins';
  import { originalView, viewUpdateFilteredDerivationGroupIds } from '../../stores/views';
  import type { User } from '../../types/app';
  import type { DerivationGroup, ExternalSourceWithResolvedNames } from '../../types/external-source';
  import effects from '../../utilities/effects';
  import { formatDate } from '../../utilities/time';
  import { tooltip } from '../../utilities/tooltip';
  import Collapse from '../Collapse.svelte';

  export let derivationGroup: DerivationGroup;
  export let user: User | null;

  let dgInFilter: boolean = false;
  let relevantSources: ExternalSourceWithResolvedNames[] = [];
  let planDerivationGroupIdsToFilterParsed: { [plan_id: number]: number[] } = JSON.parse(
    $planDerivationGroupIdsToFilter,
  );
  let enabled =
    $plan && planDerivationGroupIdsToFilterParsed[$plan.id]
      ? !planDerivationGroupIdsToFilterParsed[$plan.id].includes(derivationGroup.id)
      : true;

  $: planDerivationGroupIdsToFilterParsed = JSON.parse($planDerivationGroupIdsToFilter);
  $: relevantSources = $externalSourceWithResolvedNames.filter(
    source => derivationGroup.id === source.derivation_group_id,
  );
  $: {
    console.log(
      `[${derivationGroup.id}]: enabled=${enabled}, dgInFilter=${dgInFilter}, $plan=${$plan?.id}; ${planDerivationGroupIdsToFilterParsed[$plan?.id ?? -1000]}`,
    );
    // ensure the current derivation group in the filter list if it has been disabled
    // ensure the current derivation group is NOT in the filter list if it has been enabled
    if ($plan) {
      if (enabled) {
        if (dgInFilter) {
          if (!planDerivationGroupIdsToFilterParsed[$plan.id]) {
            planDerivationGroupIdsToFilterParsed[$plan.id] = [];
          } else {
            planDerivationGroupIdsToFilterParsed[$plan.id] = planDerivationGroupIdsToFilterParsed[$plan.id].filter(
              id => id !== derivationGroup.id,
            );
          }
          let update = planDerivationGroupIdsToFilterParsed[$plan.id];
          planDerivationGroupIdsToFilter.set(JSON.stringify(planDerivationGroupIdsToFilterParsed));
          viewUpdateFilteredDerivationGroupIds(update);
        }
      } else {
        if (!dgInFilter) {
          if (!planDerivationGroupIdsToFilterParsed[$plan.id]) {
            planDerivationGroupIdsToFilterParsed[$plan.id] = [derivationGroup.id];
          } else if (!planDerivationGroupIdsToFilterParsed[$plan.id].includes(derivationGroup.id)) {
            planDerivationGroupIdsToFilterParsed[$plan.id] = planDerivationGroupIdsToFilterParsed[$plan.id].concat(
              derivationGroup.id,
            );
          }
          let update = planDerivationGroupIdsToFilterParsed[$plan.id];
          planDerivationGroupIdsToFilter.set(JSON.stringify(planDerivationGroupIdsToFilterParsed));
          viewUpdateFilteredDerivationGroupIds(update);
        }
      }
    }
  }

  originalView.subscribe(ov => {
    // any time a new view is selected, change the enabled list
    if (ov) {
      if (ov?.definition.plan.filteredDerivationGroups.includes(derivationGroup.id)) {
        enabled = false;
      } else {
        enabled = true;
      }
    }
  });

  function onChange() {
    if ($plan) {
      dgInFilter = planDerivationGroupIdsToFilterParsed[$plan.id].includes(derivationGroup.id);
      enabled = !enabled;
    }
  }

  async function deleteEmptyDerivationGroup() {
    if (enabled) {
      // delete plan derivation group association
      await effects.deleteDerivationGroupForPlan(derivationGroup.id, $plan, user);
    }
    // delete the derivation group itself
    await effects.deleteDerivationGroup(derivationGroup.id, user);
  }
</script>

<div class="external-source-pairing">
  <Collapse
    title={derivationGroup.name}
    tooltipContent={'Derivation group ' + derivationGroup.name}
    defaultExpanded={false}
  >
    <span slot="right">
      <p
        class="derived-event-text"
      >
        {derivationGroup.derivedEventTotal} derived events
      </p>
      {#if enabled === true}
        <button
          class="st-button icon"
          on:click|stopPropagation={onChange}
          use:tooltip={{ content: 'Show in timeline', placement: 'top'}}
        >
          <Eye style="color: rgba(143, 143, 143, 1)"/>
        </button>
      {:else}
      <button
        class="st-button icon"
        on:click|stopPropagation={onChange}
        use:tooltip={{ content: 'Hide in timeline', placement: 'top'}}
      >
        <EyeSlash style="color: rgba(143, 143, 143, 0.5)"/>
      </button>
      {/if}
    </span>

    {#if relevantSources.length}
      {#each relevantSources as source}
        <!-- Collapsible details -->
        <Collapse title={source.key} tooltipContent={source.key} defaultExpanded={false}>
          <span slot="right">
            <p style:color="gray">
              {derivationGroup.sources.get(source.key)?.event_counts} events
            </p>
          </span>
          <p>
            <strong>Key:</strong>
            {source.key}
          </p>

          <p>
            <strong>Source Type:</strong>
            {source.source_type}
          </p>

          <p>
            <strong>Start Time:</strong>
            {formatDate(new Date(source.start_time), $plugins.time.primary.format)}
          </p>

          <p>
            <strong>End Time:</strong>
            {formatDate(new Date(source.end_time), $plugins.time.primary.format)}
          </p>

          <p>
            <strong>Valid At:</strong>
            {formatDate(new Date(source.valid_at), $plugins.time.primary.format)}
          </p>

          <p>
            <strong>Created At:</strong>
            {formatDate(new Date(source.created_at), $plugins.time.primary.format)}
          </p>
        </Collapse>
      {/each}
      <Collapse
        className="anchor-collapse"
        defaultExpanded={false}
        title="Event Types"
        tooltipContent="View Contained Event Types"
      >
        {#each derivationGroup.event_types as eventType}
          <i>{eventType}</i>
        {/each}
      </Collapse>
    {:else}
      <!--This should be impossible, as the derivation group should have been deleted by this point. Just in case... we offer a delete button here.-->
      <p>No sources in this group.</p>
      <button name="delete-dg" class="st-button secondary" on:click|stopPropagation={deleteEmptyDerivationGroup}>
        Delete Empty Derivation Group
      </button>
    {/if}
  </Collapse>
</div>

<style>
  .derived-event-text {
    align-items: center;
    color: gray;
    display: flex;
    float: left;
    height: 100%;
    padding-right: 0.25rem;

  }
</style>
