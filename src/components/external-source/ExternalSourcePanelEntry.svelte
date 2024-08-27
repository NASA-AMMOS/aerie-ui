<svelte:options immutable={true} />

<script lang="ts">
  import Eye from 'bootstrap-icons/icons/eye-fill.svg?component';
  import EyeSlash from 'bootstrap-icons/icons/eye-slash.svg?component';
  import { externalSources, planDerivationGroupNamesToFilter } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import { plugins } from '../../stores/plugins';
  import { originalView, view, viewUpdateFilteredDerivationGroupIds } from '../../stores/views';
  import type { User } from '../../types/app';
  import type { DerivationGroup, ExternalSourceSlim } from '../../types/external-source';
  import type { View } from '../../types/view';
  import effects from '../../utilities/effects';
  import { formatDate } from '../../utilities/time';
  import { tooltip } from '../../utilities/tooltip';
  import Collapse from '../Collapse.svelte';

  export let derivationGroup: DerivationGroup;
  export let user: User | null;

  let dgInFilter: boolean = false;
  let relevantSources: ExternalSourceSlim[] = [];
  let enabled: boolean = true;

  // to check if the group is enabled, first check if our store has any entries, if not, check if the view does, otherwise we are enabled
  {
    enabled =
    $plan !== null && $planDerivationGroupNamesToFilter[$plan.id] !== undefined
      ? !$planDerivationGroupNamesToFilter[$plan.id].includes(derivationGroup.name)
      : $originalView !== null && $originalView?.definition.plan.filteredDerivationGroups !== null 
        ? $originalView?.definition.plan.filteredDerivationGroups.includes(derivationGroup.name)
        : true; 

    // on change, update the view (may not be saved), and update the store. so on refresh reverts to view, on panel change its ok.
    // in any case, however, should make sure the view knows of any discrepancies in the case of enabled being true here if its not in the view
    if ($plan) {
      viewUpdateFilteredDerivationGroupIds($planDerivationGroupNamesToFilter[$plan.id]);
    }
  }
  let currentView: View | null = null;

  $: relevantSources = $externalSources.filter(source => derivationGroup.name === source.pkey.derivation_group_name);
  // $: {
  //   // Ensure the current derivation group in the filter list if it has been disabled
  //   // Ensure the current derivation group is NOT in the filter list if it has been enabled
  //   if ($plan) {
  //     console.log("reevaluating...")
  //     enabled =
  //       $plan.id !== null && planDerivationGroupNamesToFilterParsed[$plan.id] !== undefined
  //         ? !planDerivationGroupNamesToFilterParsed[$plan.id].includes(derivationGroup.name)
  //         : true;
  //     if (enabled) {
  //       if (dgInFilter) {
  //         if (!planDerivationGroupNamesToFilterParsed[$plan.id]) {
  //           planDerivationGroupNamesToFilterParsed[$plan.id] = [];
  //         } else {
  //           planDerivationGroupNamesToFilterParsed[$plan.id] = planDerivationGroupNamesToFilterParsed[$plan.id].filter(
  //             id => id !== derivationGroup.name,
  //           );
  //         }
  //         let update = planDerivationGroupNamesToFilterParsed[$plan.id];
  //         planDerivationGroupNamesToFilter.set(JSON.stringify(planDerivationGroupNamesToFilterParsed));
  //         console.log("HERE!", planDerivationGroupNamesToFilterParsed, $planDerivationGroupNamesToFilter);
  //         viewUpdateFilteredDerivationGroupIds(update);
  //       }
  //     } else {
  //       if (!dgInFilter) {
  //         if (!planDerivationGroupNamesToFilterParsed[$plan.id]) {
  //           planDerivationGroupNamesToFilterParsed[$plan.id] = [derivationGroup.name];
  //         } else if (!planDerivationGroupNamesToFilterParsed[$plan.id].includes(derivationGroup.name)) {
  //           planDerivationGroupNamesToFilterParsed[$plan.id] = planDerivationGroupNamesToFilterParsed[$plan.id].concat(
  //             derivationGroup.name,
  //           );
  //         }
  //         let update = planDerivationGroupNamesToFilterParsed[$plan.id];
  //         planDerivationGroupNamesToFilter.set(JSON.stringify(planDerivationGroupNamesToFilterParsed));
  //         console.log("HERE! (2)", planDerivationGroupNamesToFilterParsed, $planDerivationGroupNamesToFilter);
  //         viewUpdateFilteredDerivationGroupIds(update);
  //       }
  //     }
  //   }
  // }

  originalView.subscribe(ov => {
    // Any time a new view is selected, change the enabled list, and reset the store
    if (ov) {
      if (currentView === null) {
        currentView = ov;
      }
      // Check if the 'new' view is actually the old view, if so don't do anything
      /**
       * This is required because this will trigger when associating or de-associating
       *  a derivation group with a plan - though the actual 'view' will not be
       *  changed from these actions, which could lead to improperly resetting visibility.
       */
      if (ov !== currentView) {
        console.log("resetting... for view")
        if (ov?.definition.plan.filteredDerivationGroups.includes(derivationGroup.name)) {
          enabled = false;
        } else {
          enabled = true;
        }
        currentView = ov;
      }
    }
  });

  function onChange() {
    console.log("HERE!!!")
    if ($plan) {
      enabled = !enabled;
      dgInFilter = $planDerivationGroupNamesToFilter[$plan.id].includes(derivationGroup.name);
      if (!enabled) {
        if (!$planDerivationGroupNamesToFilter[$plan.id]) {
          planDerivationGroupNamesToFilter.update((pdgntf) => {
            pdgntf[$plan.id] = [derivationGroup.name];
            return pdgntf;
          });
        } else {
          planDerivationGroupNamesToFilter.update((pdgntf) => {
            pdgntf[$plan.id].push(derivationGroup.name);
            return pdgntf;
          });
        }
      }
      else {
        if (!$planDerivationGroupNamesToFilter[$plan.id]) {
          planDerivationGroupNamesToFilter.update((pdgntf) => {
            pdgntf[$plan.id] = [];
            return pdgntf;
          });
        } else {
          planDerivationGroupNamesToFilter.update((pdgntf) => {
            pdgntf[$plan.id] = pdgntf[$plan.id].filter(id => id !== derivationGroup.name);
            return pdgntf;
          });
        }
      }
      console.log($planDerivationGroupNamesToFilter[$plan.id]);
      console.log("view prev", $view?.definition.plan.filteredDerivationGroups);
      viewUpdateFilteredDerivationGroupIds($planDerivationGroupNamesToFilter[$plan.id]);
      console.log("view after", $view?.definition.plan.filteredDerivationGroups);
    }
  }

  async function deleteEmptyDerivationGroup() {
    if (enabled) {
      // Delete plan derivation group association
      await effects.deleteDerivationGroupForPlan(derivationGroup.name, $plan, user);
    }
    // Delete the derivation group itself
    await effects.deleteDerivationGroup(derivationGroup.name, user);
  }
</script>

<div class="external-source-pairing">
  <Collapse
    title={derivationGroup.name}
    tooltipContent={'Derivation group ' + derivationGroup.name}
    defaultExpanded={false}
  >
    <span slot="right" style:display="flex">
      <p class="derived-event-text">
        {derivationGroup.derived_event_total} derived events
      </p>
      {#if enabled === true}
        <button
          class="st-button icon"
          on:click|stopPropagation={onChange}
          use:tooltip={{ content: 'Show in timeline', placement: 'top' }}
        >
          <Eye style="color: rgba(143, 143, 143, 1)" />
        </button>
      {:else}
        <button
          class="st-button icon"
          on:click|stopPropagation={onChange}
          use:tooltip={{ content: 'Hide in timeline', placement: 'top' }}
        >
          <EyeSlash style="color: rgba(143, 143, 143, 0.5)" />
        </button>
      {/if}
    </span>

    {#if relevantSources.length}
      {#each relevantSources as source}
        <!-- Collapsible details -->
        <Collapse title={source.pkey.key} tooltipContent={source.pkey.key} defaultExpanded={false}>
          <span slot="right">
            <p style:color="gray" style:text-wrap="nowrap">
              {derivationGroup.sources.get(source.pkey.key)?.event_counts} events
            </p>
          </span>
          <p>
            <strong>Key:</strong>
            {source.pkey.key}
          </p>

          <p>
            <strong>Source Type:</strong>
            {source.source_type_name}
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
    text-wrap: nowrap;
  }
</style>
