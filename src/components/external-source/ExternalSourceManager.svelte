<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import type { ValueGetterParams } from 'ag-grid-community';
  import Truck from 'bootstrap-icons/icons/truck.svg?component';
  import XIcon from 'bootstrap-icons/icons/x.svg?component';
  import { onDestroy, onMount } from 'svelte';
  import { createExternalSourceError, creatingExternalSource, externalSources } from '../../stores/external-source';
  import { field } from '../../stores/form';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { ExternalEvent } from '../../types/external-event';
  import type { ExternalSourceInsertInput, ExternalSourceJson, ExternalSourceSlim } from '../../types/external-source';
  import type { TimeRange } from '../../types/timeline';
  import { type MouseDown, type MouseOver } from '../../types/timeline';
  import effects from '../../utilities/effects';
  import { convertDurationToMs, convertUTCtoMs } from '../../utilities/time';
  import { TimelineInteractionMode, getXScale } from '../../utilities/timeline';
  import { tooltip } from '../../utilities/tooltip';
  import { required, timestamp } from '../../utilities/validators';
  import ExternalEventForm from '../external-events/ExternalEventForm.svelte';
  import DatePickerField from '../form/DatePickerField.svelte';
  import Field from '../form/Field.svelte';
  import LayerExternalSources from '../timeline/LayerExternalSources.svelte';
  import TimelineCursors from '../timeline/TimelineCursors.svelte';
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
  
  // upload variables (We want to parse a file selected for upload.)
  let files: FileList | undefined;
  let file: File | undefined;
  let parsed: ExternalSourceJson | undefined;
  let sourceInsert: ExternalSourceInsertInput;

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
  let selectedSourceId: number | null = null;

  // timeline variables
  let dpr = 0;
  let viewTimeRange: TimeRange = { end: 0, start: 0 };
  let selectedEvent: ExternalEvent | null = null;
  let selectedEvents: ExternalEvent[] = [];
  let canvasContainerRef: HTMLDivElement;
  let canvasContainerWidth: number = 0;
  let canvasContainerHeight: number = 0;
  let canvasMouseDownEvent: MouseEvent | undefined = undefined;
  let canvasMouseOverEvent: MouseOver | null = null;
  let removeDPRChangeListener: (() => void) | null = null;
  

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
  // source and child events. The only thing that is missing at
  // this point is the uploaded file ID.
  $: {
    if (parsed) {
      sourceInsert = {
        end_time: $endTimeDoyField.value,
        external_events: {
          data: parsed?.events, // does NOT filter for keys. Trusts that the input is right before forwarding to Hasura...even though a type IS defined... I mean to say if there are extra keys, in excess of what the type specifies, it just includes all of them
        },
        file_id: -1, // updated in the effect.
        key: $keyField.value,
        metadata: parsed.source.metadata,
        source_type: $sourceTypeField.value,
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
    if (files !== undefined) {
      var sourceId = await effects.createExternalSource(file, sourceInsert, user);
      if ($createExternalSourceError === null && e.target instanceof HTMLFormElement) {
        goto(`${base}/external-sources`);
      }
      // if ($createExternalSourceError === null && e.target instanceof HTMLFormElement) {
      //   goto(`${base}/external-sources/${sourceId}`);
      // }
    }
  }

  function selectSource(detail: ExternalSourceSlim) {
    selectedSource = detail;
  }

  function deselectSource() {
    selectedSource = null;
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

  function onCanvasContainerMouseMove(e: MouseEvent) {
    canvasMouseOverEvent = { e }
  }
</script>

<!-- <CssGrid> -->
  <CssGrid columns="20% auto">
    <Panel borderRight padBody={true}>
      <svelte:fragment slot="header">
        <SectionTitle
          >{selectedEvent ? `Selected Event`
            : selectedSource
            ? `#${selectedSource.id} – ${selectedSource.source_type}`
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
            <ul>
              <li>What plans do refer to this source?</li>
              <li>Is this newest source of this type?</li>
              <li>Show me information relating to this type?</li>
              <li>Show me all information about this source from the file (i.e. properties)?</li>
              <li>General info bar?</li>
            </ul>
          </div>
        {:else}
          <form on:submit|preventDefault={onFormSubmit}>
            <AlertError class="m-2" error={$createExternalSourceError} />

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
        <div class="filter">TBD: Filter by type and time? Filter by used/unused by?</div>
        {#if $externalSources.length}
        <CssGrid rows="1fr 5px 1fr" gap="8px" class="source-grid">
          <SingleActionDataGrid
            {columnDefs}
            itemDisplayText="External Source"
            items={$externalSources}
            {user}
            bind:selectedItemId={selectedSourceId}
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
                on:mousedown={e => canvasMouseDownEvent = e}
                on:mousemove={onCanvasContainerMouseMove}
                role="none"
              >
                <TimelineCursors
                  marginLeft={0}
                  drawWidth={canvasContainerWidth}
                  mouseOver={canvasMouseOverEvent}
                  {xScaleView}
                />
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
                    mousemove={undefined}
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
<!-- </CssGrid> -->

<style>
  :global(.plan-grid) {
    overflow: auto;
  }
  .filter {
    margin: 0.8rem 0;
  }
  .tbd ul,
  .tbd li {
    list-style: none;
    margin: 0.2rem 0;
    padding: 0;
  }

  :global(.source-grid) {
    height: 100%;
    width: 100%;
  }
</style>
