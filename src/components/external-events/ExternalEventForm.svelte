<svelte:options immutable={true} />

<script lang="ts">
  import type { ExternalEventDB, ExternalEventId } from '../../types/external-event';
  import type { Property } from '../../types/property';
  import { classNames } from '../../utilities/generic';
  import Collapse from '../Collapse.svelte';
  import Input from '../form/Input.svelte';
  import DatePicker from '../ui/DatePicker/DatePicker.svelte';
  import Highlight from '../ui/Highlight.svelte';
  import Properties from './Properties.svelte';

  export let externalEvent: ExternalEventId;
  export let externalEvents: ExternalEventDB[];
  export let showHeader: boolean = true;

  let event: ExternalEventDB;
  $: event = externalEvents.filter(e => e.id == externalEvent)[0]

  let editable: boolean = false;
  let formProperties: Property[] = [];
  $: formProperties = Object.entries(event.properties).map(e => {
    return {
      name: e[0],
      value: e[1]
    }
  })
  let highlightKeysMap: Record<string, boolean> = {};
  let parametersWithErrorsCount: number = 0;
</script>

<div class="activity-form-container">
  {#if showHeader}
    <div class="activity-header">
      <div class={classNames('activity-header-title')}>
        <div class="activity-header-title-value st-typography-medium">
          {event.key}
        </div>
      </div>
    </div>
  {/if}

  <div class="activity-form">
    <fieldset>
      <Collapse title="Definition">
        <Highlight highlight={highlightKeysMap.id}>
          <Input layout="inline">
            <!-- <label use:tooltip={{ content: 'Activity ID', placement: 'top' }} for="id"> ID</label> -->
            ID
            <input class="st-input w-100" disabled={!editable} name="id" value={event.id} />
          </Input>
        </Highlight>

        <Highlight highlight={highlightKeysMap.type}>
          <Input layout="inline">
            <!-- <label use:tooltip={{ content: 'Activity Type', placement: 'top' }} for="activity-type"> -->
              Type
            <!-- </label> -->
            <input class="st-input w-100" disabled={!editable} name="event-type" value={event.event_type} />
          </Input>
        </Highlight>

        <Highlight highlight={highlightKeysMap.start_offset}>
          <Input layout="inline">
            Start Time (UTC)
            <DatePicker
              dateString={event.start_time}
              disabled={!editable}
              name="start-time"
            />
          </Input>
        </Highlight>

        <Highlight highlight={highlightKeysMap.start_offset}>
          <Input layout="inline">
            Duration
            <input class="st-input w-100" disabled={!editable} name="duration" value={event.duration} />
          </Input>
        </Highlight>

        <Highlight highlight={highlightKeysMap.last_modified_by}>
          <Input layout="inline">
            Source File ID
            <input class="st-input w-100" disabled={!editable} name="source-id" value={event.source_id} />
          </Input>
        </Highlight>
      </Collapse>
    </fieldset>

    <fieldset>
      <Collapse
        title={formProperties.length > 0 ? `Properties` : ''}
      >
        <Properties
          {formProperties}
          {highlightKeysMap}
        />
        {#if formProperties.length === 0}
          <div class="st-typography-label">No Properties Found</div>
        {/if}
      </Collapse>
    </fieldset>
  </div>
</div>

<style>
  .activity-form-container {
    display: grid;
    grid-template-rows: min-content auto;
    height: 100%;
    overflow: hidden;
  }

  .activity-form {
    overflow-y: auto;
  }

  .activity-form fieldset:last-child {
    padding-bottom: 16px;
  }

  .activity-directive-definition {
    padding: 0.5rem;
  }

  .activity-header {
    align-items: center;
    background: var(--st-gray-10);
    border-bottom: 1px solid var(--st-gray-15);
    display: flex;
    flex-shrink: 0;
    font-style: italic;
    padding: 4px 8px;
    padding-left: 8px;
  }

  .activity-header-icons {
    align-items: center;
    display: flex;
  }

  .activity-error-rollup {
    display: inline;
    font-style: normal;
  }

  .activity-header-title-placeholder,
  .activity-header-title-value {
    word-break: break-word;
  }

  .activity-header-title-value {
    overflow: hidden;
    padding: 4px 0px;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: break-all;
  }

  .activity-header-title-placeholder {
    padding: 4px 8px;
  }

  .activity-header-title {
    align-items: flex-start;
    border-radius: 4px;
    display: flex;
    width: 100%;
  }

  .activity-header-title :global(fieldset) {
    padding: 0;
    width: 100%;
  }

  .activity-header-title-edit-button:hover {
    background-color: var(--st-white);
  }

  .activity-header-title--editing {
    gap: 8px;
    padding: 0;
    width: 100%;
  }

  .activity-header-changelog {
    border: 1px solid transparent;
    display: flex;
    width: 24px;
  }

  .activity-header-changelog:hover {
    color: #007bff;
  }

  .revision-preview-header {
    align-items: center;
    background-color: #e6e6ff;
    border-bottom: 1px solid #c4c6ff;
    border-top: 1px solid #c4c6ff;
    display: flex;
    flex-shrink: 0;
    justify-content: space-between;
    padding: 4px 8px;
    padding-left: 8px;
  }

  .annotations {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
