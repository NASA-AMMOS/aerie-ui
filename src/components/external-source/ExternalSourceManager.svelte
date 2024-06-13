<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import SearchIcon from '@nasa-jpl/stellar/icons/search.svg?component';
  import type { ValueGetterParams } from 'ag-grid-community';
  import Truck from 'bootstrap-icons/icons/truck.svg?component';
  import XIcon from 'bootstrap-icons/icons/x.svg?component';
  import { onDestroy, onMount } from 'svelte';
  import { externalEventsDB } from '../../stores/external-event';
  import { createExternalSourceError, createExternalSourceTypeError, creatingExternalSource, externalSourceTypes, externalSourceWithTypeName } from '../../stores/external-source';
  import { field } from '../../stores/form';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { ExternalEvent, ExternalEventDB } from '../../types/external-event';
  import type { ExternalSourceDB, ExternalSourceInsertInput, ExternalSourceJson, ExternalSourceSlim, ExternalSourceType, ExternalSourceTypeInsertInput, ExternalSourceWithTypeName } from '../../types/external-source';
  import type { TimeRange } from '../../types/timeline';
  import { type MouseDown, type MouseOver } from '../../types/timeline';
  import effects from '../../utilities/effects';
  import { convertDurationToMs, convertUTCtoMs } from '../../utilities/time';
  import { TimelineInteractionMode, getXScale } from '../../utilities/timeline';
  import { tooltip } from '../../utilities/tooltip';
  import { required, timestamp } from '../../utilities/validators';
  import Collapse from '../Collapse.svelte';
  import ExternalEventForm from '../external-events/ExternalEventForm.svelte';
  import DatePickerField from '../form/DatePickerField.svelte';
  import Field from '../form/Field.svelte';
  import Input from '../form/Input.svelte';
  import Menu from '../menus/Menu.svelte';
  import MenuHeader from '../menus/MenuHeader.svelte';
  import LayerExternalSources from '../timeline/LayerExternalSources.svelte';
  import TimelineCursors from '../timeline/TimelineCursors.svelte';
  import Tooltip from '../timeline/Tooltip.svelte';
  import AlertError from '../ui/AlertError.svelte';
  import CssGrid from '../ui/CssGrid.svelte';
  import CssGridGutter from '../ui/CssGridGutter.svelte';
  import SingleActionDataGrid from '../ui/DataGrid/SingleActionDataGrid.svelte';
  import Panel from '../ui/Panel.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';


  export let user: User | null;


  let keyInputField: HTMLInputElement; // need this to set a focus on it. not related to the value
  // form variables (TODO: make these autofill???)
  let keyField = field<string>('', [required]);
  let sourceTypeField = field<string>('', [required]); // need function to check if in list of allowable types...
  let startTimeDoyField = field<string>('', [required, timestamp]); // requires validation function
  let endTimeDoyField = field<string>('', [required, timestamp]); // requires validation function
  let validAtDoyField = field<string>('', [required, timestamp]); // requires validation function

  // table variables
  const baseColumnDefs: DataGridColumnDef[] = [
    {
      field: 'id',
      filter: 'number',
      headerName: 'ID',
      resizable: true,
      sortable: true,
    },
    {
      field: 'key',
      filter: 'text',
      headerName: 'Key',
      resizable: true,
      sortable: true,
    },
    {
      field: 'source_type',
      filter: 'text',
      headerName: 'Source Type',
      resizable: true,
      sortable: true,
    },
    {
      field: 'file_id',
      filter: 'number',
      headerName: 'File ID',
      resizable: true,
      sortable: true,
    },
    {
      field: 'start_time',
      filter: 'text',
      headerName: 'Start Time',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.start_time) {
          return new Date(params.data?.start_time).toISOString().slice(0, 19);
        }
      },
    },
    {
      field: 'end_time',
      filter: 'text',
      headerName: 'End Time',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.end_time) {
          return new Date(params.data?.end_time).toISOString().slice(0, 19);
        }
      },
    },
    {
      field: 'valid_at',
      filter: 'text',
      headerName: 'Valid At',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.valid_at) {
          return new Date(params.data?.valid_at).toISOString().slice(0, 19);
        }
      },
    },
  ];
  let columnDefs: DataGridColumnDef[] = baseColumnDefs; // TODO: add actions like delete as in Models.svelte
  let selectedSource: ExternalSourceSlim | null = null;
  let selectedSourceEvents: ExternalEventDB[] = []

  // source detail variables
  let selectedSourceId: number | null = null;
  let selectedSourceFull: ExternalSourceDB | null = null;

  // timeline variables
  let dpr = 0;
  let viewTimeRange: TimeRange = { end: 0, start: 0 };
  let selectedEvent: ExternalEvent | null = null;
  let selectedEvents: ExternalEvent[] = [];
  let canvasContainerRef: HTMLDivElement;
  let canvasContainerWidth: number = 0;
  let canvasContainerHeight: number = 0;
  let canvasMouseDownEvent: MouseEvent | undefined = undefined;
  let canvasMouseOverEvent: MouseEvent | undefined = undefined;
  let removeDPRChangeListener: (() => void) | null = null;
  let eventTooltip: Tooltip;
  let mouseOver: MouseOver | null;

  // We want to parse a file selected for upload.
  let files: FileList | undefined;
  let file: File | undefined;
  let parsed: ExternalSourceJson | undefined;

  // For filtering purposes (modelled after TimelineEditorLayerFilter):
  let filterMenu: Menu;
  let input: HTMLInputElement;
  let filterString: string = '';
  let filteredValues: ExternalSourceType[] = [];
  let selectedFilters: ExternalSourceType[] = [...$externalSourceTypes];
  let menuTitle: string = '';
  let filteredExternalSources: ExternalSourceWithTypeName[] = [];


  // $: createButtonDisabled = !files || key === '' ||   $creatingModel === true; TODO: do this later
  
  // TODO: this doesn't let people modify the form properties.
  // We need to figure out if things like the start, end, and valid_at
  // time *should* be editable. I don't think any of them should be, but we
  // need to talk about it.
  $: if (files) {
    file = files[0];
    const fileText = file.text();
    fileText.then(async text => {
      parsed = JSON.parse(await text);
      if (parsed) {
        $keyField.value = parsed.source.key;
        $sourceTypeField.value = parsed.source.source_type;
        $startTimeDoyField.value = parsed.source.period.start_time;
        $endTimeDoyField.value = parsed.source.period.end_time;
        $validAtDoyField.value = parsed.source.valid_at;
      }
    });
  }

  // We want to build the GraphQL input object for the external
  // source and child events. The only things that are missing at
  // this point are the uploaded file ID and external source type ID.
  let sourceInsert: ExternalSourceInsertInput;
  let sourceTypeInsert: ExternalSourceTypeInsertInput;

  $: console.log("EXTERNAL SOURCE WITH TYPE NAME:", $externalSourceWithTypeName)

  $: {
    if (parsed && file) {
      // Create an entry for the current source type if it does not already exist. Otherwise, retrieve the id
      if (!($externalSourceTypes.some(externalSourceType => externalSourceType.name === $sourceTypeField.value))) {
        sourceTypeInsert = {
          name: $sourceTypeField.value
        };
      }
      sourceInsert = {
        end_time: $endTimeDoyField.value,
        external_events: {
          data: parsed?.events, // does NOT filter for keys. Trusts that the input is right before forwarding to Hasura...even though a type IS defined... I mean to say if there are extra keys, in excess of what the type specifies, it just includes all of them
        },
        file_id: -1, // updated in the effect.
        key: $keyField.value,
        metadata: parsed.source.metadata,
        source_type_id: -1,  //updated in the effect.
        start_time: $startTimeDoyField.value,
        valid_at: $validAtDoyField.value,
      };
    }
  }

  $: selectedSourceId = selectedSource ? selectedSource.id : null;
  $: startTime = selectedSource ? new Date(selectedSource.start_time) : new Date();
  $: endTime = selectedSource ? new Date(selectedSource.end_time) : new Date();
  $: viewTimeRange = { end: endTime.getTime(), start: startTime.getTime() }
  $: xDomainView = [startTime, endTime];
  $: xScaleView = getXScale(xDomainView, 500);

  $: filteredExternalSources = $externalSourceWithTypeName.filter(externalSource => {
    return selectedFilters.find(f => f.name === externalSource.source_type) !== undefined
  });
  $: filteredValues = $externalSourceTypes.filter(externalSourceType => externalSourceType.name.toLowerCase().includes(filterString))
  
  $: effects.getExternalEvents(selectedSource?.id, user).then(fetched => selectedEvents = fetched.map(eDB => {
    return {
      ...eDB,
      startMs: convertUTCtoMs(eDB.start_time),
      durationMs: convertDurationToMs(eDB.duration)
    }
  }));


  onMount(() => {
    detectDPRChange();
  });

  onDestroy(() => {
    if (removeDPRChangeListener !== null) {
      removeDPRChangeListener();
    }
  });


  function detectDPRChange() {
    // Adapted from https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#monitoring_screen_resolution_or_zoom_level_changes

    if (removeDPRChangeListener !== null) {
      removeDPRChangeListener();
    }

    // Create new change listener using current DPR
    const mqString = `(resolution: ${window.devicePixelRatio}dppx)`;
    const deviceMedia = matchMedia(mqString);
    deviceMedia.addEventListener('change', detectDPRChange);
    removeDPRChangeListener = () => deviceMedia.removeEventListener('change', detectDPRChange);

    dpr = window.devicePixelRatio;
  }

  
  async function onFormSubmit(e: SubmitEvent) {
    // TBD: force reload the page???
    let sourceTypeId: number | undefined = undefined;
    if (file !== undefined) {
      if (!($externalSourceTypes.map(s => s.name).includes($sourceTypeField.value)) && sourceTypeInsert !== undefined) {
        sourceTypeId = await effects.createExternalSourceType(sourceTypeInsert, user);
      } else {
        sourceTypeId = $externalSourceTypes.find(externalSource => externalSource.name === $sourceTypeField.value)?.id
      }
      if (sourceTypeId !== undefined ) {
        sourceInsert.source_type_id = sourceTypeId;
        var sourceId = await effects.createExternalSource(file, sourceInsert, user);
        if ($createExternalSourceError === null && e.target instanceof HTMLFormElement) {
          goto(`${base}/external-sources`);
        }
        // if ($createExternalSourceError === null && e.target instanceof HTMLFormElement) {
        //   goto(`${base}/external-sources/${sourceId}`);
        // }
      }
    }
  }

  function selectSource(detail: ExternalSourceWithTypeName) {
    selectedSource = detail;
    if (selectedSource) {
      selectedSourceEvents = $externalEventsDB.filter(externalEvent => {
        externalEvent.source?.source_type_id === selectedSource?.id
      })
    }
  }

  function deselectSource() {
    selectedSource = null;
    selectedSourceFull = null;
  }

  function deselectEvent() {
    selectedEvent = null;
  }

  function onCanvasMouseDown(e: CustomEvent<MouseDown>) {
    const { externalEvents } = e.detail;

    // selectedEvent is our source of an ExternalEvent as well as the ExternalEventId used by this instance
    //    of the LayerExternalSources (as opposed to using a store, like the timeline one does, which is
    //    unnecessary as everything we need is in on single component or can be passed down via parameters to
    //    children).
    selectedEvent = externalEvents?.length ? externalEvents[0] : null
  }

  function onCanvasMouseOver(e: CustomEvent<MouseOver>) {
    // just assign the MouseOver object so that the tooltip can access it
    mouseOver = e.detail
  }

  function toggleItem(value: ExternalSourceType) {
    if (!selectedFilters.find(f => f.id == value.id)) {
      selectedFilters = selectedFilters.concat(value)
    }
    else {
      selectedFilters = selectedFilters.filter(filter => filter.id !== value.id)
    }
  }

  function unselectFilteredValues() {
    selectedFilters = [];
  }

  function selectFilteredValues() {
    selectedFilters = [...new Set([...selectedFilters, ...filteredValues])];
  }
</script>

<CssGrid columns="20% auto">
  <Panel borderRight padBody={true}>
    <svelte:fragment slot="header">
      <SectionTitle
        >{selectedEvent ? `Selected Event`
          : selectedSource
          ? `#${selectedSource.id} – ${$externalSourceTypes.find(st => st.id == selectedSource?.source_type_id)}`
          : 'Upload a Source File'}</SectionTitle
      >
      {#if selectedEvent}
        <button
          class="st-button icon fs-6"
          on:click={deselectEvent}
          use:tooltip={{ content: 'Deselect event', placement: 'top' }}
        >
          <XIcon />
        </button>
      {:else if selectedSource}
        <button
          class="st-button icon fs-6"
          on:click={deselectSource}
          use:tooltip={{ content: 'Deselect source', placement: 'top' }}
        >
          <XIcon />
        </button>
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="body">
      {#if selectedEvent}
        <ExternalEventForm
          externalEvent={selectedEvent}
          showHeader={true}
        />
      {:else if selectedSource}
        <div title={selectedSource.key}>{selectedSource.key}</div>
        <div class="tbd">
          {#if selectedSourceFull !== null}
            {#each selectedSourceFull.external_events as externalEvent}
              <ul>{externalEvent}</ul>
            {/each}
          {/if}
        </div>
      {:else}
        <form on:submit|preventDefault={onFormSubmit}>
          <AlertError class="m-2" error={$createExternalSourceError} />
          <AlertError class="m-2" error={$createExternalSourceTypeError} />

          <fieldset>
            <label for="file">Source File</label>
            <input class="w-100" name="file" required type="file" bind:files />
          </fieldset>

          {#if parsed}
            <fieldset>
              <button class="st-button w-100" type="submit"
                >{$creatingExternalSource ? 'Uploading...' : 'Upload'}</button
              >
              <div style="padding-top:10px">
                <button class="st-button w-100" type="reset">Reset</button>
              </div>
            </fieldset>
            <Field field={keyField}>
              <label for="key" slot="label">Key</label>
              <input disabled bind:value={keyInputField} autocomplete="off" class="st-input w-100" name="key" required />
            </Field>

            <Field field={sourceTypeField}>
              <label for="source-type" slot="label">Source Type</label>
              <input disabled autocomplete="off" class="st-input w-100" name="source-type" required />
            </Field>

            <fieldset>
              <DatePickerField disabled={true} field={startTimeDoyField} label="Start Time - YYYY-DDDThh:mm:ss" name="start-time" />
            </fieldset>

            <fieldset>
              <DatePickerField disabled={true} field={endTimeDoyField} label="End Time - YYYY-DDDThh:mm:ss" name="end_time" />
            </fieldset>

            <fieldset>
              <DatePickerField disabled={true} field={validAtDoyField} label="Valid At Time - YYYY-DDDThh:mm:ss" name="valid_at" />
            </fieldset>
          {/if}
        </form>
      {/if}
    </svelte:fragment>
  </Panel>

  <Panel padBody={false}>
    <svelte:fragment slot="header">
      <SectionTitle><Truck />External Sources</SectionTitle>
    </svelte:fragment>
    <svelte:fragment slot="body">
      <div class="filter" style="padding-left: 5px; padding-right: 15px">
        <Collapse
          className="anchor-collapse"
          defaultExpanded={false}
          title="Filters"
          tooltipContent="Filter External Sources"
        >
          <div class="timeline-editor-layer-filter" style="position: relative">
            <Input>
              <input
                bind:this={input}
                bind:value={filterString}
                on:click|stopPropagation={() => {
                  if (!filterMenu.isShown()) {
                    filterMenu.show();
                    input.focus();
                  }
                }}
                autocomplete="off"
                class="st-input w-100"
                name="filter"
                placeholder={'Filter by Source Type'}
              />
              <div class="filter-search-icon" slot='left'><SearchIcon /></div>
            </Input>
            <Menu hideAfterClick={false} bind:this={filterMenu} placement="bottom-start" on:hide={() => (filterString = '')}>
              <div class="menu-content">
                <MenuHeader title={menuTitle} />
                <div class="body st-typography-body">
                  {#if filteredValues.length}
                    <div class="values">
                      {#each filteredValues as filteredSourceType}
                        <button
                          class="value st-button tertiary st-typography-body"
                          on:click={() => toggleItem(filteredSourceType)}
                          class:active={selectedFilters.map(f => f.name).find(f => f === filteredSourceType.name) !== undefined}
                        >
                          {filteredSourceType.name}
                        </button>
                      {/each}
                    </div>
                  {:else}
                    <div class="st-typography-label empty-state">No external source types matching filter</div>
                  {/if}
                </div>
                <div class="list-buttons menu-border-top">
                  <!-- <button class="st-button secondary list-button" on:click={selectFilteredValues}> -->
                  <button class="st-button secondary list-button" on:click={selectFilteredValues}>
                    Select {filteredValues.length}
                    {#if filteredValues.length === 1}
                      {'external source type'}
                    {:else}
                      {'external source types'}
                    {/if}
                  </button>
                  <!-- <button class="st-button secondary list-button" on:click={unselectFilteredValues}>Unselect all</button> -->
                  <button class="st-button secondary list-button" on:click={unselectFilteredValues}>Unselect all</button>
                </div>
              </div>
            </Menu>
          </div>
        </Collapse>
      </div>
      {#if $externalSourceWithTypeName.length}
        <CssGrid rows="1fr 5px 1fr" gap="8px" class="source-grid">
          <SingleActionDataGrid
            {columnDefs}
            itemDisplayText="External Source"
            items={filteredExternalSources}
            {user}
            on:rowClicked={({ detail }) => selectSource(detail.data)}
          />
          <CssGridGutter track={1} type="row" />
          {#if selectedSource}
            <div style="padding-left: 5px; padding-right: 5px">
              <div style="height:15px; background-color:#ebe9e6;">
                <div style="display:inline; float:left;">{startTime}</div>
                <div style="display:inline; float:right;">{endTime}</div>
              </div>
              <div style="height: 100%; width: 100%; position: relative"
                bind:this={canvasContainerRef}
                bind:clientWidth={canvasContainerWidth}
                bind:clientHeight={canvasContainerHeight}
                on:mousedown={e => {
                  canvasMouseDownEvent = e
                }}
                on:mousemove={e => {
                  canvasMouseOverEvent = e
                }}
                role="none"
              >
                <TimelineCursors
                  marginLeft={0}
                  drawWidth={canvasContainerWidth}
                  {mouseOver}
                  {xScaleView}
                />
                <Tooltip bind:this={eventTooltip} {mouseOver} interpolateHoverValue={false} hidden={false} resourceTypes={[]} />
                <div style="padding-top: 3px; padding-bottom: 10px">
                  <LayerExternalSources
                    selectedExternalEventId={selectedEvent?.id ?? null}
                    externalEvents={selectedEvents}
                    {viewTimeRange}
                    {xScaleView}
                    {dpr}
                    mousedown={canvasMouseDownEvent}
                    drawHeight={canvasContainerHeight-3-10 ?? 200}
                    drawWidth={canvasContainerWidth ?? 200}
                    timelineInteractionMode={TimelineInteractionMode.Interact}
                    on:mouseDown={onCanvasMouseDown}
                    on:mouseOver={onCanvasMouseOver}
                    mousemove={canvasMouseOverEvent}
                    mouseout={undefined}
                    contextmenu={undefined}
                    dblclick={undefined}
                    planStartTimeYmd={""}
                  />
                </div>
              </div>
            </div>
          {:else}
            <p style="padding-left: 5px">Select a source to view contents.</p>
          {/if}
        </CssGrid>
      {:else}
        <p style="padding-left: 5px">No External Sources present.</p>
      {/if}
    </svelte:fragment>
  </Panel>
</CssGrid>

<style>
  :global(.plan-grid) {
    overflow: auto;
  }
  .filter {
    margin: 0.8rem 0;
  }
  .tbd ul,

  :global(.source-grid) {
    height: 100%;
    width: 100%;
  }
  .timeline-editor-layer-filter {
    display: flex;
  }

  .timeline-editor-layer-filter :global(.input) {
    z-index: 1;
  }

  .filter-search-icon {
    align-items: center;
    color: var(--st-gray-50);
    display: flex;
  }

  .menu-content {
    display: grid;
    grid-template-rows: min-content 1fr min-content;
    max-height: 360px;
  }

  .body {
    cursor: auto;
    display: grid;
    gap: 8px;
    overflow: auto;
    text-align: left;
  }

  .values {
    display: flex;
    flex-direction: column;
  }

  .value {
    border-radius: 0;
    justify-content: left;
    padding: 16px 8px;
  }

  .value:hover {
    background: var(--st-gray-20);
  }

  .value.active,
  .value.active:hover {
    background: #4fa1ff4f;
  }

  .body :global(.input-inline) {
    padding: 0;
  }

  .list-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    width: 100%;
  }

  .empty-state {
    margin: 8px;
  }

  .menu-border-top {
    border-top: 1px solid var(--st-gray-20);
  }
</style>
