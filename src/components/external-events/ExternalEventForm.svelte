<svelte:options immutable={true} />

<script lang="ts">
  import { externalSources, getSourceName } from '../../stores/external-source';
  import { plugins } from '../../stores/plugins';
  import type { ExternalEventDB } from '../../types/external-event';
  import type { Property } from '../../types/property';
  import { classNames } from '../../utilities/generic';
  import { formatDate } from '../../utilities/time';
  import Collapse from '../Collapse.svelte';
  import Input from '../form/Input.svelte';
  import DatePicker from '../ui/DatePicker/DatePicker.svelte';
  import Highlight from '../ui/Highlight.svelte';
  import Properties from './Properties.svelte';

  export let externalEvent: ExternalEventDB;
  export let showHeader: boolean = true;

  let editable: boolean = false;
  let formProperties: Property[] = [];
  $: formProperties = Object.entries(externalEvent.properties).map(e => {
    return {
      name: e[0],
      value: e[1],
    };
  });
  let highlightKeysMap: Record<string, boolean> = {};
</script>

<div class="external-event-form-container">
  {#if showHeader}
    <div class="external-event-header">
      <div class={classNames('external-event-header-title')}>
        <div class="external-event-header-title-value st-typography-medium">
          {externalEvent.key}
        </div>
      </div>
    </div>
  {/if}

  <div class="external-event-form">
    <fieldset>
      <Collapse title="Definition">
        <Highlight highlight={highlightKeysMap.id}>
          <Input layout="inline">
            ID
            <input class="st-input w-100" disabled={!editable} name="id" value={externalEvent.id} />
          </Input>
        </Highlight>

        <Highlight highlight={highlightKeysMap.type}>
          <Input layout="inline">
            Type
            <input
              class="st-input w-100"
              disabled={!editable}
              name="event-type"
              value={externalEvent.event_type_name}
            />
          </Input>
        </Highlight>

        <Highlight highlight={highlightKeysMap.start_offset}>
          <Input layout="inline">
            Start Time (UTC)
            <DatePicker
              dateString={`${formatDate(new Date(externalEvent.start_time), $plugins.time.primary.format)}`}
              disabled={!editable}
              name="start-time"
            />
          </Input>
        </Highlight>

        <Highlight highlight={highlightKeysMap.start_offset}>
          <Input layout="inline">
            Duration
            <input class="st-input w-100" disabled={!editable} name="duration" value={externalEvent.duration} />
          </Input>
        </Highlight>

        <Highlight highlight={highlightKeysMap.last_modified_by}>
          <Input layout="inline">
            Source ID
            <input class="st-input w-100" disabled={!editable} name="source-id" value={externalEvent.source_id} />
          </Input>
        </Highlight>

        <Highlight highlight={highlightKeysMap.last_modified_by}>
          <Input layout="inline">
            Source File
            <input
              class="st-input w-100"
              disabled={!editable}
              name="source-id-resolved"
              value={getSourceName(externalEvent.source_id, $externalSources)}
            />
          </Input>
        </Highlight>
      </Collapse>
    </fieldset>

    <fieldset>
      <Collapse title={formProperties.length > 0 ? `Properties` : ''}>
        <Properties {formProperties} {highlightKeysMap} />
        {#if formProperties.length === 0}
          <div class="st-typography-label">No Properties Found</div>
        {/if}
      </Collapse>
    </fieldset>
  </div>
</div>

<style>
  .external-event-form-container {
    display: grid;
    grid-template-rows: min-content auto;
    height: 100%;
    overflow: hidden;
  }

  .external-event-form {
    overflow-y: auto;
  }

  .external-event-directive-definition {
    padding: 0.5rem;
  }

  .external-event-header {
    align-items: center;
    background: var(--st-gray-10);
    border-bottom: 1px solid var(--st-gray-15);
    display: flex;
    flex-shrink: 0;
    font-style: italic;
    padding: 4px 8px;
    padding-left: 8px;
  }

  .external-event-header-icons {
    align-items: center;
    display: flex;
  }

  .external-event-error-rollup {
    display: inline;
    font-style: normal;
  }

  .external-event-header-title-placeholder,
  .external-event-header-title-value {
    word-break: break-word;
  }

  .external-event-header-title-value {
    overflow: hidden;
    padding: 4px 0px;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: break-all;
  }

  .external-event-header-title-placeholder {
    padding: 4px 8px;
  }

  .external-event-header-title {
    align-items: flex-start;
    border-radius: 4px;
    display: flex;
    width: 100%;
  }

  .external-event-header-title :global(fieldset) {
    padding: 0;
    width: 100%;
  }

  .external-event-header-title-edit-button:hover {
    background-color: var(--st-white);
  }

  .external-event-header-title--editing {
    gap: 8px;
    padding: 0;
    width: 100%;
  }

  .external-event-header-changelog {
    border: 1px solid transparent;
    display: flex;
    width: 24px;
  }

  .external-event-header-changelog:hover {
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
