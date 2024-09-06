<svelte:options immutable={true} />

<script lang="ts">
  import Eye from 'bootstrap-icons/icons/eye-fill.svg?component';
  import EyeSlash from 'bootstrap-icons/icons/eye-slash.svg?component';
  import { externalSources, planDerivationGroupLinks } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import { plugins } from '../../stores/plugins';
  import type { User } from '../../types/app';
  import type { DerivationGroup, ExternalSourceSlim } from '../../types/external-source';
  import effects from '../../utilities/effects';
  import { formatDate } from '../../utilities/time';
  import { tooltip } from '../../utilities/tooltip';
  import Collapse from '../Collapse.svelte';

  export let derivationGroup: DerivationGroup;
  export let user: User | null;

  let relevantSources: ExternalSourceSlim[] = [];

  $: enabled =
    ($plan !== null &&
      $planDerivationGroupLinks.find(a => a.derivation_group_name === derivationGroup.name && a.plan_id === $plan.id)
        ?.enabled) ??
    true;
  $: relevantSources = $externalSources.filter(source => derivationGroup.name === source.pkey.derivation_group_name);

  function onChange() {
    effects.updatePlanDerivationGroupEnabled(derivationGroup.name, $plan, !enabled, user);
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
