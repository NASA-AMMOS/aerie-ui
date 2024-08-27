<script lang="ts">
  import { base } from '$app/paths';
  import type { ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
  import Balloon from 'bootstrap-icons/icons/balloon.svg?component';
  import Truck from 'bootstrap-icons/icons/truck.svg?component';
  import XIcon from 'bootstrap-icons/icons/x.svg?component';
  import { onDestroy, onMount } from 'svelte';
  import { catchError } from '../../stores/errors';
  import {
    createDerivationGroupError,
    createExternalSourceError,
    createExternalSourceTypeError,
    creatingExternalSource,
    externalSources,
    externalSourceTypes,
    getExternalSourceMetadataError,
    parsingError,
    planDerivationGroupLinks,
  } from '../../stores/external-source';
  import { field } from '../../stores/form';
  import { plans } from '../../stores/plans';
  import { plugins } from '../../stores/plugins';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type {
    ExternalEvent,
    ExternalEventInsertInput,
    ExternalEventTypeInsertInput,
  } from '../../types/external-event';
  import {
    type DerivationGroupInsertInput,
    type ExternalSourceDB,
    type ExternalSourceInsertInput,
    type ExternalSourceJson,
    type ExternalSourceSlim,
    type ExternalSourceType,
    type ExternalSourceTypeInsertInput,
    type PlanDerivationGroup,
  } from '../../types/external-source';
  import type { RadioButtonId } from '../../types/radio-buttons';
  import type { TimeRange } from '../../types/timeline';
  import { type MouseDown, type MouseOver } from '../../types/timeline';
  import effects from '../../utilities/effects';
  import { classNames } from '../../utilities/generic';
  import { getRowIdExternalEvent, getRowIdExternalSource, getRowIdExternalSourceSlim } from '../../utilities/hash';
  import { showDeleteExternalSourceModal } from '../../utilities/modal';
  import { permissionHandler } from '../../utilities/permissionHandler';
  import { featurePermissions } from '../../utilities/permissions';
  import { convertDoyToYmd, convertDurationToMs, convertUTCtoMs, formatDate } from '../../utilities/time';
  import { getXScale, TimelineInteractionMode } from '../../utilities/timeline';
  import { showFailureToast } from '../../utilities/toast';
  import { tooltip } from '../../utilities/tooltip';
  import { required, timestamp } from '../../utilities/validators';
  import Collapse from '../Collapse.svelte';
  import ExternalEventForm from '../external-events/ExternalEventForm.svelte';
  import ExternalEventsTable from '../external-events/ExternalEventsTable.svelte';
  import Properties from '../external-events/Properties.svelte';
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
  import DataGridActions from '../ui/DataGrid/DataGridActions.svelte';
  import SingleActionDataGrid from '../ui/DataGrid/SingleActionDataGrid.svelte';
  import DatePicker from '../ui/DatePicker/DatePicker.svelte';
  import Panel from '../ui/Panel.svelte';
  import RadioButton from '../ui/RadioButtons/RadioButton.svelte';
  import RadioButtons from '../ui/RadioButtons/RadioButtons.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';

  export let user: User | null;

  type CellRendererParams = {
    onDeleteExternalSource: (source: ExternalSourceDB) => void;
  };
  type SourceCellRendererParams = ICellRendererParams<ExternalSourceDB> & CellRendererParams;

  // Permissions
  const deletePermissionError = 'You do not have permission to delete an external source.';
  const createPermissionError = 'You do not have permission to create an external source.';

  // UI Grid Sizes
  const gridRowSizesNoBottomPanel = '1fr 3px 0fr';
  const gridRowSizesBottomPanel = '1fr 3px 1fr';
  const uiColumnSize = '1.2fr 3px 4fr';

  let keyInputField: HTMLInputElement; // need this to set a focus on it. not related to the value

  let keyField = field<string>('', [required]);
  let sourceTypeField = field<string>('', [required]); // need function to check if in list of allowable types...
  let derivationGroupField = field<string>('', [required]);
  let startTimeDoyField = field<string>('', [required, timestamp]); // requires validation function
  let endTimeDoyField = field<string>('', [required, timestamp]); // requires validation function
  let validAtDoyField = field<string>('', [required, timestamp]); // requires validation function

  // table variables
  const baseColumnDefs: DataGridColumnDef[] = [
    {
      field: 'key',
      filter: 'text',
      headerName: 'Key',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.pkey) {
          return params.data.pkey.key;
        }
      },
    },
    {
      field: 'source_type',
      filter: 'text',
      headerName: 'Source Type',
      resizable: true,
      sort: 'desc',
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.pkey) {
          return params.data.source_type_name;
        }
      },
    },
    {
      field: 'derivation_group',
      filter: 'text',
      headerName: 'Derivation Group',
      resizable: true,
      sort: 'desc',
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.pkey) {
          return params.data.pkey.derivation_group_name;
        }
      },
    },
    {
      field: 'valid_at',
      filter: 'text',
      headerName: `Valid At (${$plugins.time.primary.label})`,
      resizable: true,
      sort: 'desc',
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.valid_at) {
          return formatDate(new Date(params.data?.valid_at), $plugins.time.primary.format);
        }
      },
    },
    {
      field: 'start_time',
      filter: 'text',
      headerName: `Start Time (${$plugins.time.primary.label})`,
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.start_time) {
          return formatDate(new Date(params.data?.start_time), $plugins.time.primary.format);
        }
      },
    },
    {
      field: 'end_time',
      filter: 'text',
      headerName: `End Time (${$plugins.time.primary.label})`,
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.end_time) {
          return formatDate(new Date(params.data?.end_time), $plugins.time.primary.format);
        }
      },
    },
    {
      field: 'created_at',
      filter: 'text',
      headerName: `Created At (${$plugins.time.primary.label})`,
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.valid_at) {
          return formatDate(new Date(params.data?.created_at), $plugins.time.primary.format);
        }
      },
    },
  ];
  let columnDefs: DataGridColumnDef[] = baseColumnDefs;

  // for external events table
  let externalEventsTableFilterString: string = '';

  // source detail variables
  let selectedSource: ExternalSourceSlim | null = null;
  let selectedSourceId: number | null = null;

  // variables for choosing display format of an external source's external events
  let tableTimelineButtonSelection: RadioButtonId = 'table';
  let showExternalEventTimeline: boolean = false;
  let showExternalEventTable: boolean = true;

  // timeline variables
  let dpr = 0;
  let viewTimeRange: TimeRange = { end: 0, start: 0 };
  let selectedEvent: ExternalEvent | null = null;
  let selectedRowId: number | null = null;
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

  // External event type creation variables
  let externalEventTypeInsertInput: ExternalEventTypeInsertInput;
  let externalEventsCreated: ExternalEventInsertInput[] = [];

  // For filtering purposes (modelled after TimelineEditorLayerFilter):
  let filterMenu: Menu;
  let input: HTMLInputElement;
  let filterString: string = '';
  let filteredValues: ExternalSourceType[] = [];
  let selectedFilters: ExternalSourceType[] = [{ name: '' }];
  let menuTitle: string = '';
  let filteredExternalSources: ExternalSourceSlim[] = [];

  // External source + derivation group creation variables
  let sourceInsert: ExternalSourceInsertInput;
  let sourceTypeInsert: ExternalSourceTypeInsertInput;
  let derivationGroupInsert: DerivationGroupInsertInput;
  let selectedSourceLinkedDerivationGroupsPlans: PlanDerivationGroup[] = [];

  // Permissions
  let hasDeletePermission: boolean = false;
  let hasCreatePermission: boolean = false;

  // There was a strange issue where when:
  //   - you select a source,
  //   - select an event in timeline,
  //   - go to table,
  //   - select a different source,
  //   - select an event,
  //   - then go back to timeline.
  //  The event autodeselected. Some prints led to the discovery that an onMouseDown gets fired, somewhere on the canvas, immediately after selection.
  //  As this mouseDown only occurs after the table switches back to a timeline, a simple boolean check was added to remedy this, saying to ignore
  //    the mouseDown occurring right after a switch from a table to a timeline.
  let mouseDownAfterTable: boolean = false;

  let isDerivationGroupFieldDisabled: boolean = true;

  let gridRowSizes: string = '1fr 3px 0fr';

  // Clear all error stores when a source is selected as they will not be shown
  $: if (selectedSource !== null) {
    createExternalSourceError.set(null);
    createExternalSourceTypeError.set(null);
    createDerivationGroupError.set(null);
    parsingError.set(null);
  }

  $: selectedSourceId = selectedSource ? getRowIdExternalSource(selectedSource.pkey) : null;

  // File parse logic
  $: if (files) {
    // Safeguard against infinitely executing parse logic
    if (file !== files[0]) {
      createExternalSourceError.set(null);
      createExternalSourceTypeError.set(null);
      createDerivationGroupError.set(null);
      parsingError.set(null);
      isDerivationGroupFieldDisabled = true;

      file = files[0];
      const fileText = file.text();
      fileText.then(async text => {
        try {
          parsed = JSON.parse(await text);
          if (parsed) {
            $keyField.value = parsed.source.key;
            $sourceTypeField.value = parsed.source.source_type;
            $startTimeDoyField.value = parsed.source.period.start_time;
            $endTimeDoyField.value = parsed.source.period.end_time;
            $validAtDoyField.value = parsed.source.valid_at;
            $derivationGroupField.value = `${$sourceTypeField.value} Default`; // Include source type name because derivation group names are unique
            isDerivationGroupFieldDisabled = false;
          }
        } catch (e) {
          catchError('External Source has Invalid Format', e as Error);
          showFailureToast('External Source has Invalid Format');
          parsed = undefined;
        }
      });
    }
  }

  // Column definition
  // Why does this need to be reactive..?
  $: columnDefs = [
    ...baseColumnDefs,
    {
      cellClass: 'action-cell-container',
      cellRenderer: (params: SourceCellRendererParams) => {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions-cell';
        new DataGridActions({
          props: {
            deleteCallback: params.onDeleteExternalSource,
            deleteTooltip: {
              content: 'Delete External Source',
              placement: 'bottom',
            },
            hasDeletePermission: hasDeletePermission,
            rowData: params.data,
          },
          target: actionsDiv,
        });

        return actionsDiv;
      },
      cellRendererParams: {
        onDeleteExternalSource,
      } as CellRendererParams,
      field: 'actions',
      headerName: '',
      resizable: false,
      sortable: false,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 25,
    },
  ];

  // Selected elements and values
  // unfortunately very clunky, but it does correctly select all source types on page load as stores populate shortly AFTER the component loads,
  //    so populating selectedFilters with the store values on component load always yields an empty list
  $: if (selectedFilters.length === 1 && selectedFilters[0].name === '' && $externalSourceTypes.length > 0) {
    selectedFilters = [...$externalSourceTypes];
  }
  $: filteredExternalSources = $externalSources.filter(externalSource => {
    return selectedFilters.find(f => f.name === externalSource.source_type_name) !== undefined;
  });
  $: filteredValues = $externalSourceTypes.filter(externalSourceType =>
    externalSourceType.name.toLowerCase().includes(filterString),
  );
  $: filteredTableExternalEvents = selectedEvents.filter(event => {
    const filterTextLowerCase = externalEventsTableFilterString.toLowerCase();
    const includesName = externalEventsTableFilterString.length
      ? event.pkey.key.toLocaleLowerCase().includes(filterTextLowerCase)
      : true;
    return includesName;
  });
  $: effects.getExternalEvents(selectedSource ? selectedSource.pkey : null, user).then(
    fetched =>
      (selectedEvents = fetched.map(eDB => {
        return {
          ...eDB,
          duration_ms: convertDurationToMs(eDB.duration),
          event_type: eDB.pkey.event_type_name,
          start_ms: convertUTCtoMs(eDB.start_time),
        };
      })),
  );
  $: selectedSourceLinkedDerivationGroupsPlans = $planDerivationGroupLinks.filter(planDerivationGroupLink => {
    return planDerivationGroupLink.derivation_group_name === selectedSource?.pkey.derivation_group_name;
  });

  // Timeline
  $: startTime = selectedSource ? new Date(selectedSource.start_time) : new Date();
  $: endTime = selectedSource ? new Date(selectedSource.end_time) : new Date();
  $: viewTimeRange = { end: endTime.getTime(), start: startTime.getTime() };
  $: xDomainView = [startTime, endTime];
  $: xScaleView = getXScale(xDomainView, 500);

  // Permissions
  $: hasDeletePermission = featurePermissions.externalSource.canDelete(user);
  $: hasCreatePermission = featurePermissions.externalSource.canCreate(user);

  onMount(() => {
    detectDPRChange();
  });

  onDestroy(() => {
    if (removeDPRChangeListener !== null) {
      removeDPRChangeListener();
    }
  });

  function onSelectTableTimeline(event: CustomEvent<{ id: RadioButtonId }>) {
    const {
      detail: { id },
    } = event;
    tableTimelineButtonSelection = id;
    if (tableTimelineButtonSelection === 'table') {
      showExternalEventTable = true;
      showExternalEventTimeline = false;
      externalEventsTableFilterString = '';
      selectedRowId = selectedEvent ? getRowIdExternalEvent(selectedEvent.pkey) : null;
    } else {
      showExternalEventTable = false;
      showExternalEventTimeline = true;
      externalEventsTableFilterString = '';
      mouseDownAfterTable = true;
    }
  }

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

  async function onDeleteExternalSource(selectedSource: ExternalSourceSlim | null | undefined) {
    if (selectedSource !== null && selectedSource !== undefined) {
      // selectedSource here does not necessarily align with global selected source, especially if you click delete
      //    in a table without making a selection. as such, can't use selectedSourceLinkedDerivationGroupsPlans, must
      //    make a new one.
      let currentlyLinked = $planDerivationGroupLinks.filter(planDerivationGroupLink => {
        return planDerivationGroupLink.derivation_group_name === selectedSource?.pkey.derivation_group_name;
      });
      if (currentlyLinked.length > 0) {
        // if the source is in a derivation group currently used by a plan, warn that we cannot delete
        await showDeleteExternalSourceModal(currentlyLinked, selectedSource);
      } else {
        // otherwise, delete!
        const deletionWasSuccessful = await effects.deleteExternalSource(selectedSource, user);
        if (deletionWasSuccessful) {
          deselectSource();
        }
      }
    }
  }

  async function onFormSubmit(_e: SubmitEvent) {
    if (parsed && file) {
      // Setup insert inputs for Hasura mutations
      // External Source Type
      sourceTypeInsert = {
        name: $sourceTypeField.value,
      };

      // Derivation Group
      derivationGroupInsert = {
        name:
          $derivationGroupField.value.length !== 0 ? $derivationGroupField.value : `${sourceTypeInsert.name} Default`,
        source_type_name: sourceTypeInsert.name,
      };

      // External Source
      const start_time: string | undefined = convertDoyToYmd($startTimeDoyField.value.replaceAll('Z', ''))?.replace(
        'Z',
        '+00:00',
      );
      const end_time: string | undefined = convertDoyToYmd($endTimeDoyField.value.replaceAll('Z', ''))?.replace(
        'Z',
        '+00:00',
      );
      const valid_at: string | undefined = convertDoyToYmd($validAtDoyField.value.replaceAll('Z', ''))?.replace(
        'Z',
        '+00:00',
      );
      if (!start_time || !end_time || !valid_at) {
        showFailureToast('Parsing failed.');
        parsingError.set(`Parsing failed - parsing dates in input failed. ${start_time}, ${end_time}, ${valid_at}`);
        return;
      }
      if (new Date(start_time) > new Date(end_time)) {
        showFailureToast('Parsing failed.');
        parsingError.set(`Parsing failed - start time ${start_time} after end time ${end_time}.`);
        return;
      }
      sourceInsert = {
        derivation_group_name: derivationGroupInsert.name,
        end_time,
        external_events: {
          data: null, // updated after this map is created
        },
        key: $keyField.value,
        metadata: parsed.source.metadata,
        source_type_name: sourceTypeInsert.name,
        start_time,
        valid_at,
      };

      // External Event Types + External Events
      let externalEventTypeInputs: ExternalEventTypeInsertInput[] = [];
      if (parsed.events) {
        for (let externalEvent of parsed.events) {
          externalEventTypeInsertInput = {
            name: externalEvent.event_type,
          };
          externalEventTypeInputs.push(externalEventTypeInsertInput);

          // Ensure the duration is valid
          try {
            convertDurationToMs(externalEvent.duration);
          } catch (e) {
            showFailureToast('Parsing failed.');
            catchError(`Event duration has invalid format... ${externalEvent.key}\n`, e as Error);
            return;
          }

          // Validate external event is in the source's start/stop bounds
          let parsedStart = Date.parse(convertDoyToYmd(externalEvent.start_time.replace('Z', '')) ?? '');
          let parsedEnd = parsedStart + convertDurationToMs(externalEvent.duration);
          let parsedStartWhole = Date.parse(start_time);
          let parsedEndWhole = Date.parse(end_time);
          if (!(parsedStart >= parsedStartWhole && parsedEnd <= parsedEndWhole)) {
            showFailureToast('Parsing failed.');
            parsingError.set(
              `Upload failed. Event (${externalEvent.key}) not in bounds of source start and end: occurs from [${new Date(parsedStart)},${new Date(parsedEnd)}], not subset of [${new Date(parsedStartWhole)},${new Date(parsedEndWhole)}].\n`,
            );
            return;
          }

          // If the event is valid...
          if (
            externalEvent.event_type !== undefined &&
            externalEvent.start_time !== undefined &&
            externalEvent.duration !== undefined
          ) {
            // We have this extra split out step as our JSON/DB-compatible hybrids at this point contain both
            //      event_type and event_type_id, but the database can only accept event_type_id, so this step drops event_type
            const { event_type, ...db_compatible_fields } = externalEvent;

            // extra, optional step to only take stuff that the database can accept in. Eventually, can be handled by JSON Schema, see comment in external-event.ts
            const { duration, key, properties, start_time } = db_compatible_fields;

            externalEventsCreated.push({
              duration: duration,
              event_type_name: externalEvent.event_type,
              key: key,
              properties: properties,
              start_time: start_time,
            });
          }
        }
      }
      sourceInsert.external_events.data = externalEventsCreated;
      externalEventsCreated = [];

      // Perform Hasura mutation to create external source
      // let createExternalSourceResponse: {
      //     createExternalSource: { id: number },
      //     upsertDerivationGroup: { name: string },
      //     upsertExternalEventType: { name: string },
      //     upsertExternalSourceType: { id: number, name: string },

      //   } | undefined = undefined;
      let createExternalSourceResponse: Record<string, any> | undefined = undefined;
      if (file !== undefined) {
        sourceInsert.source_type_name = sourceTypeInsert.name;
        sourceInsert.derivation_group_name = derivationGroupInsert.name;
        createExternalSourceResponse = await effects.createExternalSource(
          derivationGroupInsert,
          sourceInsert,
          sourceTypeInsert,
          externalEventTypeInputs,
          user,
        );
        // Following a successful mutation...
        if (createExternalSourceResponse !== undefined) {
          // Manipulate current filter to ensure the newly uploaded external source's type is included
          if (selectedFilters.find(filter => filter.name === sourceTypeInsert.name) === undefined) {
            if (createExternalSourceResponse.upsertExternalSourceType?.name !== undefined) {
              selectedFilters.push(createExternalSourceResponse.upsertExternalSourceType as ExternalSourceType);
            }
          }
          
          // Auto-select the new source
          selectedSource = {
            created_at: new Date().toISOString().replace('Z', '+00:00'), // technically not the exact time it shows up in the database
            end_time: sourceInsert.end_time,
            pkey: {
              derivation_group_name: derivationGroupInsert.name,
              key: sourceInsert.key,
            },
            source_type_name: sourceTypeInsert.name,
            start_time: sourceInsert.start_time,
            valid_at: sourceInsert.valid_at,
          };
          gridRowSizes = gridRowSizesBottomPanel;
        }
      }
    } else {
      showFailureToast('Upload failed.');
    }
    // Reset the form behind the source
    parsed = undefined;
    keyField.reset('');
    sourceTypeField.reset('');
    startTimeDoyField.reset('');
    endTimeDoyField.reset('');
    validAtDoyField.reset('');
    derivationGroupField.reset('');
  }

  async function selectSource(detail: ExternalSourceSlim) {
    selectedSource = detail;
    gridRowSizes = gridRowSizesBottomPanel;
    deselectEvent();
    eventTooltip.reset();
  }

  function deselectSource() {
    deselectEvent();
    eventTooltip.reset();
    gridRowSizes = gridRowSizesNoBottomPanel;
    selectedSource = null;
  }

  function deselectEvent() {
    selectedEvent = null;
    selectedRowId = null;
  }

  function onCanvasMouseDown(e: CustomEvent<MouseDown>) {
    if (!mouseDownAfterTable) {
      const { externalEvents } = e.detail;
      // selectedEvent is our source of an ExternalEvent as well as the ExternalEventId used by this instance
      //    of the LayerExternalSources (as opposed to using a store, like the timeline one does, which is
      //    unnecessary as everything we need is in on single component or can be passed down via parameters to
      //    children).
      selectedEvent = externalEvents?.length ? externalEvents[0] : null;
      selectedRowId = null;
    } else {
      mouseDownAfterTable = false;
    }
  }

  function onCanvasMouseOver(e: CustomEvent<MouseOver>) {
    mouseOver = e.detail; // Allows tooltip to access object
  }

  function toggleItem(value: ExternalSourceType) {
    if (!selectedFilters.find(f => f.name === value.name)) {
      selectedFilters = selectedFilters.concat(value);
    } else {
      selectedFilters = selectedFilters.filter(filter => filter.name !== value.name);
    }
  }

  function unselectFilteredValues() {
    selectedFilters = [];
  }

  function selectFilteredValues() {
    selectedFilters = [...new Set([...selectedFilters, ...filteredValues])];
  }

  function onSelectionChanged() {
    selectedEvent = selectedEvents.find(event => getRowIdExternalEvent(event.pkey) === selectedRowId) ?? null;
  }

  function onManageGroupsAndTypes() {
    effects.manageGroupsAndTypes(user);
  }
</script>

<CssGrid columns={uiColumnSize}>
  <Panel borderRight padBody={true}>
    <svelte:fragment slot="header">
      <SectionTitle
        >{selectedEvent
          ? `Selected Event (${selectedEvent.pkey.key})`
          : selectedSource
            ? `Selected External Source (${selectedSource.pkey.key})`
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
        <ExternalEventForm externalEvent={selectedEvent} showHeader={true} />
      {:else if selectedSource}
        <div class="external-source-header">
          <div class={classNames('external-source-header-title')}>
            <div class="external-source-header-title-value st-typography-medium">
              {selectedSource.pkey.key}
            </div>
          </div>
        </div>
        <div class="selected-source-forms">
          <fieldset>
            <Input layout="inline">
              Source Type
              <input
                class="st-input w-100"
                disabled={true}
                name="source-type"
                value={selectedSource.source_type_name}
              />
            </Input>

            <Input layout="inline">
              Derivation Group
              <input
                class="st-input w-100"
                disabled={true}
                name="derivation-group"
                value={selectedSource.pkey.derivation_group_name}
              />
            </Input>

            <Input layout="inline">
              {`Start Time (${$plugins.time.primary.label})`}
              <DatePicker
                dateString={formatDate(new Date(selectedSource.start_time), $plugins.time.primary.format)}
                disabled={true}
                name="start-time"
              />
            </Input>

            <Input layout="inline">
              {`End Time (${$plugins.time.primary.label})`}
              <DatePicker
                dateString={formatDate(new Date(selectedSource.end_time), $plugins.time.primary.format)}
                disabled={true}
                name="end-time"
              />
            </Input>

            <Input layout="inline">
              {`Valid At (${$plugins.time.primary.label})`}
              <DatePicker
                dateString={formatDate(new Date(selectedSource.valid_at), $plugins.time.primary.format)}
                disabled={true}
                name="valid-at"
              />
            </Input>

            <Input layout="inline">
              {`Created At (${$plugins.time.primary.label})`}
              <DatePicker
                dateString={formatDate(new Date(selectedSource.created_at), $plugins.time.primary.format)}
                disabled={true}
                name="valid-at"
              />
            </Input>

            <Collapse
              className="anchor-collapse"
              defaultExpanded={false}
              title="Event Types"
              tooltipContent="View Contained Event Types"
            >
              {#await effects.getExternalEventTypesBySource(selectedSource.pkey, user)}
                <i>Loading...</i>
              {:then eventTypes}
                {#each eventTypes as eventType}
                  <i>{eventType}</i>
                {/each}
              {/await}
            </Collapse>
          </fieldset>

          <Collapse
            className="anchor-collapse"
            defaultExpanded={false}
            title="Metadata"
            tooltipContent="View Event Source Metadata"
          >
            {#await effects.getExternalSourceMetadata(selectedSource.pkey, user)}
              <em>loading metadata...</em>
            {:then metadata}
              {#if Object.keys(metadata).length}
                <Properties
                  formProperties={Object.entries(metadata).map(e => {
                    return { name: e[0], value: e[1] };
                  })}
                />
              {:else if $getExternalSourceMetadataError}
                <em>Failed to retrieve External Source metadata.</em>
              {:else}
                <em>Source has no metadata.</em>
              {/if}
            {:catch error}
              <em>error loading metadata...try refreshing the page.</em>
              {catchError(error)}
            {/await}
          </Collapse>
          <div style="padding-bottom:20px">
            <Collapse
              className="used-in-plans-collapse"
              defaultExpanded={false}
              title="Used in plans"
              tooltipContent="View plans this source is used in"
            >
              {#if selectedSourceLinkedDerivationGroupsPlans.length > 0}
                {#each selectedSourceLinkedDerivationGroupsPlans as linkedPlanDerivationGroup}
                  <i>
                    <a href="{base}/plans/{linkedPlanDerivationGroup.plan_id}">
                      {$plans.find(plan => {
                        return linkedPlanDerivationGroup.plan_id === plan.id;
                      })?.name}
                    </a></i
                  >
                {/each}
              {:else}
                <i>Not used in any plans</i>
              {/if}
            </Collapse>
          </div>
          <button
            class="st-button danger w-100"
            style="margin-bottom:auto;"
            use:permissionHandler={{
              hasPermission: hasDeletePermission,
              permissionError: deletePermissionError,
            }}
            on:click|stopPropagation={async () => onDeleteExternalSource(selectedSource)}
          >
            Delete external source
          </button>
        </div>
      {:else}
        <form
          on:submit|preventDefault={onFormSubmit}
          on:reset={() => {
            parsed = undefined;
            $createExternalSourceError = null;
            $createExternalSourceTypeError = null;
            $createDerivationGroupError = null;
            $parsingError = null;
            isDerivationGroupFieldDisabled = true;
          }}
        >
          <AlertError class="m-2" error={$createExternalSourceError} />
          <AlertError class="m-2" error={$createExternalSourceTypeError} />
          <AlertError class="m-2" error={$createDerivationGroupError} />
          <AlertError class="m-2" error={$parsingError} />
          <div id="file-upload-field">
            <fieldset style="width:100%">
              <label for="file">Source File</label>
              <input
                class="w-100"
                name="file"
                required
                type="file"
                bind:files
                use:permissionHandler={{
                  hasPermission: hasCreatePermission,
                  permissionError: createPermissionError,
                }}
              />
            </fieldset>

            <fieldset id="file-upload-fieldset">
              <button
                disabled={!parsed}
                class="st-button w-100"
                type="submit"
                use:permissionHandler={{
                  hasPermission: hasCreatePermission,
                  permissionError: createPermissionError,
                }}
              >
                {$creatingExternalSource ? 'Uploading...' : 'Upload'}
              </button>
              {#if parsed}
                <div style="padding-top:10px">
                  <button class="st-button w-100" type="reset">Dismiss</button>
                </div>
              {/if}
            </fieldset>
          </div>
          <Field field={derivationGroupField}>
            <label for="derivation-group" slot="label">Derivation Group</label>
            <input
              autocomplete="off"
              class="st-input w-100"
              name="derivation-group"
              disabled={isDerivationGroupFieldDisabled}
            />
          </Field>
          <Field field={keyField}>
            <label for="key" slot="label">Key</label>
            <input disabled bind:value={keyInputField} autocomplete="off" class="st-input w-100" name="key" required />
          </Field>

          <Field field={sourceTypeField}>
            <label for="source-type" slot="label">Source Type</label>
            <input disabled autocomplete="off" class="st-input w-100" name="source-type" required />
          </Field>

          <fieldset>
            <DatePickerField
              disabled={true}
              field={startTimeDoyField}
              label={`Start Time (${$plugins.time.primary.label}) - ${$plugins.time.primary.formatString}`}
              name="start-time"
            />
          </fieldset>

          <fieldset>
            <DatePickerField
              disabled={true}
              field={endTimeDoyField}
              label={`End Time (${$plugins.time.primary.label}) - ${$plugins.time.primary.formatString}`}
              name="end_time"
            />
          </fieldset>

          <fieldset>
            <DatePickerField
              disabled={true}
              field={validAtDoyField}
              label={`Valid At Time (${$plugins.time.primary.label}) - ${$plugins.time.primary.formatString}`}
              name="valid_at"
            />
          </fieldset>
        </form>
      {/if}
    </svelte:fragment>
  </Panel>

  <CssGridGutter track={1} type="column" />

  <CssGrid rows={gridRowSizes}>
    <!-- External Source Table -->
    <Panel padBody={true}>
      <svelte:fragment slot="header">
        <slot name="left">
          <SectionTitle><Truck />External Sources</SectionTitle>
          <div class="filter">
            <div class="timeline-editor-layer-filter">
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
              </Input>
              <Menu
                hideAfterClick={false}
                bind:this={filterMenu}
                placement="bottom-start"
                on:hide={() => (filterString = '')}
              >
                <div class="menu-content">
                  <MenuHeader title={menuTitle} />
                  <div class="body st-typography-body">
                    {#if filteredValues.length}
                      <div class="values">
                        {#each filteredValues as filteredSourceType}
                          <button
                            class="value st-button tertiary st-typography-body"
                            on:click={() => toggleItem(filteredSourceType)}
                            class:active={selectedFilters.map(f => f.name).find(f => f === filteredSourceType.name) !==
                              undefined}
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
                    <button
                      class="st-button secondary list-button"
                      id="source-filters-select-all"
                      on:click={selectFilteredValues}
                    >
                      Select {filteredValues.length}
                      {#if filteredValues.length === 1}
                        {'external source type'}
                      {:else}
                        {'external source types'}
                      {/if}
                    </button>
                    <button class="st-button secondary list-button" on:click={unselectFilteredValues}
                      >Unselect all</button
                    >
                  </div>
                </div>
              </Menu>
            </div>
          </div>
        </slot>
        <slot name="right">
          <button
            name="manage-derivation-groups"
            class="st-button secondary"
            on:click|stopPropagation={onManageGroupsAndTypes}
            use:tooltip={{
              content: 'Manage derivation groups, external source types, and external event types.',
              placement: 'top',
            }}
          >
            Manage Groups and Types
          </button>
        </slot>
      </svelte:fragment>
      <svelte:fragment slot="body">
        {#if $externalSources.length}
          <SingleActionDataGrid
            {columnDefs}
            {hasDeletePermission}
            itemDisplayText="External Source"
            items={filteredExternalSources}
            {user}
            getRowId={getRowIdExternalSourceSlim}
            on:rowClicked={({ detail }) => selectSource(detail.data)}
            bind:selectedItemId={selectedSourceId}
          />
        {:else}
          <p>No external sources matching the selected external source type(s).</p>
        {/if}
      </svelte:fragment>
    </Panel>

    <!--
      -- Tooltip only applies to timeline, but to ensure it resets and doesn't unexpectedly show up when the timeline isn't selected,
      --      had to be moved here and had to add calls to reset
      --      in various locations.
      -->
    <Tooltip
      bind:this={eventTooltip}
      {mouseOver}
      interpolateHoverValue={false}
      hidden={!!selectedSource && !showExternalEventTimeline}
      resourceTypes={[]}
    />

    {#if selectedSource}
      <CssGridGutter track={1} type="row" />

      <!-- External Event Table/Timeline -->
      <Panel padBody={true}>
        <svelte:fragment slot="header">
          <slot name="left">
            <SectionTitle><Balloon />External Events</SectionTitle>
            {#if showExternalEventTable}
              <div class="filter">
                <div class="timeline-editor-layer-filter">
                  <Input>
                    <input
                      bind:value={externalEventsTableFilterString}
                      autocomplete="off"
                      class="st-input w-100"
                      name="filter-ee"
                      placeholder={'Filter external events'}
                    />
                  </Input>
                </div>
              </div>
            {/if}
            <div style="width:13%">
              <RadioButtons
                selectedButtonId={tableTimelineButtonSelection}
                on:select-radio-button={onSelectTableTimeline}
              >
                <RadioButton id="table">
                  <div class="association-button">Table</div>
                </RadioButton>
                <RadioButton id="timeline">
                  <div class="association-button">Timeline</div>
                </RadioButton>
              </RadioButtons>
            </div>
          </slot>
        </svelte:fragment>
        <svelte:fragment slot="body">
          {#if selectedSource}
            {#if showExternalEventTable}
              <div id="external-event-table">
                <ExternalEventsTable
                  items={filteredTableExternalEvents}
                  {user}
                  bind:selectedItemId={selectedRowId}
                  on:selectionChanged={onSelectionChanged}
                  on:rowDoubleClicked={onSelectionChanged}
                />
              </div>
            {:else if showExternalEventTimeline}
              <div id="external-event-timeline">
                <div style=" background-color:#ebe9e6;height:15px;">
                  <div style="display:inline; float:left;">{startTime}</div>
                  <div style="display:inline; float:right;">{endTime}</div>
                </div>
                <div
                  id="external-event-timeline-container"
                  bind:this={canvasContainerRef}
                  bind:clientWidth={canvasContainerWidth}
                  bind:clientHeight={canvasContainerHeight}
                  on:mouseleave={() => {
                    eventTooltip.reset();
                  }}
                  on:mousedown={e => {
                    canvasMouseDownEvent = e;
                  }}
                  on:mousemove={e => {
                    canvasMouseOverEvent = e;
                  }}
                  role="none"
                >
                  <TimelineCursors marginLeft={0} drawWidth={canvasContainerWidth} {mouseOver} {xScaleView} />

                  <div id="timeline-layer">
                    <LayerExternalSources
                      selectedExternalEventId={selectedEvent ? getRowIdExternalEvent(selectedEvent.pkey) : null}
                      externalEvents={selectedEvents}
                      {viewTimeRange}
                      {xScaleView}
                      {dpr}
                      mousedown={canvasMouseDownEvent}
                      drawHeight={canvasContainerHeight - 3 - 10 ?? 200}
                      drawWidth={canvasContainerWidth ?? 200}
                      timelineInteractionMode={TimelineInteractionMode.Interact}
                      on:mouseDown={onCanvasMouseDown}
                      on:mouseOver={onCanvasMouseOver}
                      mousemove={canvasMouseOverEvent}
                      mouseout={undefined}
                      contextmenu={undefined}
                      dblclick={undefined}
                    />
                  </div>
                </div>
              </div>
            {/if}
          {:else if $externalSources.length}
            <p style="padding-left: 5px">Select a source to view contents.</p>
          {:else}
            <p style="padding-left: 5px">No External Sources present.</p>
          {/if}
        </svelte:fragment>
      </Panel>
    {/if}
  </CssGrid>
</CssGrid>

<style>
  :global(.plan-grid) {
    overflow: auto;
  }
  .filter {
    margin: 0.8rem 0;
  }

  :global(.source-grid) {
    height: 100%;
    width: 100%;
  }
  .timeline-editor-layer-filter {
    display: flex;
    position: relative;
  }

  .timeline-editor-layer-filter :global(.input) {
    z-index: 1;
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

  .btn-group {
    align-self: center;
    margin-left: auto;
  }

  #file-upload-field {
    display: flex;
    white-space: nowrap;
  }

  #file-upload-fieldset {
    align-self: flex-end;
    float: right;
    width: 60%;
  }

  #timeline-layer {
    display: flex;
    padding-bottom: 10px;
    padding-top: 3px;
  }

  #external-event-table {
    height: 100%;
    position: relative;
    width: 100%;
  }

  #external-event-timeline {
    height: 100%;
    padding-left: 5px;
    padding-right: 5px;
  }

  #external-event-timeline-container {
    height: 100%;
    position: relative;
    width: 100%;
  }

  .filter {
    float: left;
    margin-right: auto;
    padding-left: 5px;
    padding-right: 5px;
  }

  .selected-source-forms {
    height: 100%;
  }
</style>
