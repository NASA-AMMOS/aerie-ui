<svelte:options immutable={true} />

<script lang="ts">
  import type {
        ActivityErrorRollup
    } from '../../types/errors';
    import type { ExternalEventDB, ExternalEventId } from '../../types/external-event';
    import type { FieldStore } from '../../types/form';
    import type { Property } from '../../types/property';
    import { classNames } from '../../utilities/generic';
    import Collapse from '../Collapse.svelte';
    import Input from '../form/Input.svelte';
    import Highlight from '../ui/Highlight.svelte';
    import Properties from './Properties.svelte';

  export let externalEvent: ExternalEventId;
  export let externalEvents: ExternalEventDB[];
  export let editable: boolean = true;
  export let showActivityName: boolean = false;
  export let showHeader: boolean = true;

  let event: ExternalEventDB;
  $: event = externalEvents.filter(e => e.id == externalEvent)[0]

  let activityErrorRollup: ActivityErrorRollup | undefined;
  let editingActivityName: boolean = false;
  let extraArguments: string[] = [];
  let formProperties: Property[] = [];
  $: formProperties = Object.entries(event.properties).map(e => {
    return {
      name: e[0],
      value: JSON.stringify(e[1])
    }
  })
  let hasUpdatePermission: boolean = false;
  let highlightKeysMap: Record<string, boolean> = {};
  let numOfUserChanges: number = 0;
  let parameterErrorMap: Record<string, string[]> = {};
  let parametersWithErrorsCount: number = 0;
  let startTimeDoy: string;
  let startTimeDoyField: FieldStore<string>;
</script>

<div class="activity-form-container">
  {#if showHeader}
    <div class="activity-header">
      <div class={classNames('activity-header-title', { 'activity-header-title--editing': editingActivityName })}>
        <div class="activity-header-title-value st-typography-medium">
          {event.key}
        </div>
      </div>
    </div>
  {/if}

  <div class="activity-form">
    <fieldset>
      <Collapse title="Definition">
        {#if showActivityName}
          <Highlight highlight={highlightKeysMap.name}>
            <Input layout="inline">
              <!-- <label use:tooltip={{ content: 'Activity Name', placement: 'top' }} for="activityName"> -->
                Activity Name
              <!-- </label> -->
              <input class="st-input w-100" disabled name="activityName" value={event.key} />
            </Input>
          </Highlight>
        {/if}

        <Highlight highlight={highlightKeysMap.id}>
          <Input layout="inline">
            <!-- <label use:tooltip={{ content: 'Activity ID', placement: 'top' }} for="id"> ID</label> -->
            <input class="st-input w-100" disabled name="id" value={event.id} />
          </Input>
        </Highlight>

        <Highlight highlight={highlightKeysMap.type}>
          <Input layout="inline">
            <!-- <label use:tooltip={{ content: 'Activity Type', placement: 'top' }} for="activity-type"> -->
              Activity Type
            <!-- </label> -->
            <input class="st-input w-100" disabled name="activity-type" value={event.event_type} />
          </Input>
        </Highlight>

        <!-- <Highlight highlight={highlightKeysMap.start_offset}>
          <DatePickerField
            disabled={!editable}
            field={startTimeDoyField}
            label="Start Time (UTC) - YYYY-DDDThh:mm:ss"
            layout="inline"
            name="start-time"
          />
        </Highlight> -->

        <!-- <ActivityAnchorForm
          {activityDirective}
          {activityDirectivesMap}
          {hasUpdatePermission}
          anchorId={revision ? revision.anchor_id : activityDirective.anchor_id}
          disabled={!editable}
          {highlightKeysMap}
          planReadOnly={$planReadOnly}
          isAnchoredToStart={revision ? revision.anchored_to_start : activityDirective.anchored_to_start}
          startOffset={revision ? revision.start_offset : activityDirective.start_offset}
          on:updateAnchor={updateAnchor}
          on:updateAnchorEdge={updateAnchorEdge}
          on:updateStartOffset={updateStartOffset}
        /> -->

        <Highlight highlight={highlightKeysMap.created_at}>
          <Input layout="inline">
            <!-- <label use:tooltip={{ content: 'Creation Time (UTC)', placement: 'top' }} for="creationTime"> -->
              Creation Time (UTC)
            <!-- </label> -->
            <input class="st-input w-100" disabled name="creationTime" value={event.start_time} />
          </Input>
        </Highlight>

        <Highlight highlight={highlightKeysMap.last_modified_by}>
          <Input layout="inline">
            <!-- <label use:tooltip={{ content: 'Created By', placement: 'top' }} for="createdBy"> Created By </label> -->
            <input class="st-input w-100" disabled name="createdBy" value={event.source_id} />
          </Input>
        </Highlight>
      </Collapse>
    </fieldset>

    <fieldset>
      <Collapse
        error={parametersWithErrorsCount > 0}
        title={`Parameters${parametersWithErrorsCount > 0 ? ` (${parametersWithErrorsCount} invalid)` : ''}`}
      >
        <Properties
          disabled={!editable}
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
