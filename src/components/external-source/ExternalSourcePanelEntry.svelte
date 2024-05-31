<svelte:options immutable={true} />

<script lang="ts">
  import type { User } from '../../types/app';
  import type { ExternalSourceSlim } from '../../types/external-source';
  import effects from '../../utilities/effects';
  import Collapse from '../Collapse.svelte';

  export let enabled: boolean;
  export let externalSource: ExternalSourceSlim;
  export let plan_id: number | undefined;
  export let user: User | null;

  function onEnable(event: Event) {
    if (enabled) {
      // insert
      effects.insertExternalSourceForPlan(externalSource.id, plan_id, user);
    }
    else {
      // delete
      effects.deleteExternalSourceForPlan(externalSource.id, plan_id, user);
    }
  }
</script>

<div class="external-source-pairing">
  <Collapse title={externalSource.key} tooltipContent={externalSource.key} defaultExpanded={false}>
    <span slot="left">
      <input
        type="checkbox"
        bind:checked={enabled}
        style:cursor="pointer"
        on:change={onEnable}
        on:click|stopPropagation
      />
    </span>

    <!-- Collapsible details -->
    <p>
      <strong>Key:</strong> {externalSource.key}
    </p>
    
    <p>
      <strong>Source Type:</strong> {externalSource.source_type}
    </p>

    <p>
      <strong>Start Time:</strong> {externalSource.start_time}
    </p>

    <p>
      <strong>End Time:</strong> {externalSource.end_time}
    </p>

    <p>
      <strong>ValidAt:</strong> {externalSource.valid_at}
    </p>
  </Collapse>
</div>

