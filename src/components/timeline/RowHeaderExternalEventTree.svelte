<svelte:options immutable={true} />

<script lang="ts">
  import CaretRight from 'bootstrap-icons/icons/caret-right.svg?component';
  import { createEventDispatcher } from 'svelte';
  import FolderIcon from '../../assets/folder.svg?component';
  import SelectIcon from '../../assets/select.svg?component';
  import { ViewDefaultExternalEventOptions } from '../../constants/view';
  import { externalSources, getSourceName } from '../../stores/external-source';
  import type { ExternalEvent, ExternalEventId } from '../../types/external-event';
  import type { ExternalEventOptions, ExternalEventTree, ExternalEventTreeNode, MouseDown, MouseOver } from '../../types/timeline';
  import { classNames } from '../../utilities/generic';
  import { pluralize } from '../../utilities/text';
  import { tooltip } from '../../utilities/tooltip';
  import Collapse from '../Collapse.svelte';

  export let externalEventOptions: ExternalEventOptions = { ...ViewDefaultExternalEventOptions };
  export let externalEventTree: ExternalEventTree = [];
  export let selectedExternalEventId: ExternalEventId | null = null;

  let rowHeight = 0;

  $: rowHeight = externalEventOptions.externalEventHeight + 4; // Add externalEventPadding from LayerExternalSources

  const dispatch = createEventDispatcher<{
    'external-event-tree-node-change': ExternalEventTreeNode;
    dblClick: MouseOver;
    mouseDown: MouseDown;
  }>();

  function onMouseDownLeaf(e: MouseEvent, node: ExternalEventTreeNode) {
    dispatch('mouseDown', { e, externalEvents: getExternalEventsForNode(node) });
  }

  function onDblclickLeaf(e: MouseEvent): void {
    if (e) {
      dispatch('dblClick', {
        e,
        selectedExternalEventId: selectedExternalEventId ?? undefined
      });
    }
  }

  function getExternalEventsForNode(node: ExternalEventTreeNode) {
    const externalEvents: ExternalEvent[] = [];
    (node.items || []).forEach(externalEvent => {
        if(externalEvent.externalEvent) externalEvents.push(externalEvent.externalEvent);
    });
    return externalEvents;
  }

  function getNodeComposition(node: ExternalEventTreeNode) {
    let externalEventCount = 0;
    (node.items || []).forEach(externalEvent => {
      externalEventCount++;
    });
    return externalEventCount;
  }

  function onSelectClick(node: ExternalEventTreeNode, e: MouseEvent) {
    onMouseDownLeaf(e, node);
  }
</script>

{#if externalEventTree.length}
  {#each externalEventTree as node}
    {#if node.isLeaf}
      {@const externalEvent = node.items[0].externalEvent}
      <button
        style:height={`${rowHeight}px`}
        style:white-space='nowrap'
        style:overflow='hidden'
        style:text-overflow='ellipsis ellipsis'
        class="row-header-external-event-group leaf st-button tertiary"
        class:selected={externalEvent?.id === selectedExternalEventId}
        on:dblclick={e => onDblclickLeaf(e)}
        on:click={e => onMouseDownLeaf(e, node)}
      >
        <div style=" align-items: center;color: var(--st-button-tertiary-color);display: flex; gap: 4px;">
          <div title="External Event" class="icon-group">
              <CaretRight style="width:13px"/>
          </div>
        </div>
        {node.label}
      </button>
    {:else}
      {@const externalEventCount = getNodeComposition(node)}
      {@const externalEvent = node.items[0]?.externalEvent}
      <Collapse
        headerHeight={rowHeight}
        defaultExpanded={node.expanded}
        className={classNames('row-header-external-event-group', {
          selected:
            (externalEvent?.id === selectedExternalEventId),
        })}
        on:collapse={() => dispatch('external-event-tree-node-change', node)}
      >
        <div slot="left" style="align-items: center;display: flex">
          <div title="External Event" class="icon-group">
            <FolderIcon />
          </div>
        </div>
        <div slot="title" style="align-items: center;display: flex; gap: 8px;">
          <div 
            class="label"
            style:white-space='nowrap'
            style:overflow='hidden'
            style:text-overflow='ellipsis ellipsis'
          >
            {#if externalEventOptions.groupBy === 'source_id'}
              {getSourceName(Number.parseInt(node.label), $externalSources)}
            {:else}
              {node.label}
            {/if}
          </div>
          <div class="title-metadata">
            <div
              title={`${node.children.length} child type group${pluralize(node.children.length)}`}
              class="icon-group"
            >
              <span>{externalEventCount}</span>
            </div>
          </div>
        </div>
        <svelte:fragment slot="action-row">
          <button
            use:tooltip={{ content: 'Select' }}
            class="st-button icon select"
            on:click={onSelectClick.bind(null, node)}
          >
            <SelectIcon />
          </button>
        </svelte:fragment>
        {#if node.expanded}
          <svelte:self
            externalEventTree={node.children}
            on:external-event-tree-node-change
            on:mouseDown
            on:dblClick
            {selectedExternalEventId}
          />
        {/if}
      </Collapse>
    {/if}
  {/each}
{/if}

<style>
  :global(.row-header-external-event-group) {
    position: relative;
  }

  :global(.row-header-external-event-group.collapse > .collapse-header),
  .row-header-external-event-group.leaf {
    border-bottom: 1px solid var(--st-gray-30);
    border-radius: 0px;
    font-size: 10px;
    letter-spacing: 0.1px;
    padding: 0 !important;
    padding-left: 4px !important;
  }

  :global(.row-header-external-event-group.collapse:not(.selected) > .collapse-header:hover),
  .row-header-external-event-group.leaf:hover:not(.selected) {
    background: var(--st-gray-20) !important;
  }

  :global(.row-header-external-event-group.collapse > .content.pad-content) {
    margin-left: 16px !important;
  }

  :global(.row-header-external-event-group.collapse > .content) {
    gap: 0px;
  }

  .row-header-external-event-group.leaf {
    gap: 3px;
    height: 32px;
    justify-content: flex-start;
    outline: none;
    padding: 8px 0px 8px 0px;
  }

  .icon-group {
    display: flex;
    gap: 4px;
  }

  .title-metadata {
    align-items: center;
    color: var(--st-gray-50);
    display: flex;
    gap: 4px;
  }

  :global(.row-header-external-event-group.collapse .collapse-icon svg) {
    color: var(--st-gray-40);
  }

  .selected,
  :global(.collapse.selected > .collapse-header) {
    background-color: #e3effd !important;
  }

  :global(.collapse.selected > .collapse-header *),
  .row-header-external-event-group.selected,
  .row-header-external-event-group.selected :global(svg) {
    color: var(--st-utility-blue) !important;
  }

  :global(.row-header-external-event-group button.select) {
    background: var(--st-gray-20);
    height: 16px;
    min-width: 16px;
    opacity: 0;
    position: absolute;
    right: 0;
    top: 2px;
    width: 16px;
  }

  :global(.row-header-external-event-group button.select:hover) {
    background: var(--st-gray-20) !important;
  }

  :global(.row-header-external-event-group.collapse:has(> .collapse-header:focus-visible) > button.select),
  :global(.row-header-external-event-group.collapse:has(> button.select:focus-visible) > button.select),
  :global(.row-header-external-event-group.collapse:has(> .collapse-header:hover) > button.select),
  :global(.row-header-external-event-group.collapse:has(> button.select:hover) > button.select) {
    opacity: 1;
  }

  :global(.row-header-external-event-group .label) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.row-header-activity-group) {
    position: relative;
  }

  :global(.row-header-activity-group.collapse > .content.pad-content) {
    margin-left: 16px !important;
  }

  :global(.row-header-activity-group.collapse > .content) {
    gap: 0px;
  }

  .icon-group {
    display: flex;
    gap: 4px;
  }

  .title-metadata {
    align-items: center;
    color: var(--st-gray-50);
    display: flex;
    gap: 4px;
  }

  :global(.row-header-activity-group.collapse .collapse-icon svg) {
    color: var(--st-gray-40);
  }

  .selected,
  :global(.collapse.selected > .collapse-header) {
    background-color: #e3effd !important;
  }

  :global(.row-header-activity-group button.select) {
    background: var(--st-gray-20);
    height: 16px;
    min-width: 16px;
    opacity: 0;
    position: absolute;
    right: 0;
    top: 2px;
    width: 16px;
  }

  :global(.row-header-activity-group button.select:hover) {
    background: var(--st-gray-20) !important;
  }

  :global(.row-header-activity-group.collapse:has(> .collapse-header:focus-visible) > button.select),
  :global(.row-header-activity-group.collapse:has(> button.select:focus-visible) > button.select),
  :global(.row-header-activity-group.collapse:has(> .collapse-header:hover) > button.select),
  :global(.row-header-activity-group.collapse:has(> button.select:hover) > button.select) {
    opacity: 1;
  }

  :global(.row-header-activity-group .label) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
