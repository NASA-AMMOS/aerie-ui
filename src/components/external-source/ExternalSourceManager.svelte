<script lang="ts">
  import type { ICellRendererParams, RowClassParams, RowStyle, ValueGetterParams } from 'ag-grid-community';
  import Balloon from 'bootstrap-icons/icons/balloon.svg?component';
  import SearchIcon from 'bootstrap-icons/icons/search.svg?component';
  import Truck from 'bootstrap-icons/icons/truck.svg?component';
  import XIcon from 'bootstrap-icons/icons/x.svg?component';
  import { onDestroy, onMount } from 'svelte';
  import { catchError } from '../../stores/errors';
  import { externalEventTypes, getEventTypeName } from '../../stores/external-event';
  import { createDerivationGroupError, createExternalSourceError, createExternalSourceEventTypeLinkError, createExternalSourceTypeError, creatingExternalSource, deletedSourcesSeen, derivationGroups, externalSourceTypes, externalSourceWithResolvedNames, getDerivationGroupByNameSourceTypeId, getEventSourceTypeByName, planDerivationGroupLinks, unseenSources } from '../../stores/external-source';
  import { field } from '../../stores/form';
  import { plans } from '../../stores/plans';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { ExternalEvent, ExternalEventDB, ExternalEventType, ExternalEventTypeInsertInput } from '../../types/external-event';
  import type { DerivationGroup, DerivationGroupInsertInput, ExternalSourceInsertInput, ExternalSourceJson, ExternalSourceType, ExternalSourceTypeInsertInput, ExternalSourceWithDateInfo, ExternalSourceWithResolvedNames, PlanDerivationGroup } from '../../types/external-source';
  import type { TimeRange } from '../../types/timeline';
  import { type MouseDown, type MouseOver } from '../../types/timeline';
  import effects from '../../utilities/effects';
  import { classNames } from '../../utilities/generic';
  import { permissionHandler } from '../../utilities/permissionHandler';
  import { featurePermissions } from '../../utilities/permissions';
  import { convertDoyToYmd, convertDurationToMs, convertUTCtoMs } from '../../utilities/time';
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
  import SectionTitle from '../ui/SectionTitle.svelte';


  export let user: User | null;


  type CellRendererParams = {
    onDeleteExternalSource: (source: ExternalSourceWithResolvedNames) => void;
  };
  type SourceCellRendererParams = ICellRendererParams<ExternalSourceWithResolvedNames> & CellRendererParams;

  const deletePermissionError = 'You do not have permission to delete an external source.';
  const createPermissionError = 'You do not have permission to create an external source.';

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
      field: 'id',
      filter: 'number',
      headerName: 'ID',
      resizable: true,
      sortable: true,
      width: 70
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
      field: 'derivation_group',
      filter: 'text',
      headerName: 'Derivation Group',
      resizable: true,
      sortable: true,
    },
    {
      field: 'file_id',
      filter: 'number',
      headerName: 'File ID',
      resizable: true,
      sortable: true,
      width: 120
    },
    {
      field: 'start_time',
      filter: 'text',
      headerName: 'Start Time',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceWithResolvedNames>) => {
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
      valueGetter: (params: ValueGetterParams<ExternalSourceWithResolvedNames>) => {
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
      valueGetter: (params: ValueGetterParams<ExternalSourceWithResolvedNames>) => {
        if (params.data?.valid_at) {
          return new Date(params.data?.valid_at).toISOString().slice(0, 19);
        }
      },
    },
    {
      field: 'created_at',
      filter: 'text',
      headerName: 'Created At',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceWithResolvedNames>) => {
        if (params.data?.valid_at) {
          return new Date(params.data?.valid_at).toISOString().slice(0, 19);
        }
      },
    }
  ];
  let columnDefs: DataGridColumnDef[] = baseColumnDefs;

  // for external events table
  let externalEventsTableFilterString: string = '';

  // source detail variables
  let selectedSource: ExternalSourceWithResolvedNames | null = null;
  let selectedSourceId: number | null = null;

  // variables for choosing display format of an external source's external events
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

  // external event type creation variables
  let externalEventTypeInsertInput: ExternalEventTypeInsertInput;
  let externalEventsCreated: ExternalEventDB[] = [];

  // For filtering purposes (modelled after TimelineEditorLayerFilter):
  let filterMenu: Menu;
  let input: HTMLInputElement;
  let filterString: string = '';
  let filteredValues: ExternalSourceType[] = [];
  let selectedFilters: ExternalSourceType[] = [...$externalSourceTypes];
  let menuTitle: string = '';
  let filteredExternalSources: ExternalSourceWithResolvedNames[] = [];

  let sourceInsert: ExternalSourceInsertInput;
  let sourceTypeInsert: ExternalSourceTypeInsertInput;
  let derivationGroupInsert: DerivationGroupInsertInput;
  let selectedSourceLinkedDerivationGroupsPlans: PlanDerivationGroup[] = [];

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

  let gridRowSizes: string = "1fr 3px 0fr";

  $: if (files) {
    // files repeatedly refreshes, meaning the reaction to file and parsed keeps repeating infinitely. This if statement prevents that.
    if (file !== files[0]) {
      // Reset creation errors when a new file is set
      $createExternalSourceError = null;
      $createExternalSourceTypeError = null;
      $createDerivationGroupError = null;
      $createExternalSourceEventTypeLinkError = null;
      isDerivationGroupFieldDisabled = true;

      file = files[0];
      const fileText = file.text();
      fileText.then(async text => {
        parsed = JSON.parse(await text);
        if (parsed) {
          // TODO: replace try/catch with actual JSONSchema logic
          try {
            $keyField.value = parsed.source.key;
            $sourceTypeField.value = parsed.source.source_type;
            $startTimeDoyField.value = parsed.source.period.start_time;
            $endTimeDoyField.value = parsed.source.period.end_time;
            $validAtDoyField.value = parsed.source.valid_at;
            isDerivationGroupFieldDisabled = false;
          }
          catch (e) {
            catchError('External Source has Invalid Format', e as Error);
            showFailureToast('External Source has Invalid Format');
            parsed = undefined;
          }
        }
      });
    }
  }

  $: selectedSourceId = selectedSource ? selectedSource.id : null;

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

  $: startTime = selectedSource ? new Date(selectedSource.start_time) : new Date();
  $: endTime = selectedSource ? new Date(selectedSource.end_time) : new Date();
  $: viewTimeRange = { end: endTime.getTime(), start: startTime.getTime() }
  $: xDomainView = [startTime, endTime];
  $: xScaleView = getXScale(xDomainView, 500);

  $: filteredExternalSources = $externalSourceWithResolvedNames.filter(externalSource => {
    return selectedFilters.find(f => f.name === externalSource.source_type) !== undefined
  });
  $: filteredValues = $externalSourceTypes.filter(externalSourceType => externalSourceType.name.toLowerCase().includes(filterString))
  $: filteredTableExternalEvents = selectedEvents
    .filter(event => {
      const filterTextLowerCase = externalEventsTableFilterString.toLowerCase();
      const includesName = externalEventsTableFilterString.length ? event.key.toLocaleLowerCase().includes(filterTextLowerCase) : true;
      return includesName;
    });

  $: effects.getExternalEvents(selectedSource?.id, user).then(fetched => selectedEvents = fetched.map(eDB => {
    return {
      ...eDB,
      durationMs: convertDurationToMs(eDB.duration),
      event_type: getEventTypeName(eDB.event_type_id, $externalEventTypes),
      startMs: convertUTCtoMs(eDB.start_time),
    }
  }));

  $: selectedSourceLinkedDerivationGroupsPlans = $planDerivationGroupLinks.filter(planDerivationGroupLink => {
    return planDerivationGroupLink.derivation_group_id === selectedSource?.derivation_group_id
  })

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

  async function onDeleteExternalSource(selectedSource: ExternalSourceWithResolvedNames | null | undefined) {
    if (selectedSource !== null && selectedSource !== undefined) {
      const deletedSourceEventTypes = await effects.getExternalEventTypesBySource(selectedSourceId ? [selectedSourceId] : [], $externalEventTypes, user);
      const deletionWasSuccessful = await effects.deleteExternalSource(selectedSource, user);
      if (deletionWasSuccessful) {
        deselectSource();

        // persist to list of unseen deletions, with a deleted_at time
        let deletedSourcesParsed: ExternalSourceWithDateInfo[] = JSON.parse($deletedSourcesSeen);
        deletedSourcesSeen.set(JSON.stringify(deletedSourcesParsed.concat({...selectedSource, change_date: new Date()})));
        // in case it was added and then immediately deleted, though, remove it from both unseenSources and deletedSourcesParsed, to not confuse the user
        {
          let seenSourcesParsed: ExternalSourceWithDateInfo[] = JSON.parse($unseenSources);
          let filtered = seenSourcesParsed.filter(s => s.id != selectedSource.id)
          if (filtered.length != seenSourcesParsed.length) {
            unseenSources.set(JSON.stringify(filtered));
            deletedSourcesSeen.set(JSON.stringify(deletedSourcesParsed.filter(s => s.id != selectedSource.id)))
          }
          // NOTE: if I add a source, go to plans, DON'T ACKNOWLEDGE IT, then delete that source, and go back to plans, the warning card is gone as the 
          //    system assumes I never got the first notification and as such the second is unnecessary as I never acknowledged knowing it was added, so 
          //    it won't warn me that it was deleted.
        }

        // Determine if there are no remaining external sources that use the type of the source that was just deleted. If there are none, delete the source type
        // NOTE: This work could be moved to Hasura in the future, or re-worked as it might be costly.
        const sourceTypesInUse = Array.from(new Set($externalSourceWithResolvedNames.map(s => s.source_type_id)).values())
        const unusedSourceTypeIds = $externalSourceTypes.filter(st => !sourceTypesInUse.includes(st.id)).map(st => st.id)
        for (const unusedSourceTypeId of unusedSourceTypeIds) {
          await effects.deleteExternalSourceType(unusedSourceTypeId, user);
        }

        // Determine if there are no remaining external events that use the types contained in the now-deleted external source. If there are none, delete the external event type
        deletedSourceEventTypes.forEach(async (eventType) => {
          const externalEventsWithThisType = await effects.getExternalEventsByEventType(eventType, user);
          if (externalEventsWithThisType.length === 0) {
            await effects.deleteExternalEventType(eventType.id, user);
          }
        });

        // Determine if the derivation group this source belonged to is now empty, if so delete it
        // NOTE: This work could be moved to Hasura in the future, or re-worked as it might be costly.
        const emptyDerivationGroups = $derivationGroups.filter(derivationGroup => {
          return derivationGroup.sources.size === 0;
        })
        if (emptyDerivationGroups.length > 0) {
          for await (const derivationGroup of emptyDerivationGroups) {
            await effects.deleteDerivationGroup(derivationGroup.id, user);
          }
        }
      }
    }
  }

  async function onFormSubmit(_e: SubmitEvent) {
    if (parsed && file) {
      // Create an entry for the current source type if it does not already exist. Otherwise, retrieve the id
      if (!($externalSourceTypes.some(externalSourceType => externalSourceType.name === $sourceTypeField.value))) {
        sourceTypeInsert = {
          name: $sourceTypeField.value
        };
      }

      // Create an entry for the derivation group
      let derivationGroupName = $derivationGroupField.value;
      if(derivationGroupName.length === 0) {
        derivationGroupName = "Default"
      }
      derivationGroupInsert = {
        name: derivationGroupName,
        source_type_id: -1 // filled in later
      };

      // create the source object to upload to AERIE
      const start_time: string | undefined = convertDoyToYmd($startTimeDoyField.value.replaceAll("Z", ""))?.replace("Z", "+00:00")
      const end_time: string | undefined = convertDoyToYmd($endTimeDoyField.value.replaceAll("Z", ""))?.replace("Z", "+00:00")
      const valid_at: string | undefined = convertDoyToYmd($validAtDoyField.value.replaceAll("Z", "")) + "+00:00"
      if (!start_time || !end_time || !valid_at) {
        showFailureToast("Upload failed.")
        console.log(`Upload failed - parsing dates in input failed. ${start_time}, ${end_time}, ${valid_at}`)
        return
      }
      if (new Date(start_time) > new Date(end_time)) {
        showFailureToast("Upload failed.")
        console.log(`Upload failed - start time ${start_time} after end time ${end_time}.`)
        return
      }
      sourceInsert = {
        derivation_group_id: -1, // updated in the effect.
        end_time,
        external_events: {
          data: null  // updated after this map is created
        },
        file_id: -1, // updated in the effect.
        key: $keyField.value,
        metadata: parsed.source.metadata,
        source_type_id: -1,  // updated in the effect.
        start_time,
        valid_at
      };

      // the ones uploaded in this run won't show up as quickly in $externalEventTypes, so we keep a local log as well
      //    If event types act up during upload, this line is a likely culprit (if you upload twice really fast and $externalEventTypes doesn't update quick enough)
      //    If that's the case, directly use $externalEventTypes concatted with this list each time in the if statement a few lines below
      let localExternalEventTypes: ExternalEventType[] = [...$externalEventTypes];
      // each source bears different event types. While eventually that's a schema concern, for now we manually add all found event types in a source to their pairing table.
      //    That way, upon selecting a source, we can see what event types it contains.
      let externalSourceEventTypes: Set<number> = new Set<number>();
      // handle the events, as they need special logic to handle event types
      for (let externalEvent of parsed?.events) {
        externalEventTypeInsertInput = {
          name: externalEvent.event_type
        };

        // ensure the duration is valid
        try {
          convertDurationToMs(externalEvent.duration)
        }
        catch (e) {
          // skip this event
          showFailureToast("Upload failed.")
          catchError(`Event duration has invalid format...excluding event ${externalEvent.key}\n`, e as Error);
          return
        }

        // if the event is valid...
        if (externalEvent.event_type !== undefined && externalEvent.start_time !== undefined && externalEvent.duration !== undefined) {
          let externalEventTypeId: number | undefined = undefined;
          // create ExternalEventType if it doesn't exist or grab the ID of the previously created entry,
          if (!(localExternalEventTypes.map(e => e.name).includes(externalEvent.event_type))) {
            externalEventTypeId = await effects.createExternalEventType(externalEventTypeInsertInput, user);
            if (externalEventTypeId) {
              localExternalEventTypes.push({
                id: externalEventTypeId,
                name: externalEvent.event_type
              })
            }
          } else {
            // ...or find the existing ExternalEventType's id,
            externalEventTypeId = localExternalEventTypes.find(externalEventType => externalEventType.name === externalEvent.event_type)?.id
          }
          if (externalEventTypeId !== undefined) {
            // ...and then add it to a list. We have this extra split out step as our JSON/DB-compatible hybrids at this point contain both
            //      event_type and event_type_id, but the database can only accept event_type_id, so this step drops event_type
            const { event_type, ...db_compatible_fields } = externalEvent;

            // extra, optional step to only take stuff that the database can accept in. Eventually, can be handled by JSON Schema, see comment in external-event.ts
            const { duration, id, key, properties, start_time } = db_compatible_fields;

            externalEventsCreated.push({
              duration,
              event_type_id: externalEventTypeId,
              id,
              key,
              properties,
              start_time,
            });
            externalSourceEventTypes.add(externalEventTypeId)
          }
        }
      }
      sourceInsert.external_events.data = externalEventsCreated;
      externalEventsCreated = [];

      let sourceType: ExternalSourceType | undefined = undefined;
      let derivationGroup: DerivationGroup | undefined = undefined;
      let sourceId: number | undefined = undefined;
      if (file !== undefined) {
        if (!($externalSourceTypes.map(s => s.name).includes($sourceTypeField.value)) && sourceTypeInsert !== undefined) {
          sourceType = await effects.createExternalSourceType(sourceTypeInsert, user);
        } else {
          sourceType = getEventSourceTypeByName($sourceTypeField.value, $externalSourceTypes)
        }

        // FIND A BETTER WAY TO DO THIS? WE HAVE TWO SEPARATE CHECKS THAT sourceType !== undefined WHICH ISN'T NECESSARILY WRONG BUT FEELS SUSPICIOUS
        // name not present
        if ($derivationGroups.filter(dGroup => dGroup.name === derivationGroupInsert.name).length === 0
              && derivationGroupInsert !== undefined) {
          if(sourceType !== undefined) {derivationGroupInsert.source_type_id = sourceType.id;}
          else {console.log("Source type not registered correctly. Derivation group may be incorrect.")}
          derivationGroup = await effects.createDerivationGroup(derivationGroupInsert, user);
        }
        // name present, but under a different source type id
        else if ($derivationGroups.filter(dGroup => dGroup.source_type_id !== sourceType?.id && dGroup.name === derivationGroupInsert.name).length > 0
              && $derivationGroups.filter(dGroup => dGroup.source_type_id === sourceType?.id && dGroup.name === derivationGroupInsert.name).length === 0) {
          if(sourceType !== undefined) {derivationGroupInsert.source_type_id = sourceType.id;}
          else {console.log("Source type not registered correctly. Derivation group may be incorrect.")}
          derivationGroup = await effects.createDerivationGroup(derivationGroupInsert, user);
        }
        // name and source type id pair present
        else if (sourceType !== undefined) {
          derivationGroup = getDerivationGroupByNameSourceTypeId(derivationGroupName, sourceType.id, $derivationGroups)
        }

        if (sourceType !== undefined && derivationGroup !== undefined) {
          sourceInsert.source_type_id = sourceType.id;
          sourceInsert.derivation_group_id = derivationGroup.id;
          if (selectedFilters.find(filter => filter.name === sourceType?.name) === undefined) {
            selectedFilters.push(sourceType);
          }

          sourceId = await effects.createExternalSource(file, sourceInsert, user);
        }
      }

      // finally, create the event source -> contained event types entry
      if (sourceId !== undefined) {
        for (let external_event_type_id of externalSourceEventTypes) {
          await effects.createExternalSourceEventTypeLink({external_event_type_id, external_source_id: sourceId}, user);
        }
      }

      // autoselect the new source
      if (sourceId && sourceType) {
        selectedSource = {
          created_at: new Date().toISOString().replace("Z", "+00:00"), // technically not the exact time it shows up in the database
          derivation_group: derivationGroupName,
          id: sourceId,
          ...sourceInsert,
          source_type: sourceType?.name,

          total_groups: $derivationGroups.length // kind of unnecessary here, but necessary in this type for the table and coloring
        }

        // persist to list of newly added sources, restating (for uniformity in UpdateCard) the change_date (in the non-deletion case - created_at)
        let seenSourcesParsed: ExternalSourceWithDateInfo[] = JSON.parse($unseenSources);
        unseenSources.set(JSON.stringify(seenSourcesParsed.concat({...selectedSource, change_date: new Date()})));
      }

      // reset the form behind the source
      parsed = undefined
      keyField.reset("");
      sourceTypeField.reset("");
      startTimeDoyField.reset("");
      endTimeDoyField.reset("");
      validAtDoyField.reset("");
    }
    else {
      showFailureToast("Upload failed.")
      console.log("Upload failed - no file present, or parsing failed.")
    }
  }

  async function selectSource(detail: ExternalSourceWithResolvedNames) {
    selectedSource = detail
    gridRowSizes = "1fr 3px 1fr"; // Add the bottom panel for external event table/timeline
    deselectEvent()
  }

  function deselectSource() {
    deselectEvent()
    gridRowSizes = "1fr 3px 0fr"; // Remove the bottom panel for external event table/timeline
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
      selectedEvent = externalEvents?.length ? externalEvents[0] : null
      selectedRowId = null
    }
    else {
      mouseDownAfterTable = false
    }
  }

  function onCanvasMouseOver(e: CustomEvent<MouseOver>) {
    // just assign the MouseOver object so that the tooltip can access it
    mouseOver = e.detail
  }

  function toggleItem(value: ExternalSourceType) {
    if (!selectedFilters.find(f => f.id === value.id)) {
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

  function onSelectionChanged() {
    selectedEvent = selectedEvents.find(event => event.id === selectedRowId) ?? null
  }

  function getRowStyle(params: RowClassParams<ExternalSourceWithResolvedNames>): RowStyle | undefined {
    // evenly spread out color selection
    if (params.data?.derivation_group_id && params.data?.total_groups) {
      let spacing = 360/params.data?.total_groups;
      let myVal = (params.data?.derivation_group_id-1)*spacing; // dg id starts at 1
      return {'background-color': `hsl(${myVal} 100% 98%)`}
    }
    return undefined;
  }
</script>

<CssGrid columns="1fr 3px 4fr">
  <Panel borderRight padBody={true}>
    <svelte:fragment slot="header">
      <SectionTitle
        >{selectedEvent ? `Selected Event` : selectedRowId ? `Selected Event`
          : selectedSource
          ? `#${selectedSource.id} – ${selectedSource.source_type}`
          : 'Upload a Source File'}</SectionTitle
      >
      {#if selectedEvent || selectedRowId}
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
        <div class="external-source-header">
          <div class={classNames('external-source-header-title')}>
            <div class="external-source-header-title-value st-typography-medium">
              {selectedSource.key}
            </div>
          </div>
        </div>
        <div
          class="selected-source-forms"
          style="height: 100%;"
        >
          <fieldset>
            <Input layout="inline">
              ID
              <input class="st-input w-100" disabled={true} name="id" value={selectedSource.id} />
            </Input>

            <Input layout="inline">
              File ID
              <input class="st-input w-100" disabled={true} name="file-id" value={selectedSource.file_id} />
            </Input>

            <Input layout="inline">
                Source Type
              <input class="st-input w-100" disabled={true} name="source-type" value={selectedSource.source_type} />
            </Input>

            <Input layout="inline">
              Derivation Group
              <input class="st-input w-100" disabled={true} name="derivation-group" value={selectedSource.derivation_group} />
            </Input>

            <Input layout="inline">
              Start Time (UTC)
              <DatePicker
                dateString={selectedSource.start_time}
                disabled={true}
                name="start-time"
              />
            </Input>

            <Input layout="inline">
              End Time (UTC)
              <DatePicker
                dateString={selectedSource.end_time}
                disabled={true}
                name="end-time"
              />
            </Input>

            <Input layout="inline">
              Valid At (UTC)
              <DatePicker
                dateString={selectedSource.valid_at}
                disabled={true}
                name="valid-at"
              />
            </Input>

            <Input layout="inline">
              Created At (UTC)
              <DatePicker
                dateString={selectedSource.created_at}
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
              {#await effects.getExternalEventTypesBySource(selectedSourceId ? [selectedSourceId] : [], $externalEventTypes, user)}
                <i>Loading...</i>
              {:then eventTypes}
                {#each eventTypes as eventType}
                  <i>{eventType.name}</i>
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
            {#await effects.getExternalSourceMetadata(selectedSource.id, user)}
              <em>loading metadata...</em>
            {:then metadata}
              <Properties
                formProperties={Object.entries(metadata).map(e => {return {name: e[0], value: e[1]}})}
              />
            {:catch error}
              <em>error loading metadata...try refreshing the page.</em>
              {catchError(error)}
            {/await}
          </Collapse>
          <Collapse
            className="used-in-plans-collapse"
            defaultExpanded={false}
            title="Used in plans"
            tooltipContent="View plans this source is used in"
          >
            {#each selectedSourceLinkedDerivationGroupsPlans as linkedPlanDerivationGroup}
              <i>{$plans.find(plan => {
                return linkedPlanDerivationGroup.plan_id === plan.id;
              })?.name}</i>
            {/each}
          </Collapse>
          <button
            class="st-button danger w-100"
            style="margin-bottom:auto;"
            use:permissionHandler={{
              hasPermission: hasDeletePermission,
              permissionError: deletePermissionError,
            }}
            on:click|stopPropagation={async() => onDeleteExternalSource(selectedSource)}
          >
            Delete external source
          </button>
        </div>
      {:else}
        <form on:submit|preventDefault={onFormSubmit} on:reset={() => {
          parsed = undefined;
          $createExternalSourceError = null;
          $createExternalSourceTypeError = null;
          $createDerivationGroupError = null;
          $createExternalSourceEventTypeLinkError = null;
          isDerivationGroupFieldDisabled = true;
          }
        }>
          <AlertError class="m-2" error={$createExternalSourceError} />
          <AlertError class="m-2" error={$createExternalSourceTypeError} />
          <AlertError class="m-2" error={$createDerivationGroupError} />
          <AlertError class="m-2" error={$createExternalSourceEventTypeLinkError} />
          <div style="display:flex; white-space:nowrap;">
            <fieldset style="width:100%">
              <label for="file">Source File</label>
              <input class="w-100" name="file" required type="file" bind:files use:permissionHandler={{
                hasPermission: hasCreatePermission,
                permissionError: createPermissionError,
              }}/>
            </fieldset>

            <fieldset style="align-self:flex-end;float:right;width:40%;">
              <button disabled={!parsed} class="st-button w-100" type="submit"
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

          <Field field={derivationGroupField}>
            <label for="derivation-group" slot="label">Derivation Group</label>
            <input autocomplete="off" class="st-input w-100" name="derivation-group" disabled={isDerivationGroupFieldDisabled} placeholder="Default" />
          </Field>
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
          <div class="filter" style=" float: left; margin-right: auto;padding-left: 5px; padding-right: 5px;">
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
                    <button class="st-button secondary list-button" on:click={selectFilteredValues}>
                      Select {filteredValues.length}
                      {#if filteredValues.length === 1}
                        {'external source type'}
                      {:else}
                        {'external source types'}
                      {/if}
                    </button>
                    <button class="st-button secondary list-button" on:click={unselectFilteredValues}>Unselect all</button>
                  </div>
                </div>
              </Menu>
            </div>
          </div>
        </slot>
      </svelte:fragment>
      <svelte:fragment slot="body">
        {#if $externalSourceWithResolvedNames.length}
          <SingleActionDataGrid
            {columnDefs}
            {getRowStyle}
            hasDeletePermission={hasDeletePermission}
            itemDisplayText="External Source"
            items={filteredExternalSources}
            {user}
            on:rowClicked={({ detail }) => selectSource(detail.data)}
            bind:selectedItemId={selectedSourceId}
            on:deleteItem={({ detail }) => {
              let selectedSource = filteredExternalSources.find(s => s.id === detail[0]);
              if (selectedSource) {
                onDeleteExternalSource(selectedSource)
              }
            }}
          />
          {/if}
      </svelte:fragment>
    </Panel>

    {#if selectedSource}
      <CssGridGutter track={1} type="row" />

      <!-- External Event Table/Timeline -->
      <Panel padBody={true}>
        <svelte:fragment slot="header">
          <slot name="left">
            <SectionTitle><Balloon />External Events</SectionTitle>
            {#if showExternalEventTable}
              <div class="filter" style=" float: left; margin-right: auto;padding-left: 5px; padding-right: 5px;">
                <div class="timeline-editor-layer-filter" style="position: relative">
                  <Input>
                    <input bind:value={externalEventsTableFilterString} autocomplete="off" class="st-input w-100" name="filter-ee" placeholder={'Filter external events'}/>
                    <div class="filter-search-icon" slot='left'><SearchIcon /></div>
                  </Input>
                </div>
              </div>
              <div class="btn-group" style="display:flex;justify-content:flex-end;padding-bottom:5px;">
                <button
                  class="st-button primary"
                  on:click={() => {
                    showExternalEventTable = true;
                    showExternalEventTimeline = false;
                    externalEventsTableFilterString = '';
                    selectedRowId = selectedEvent?.id ?? null;
                  }}
                  use:tooltip={{ content: 'Toggle external event table', placement: 'top' }}
                >
                  Table
                </button>
                <button
                  class="st-button secondary"
                  on:click={() => {
                    showExternalEventTable = false;
                    showExternalEventTimeline = true;
                    externalEventsTableFilterString = '';
                    mouseDownAfterTable = true;
                  }}
                  use:tooltip={{ content: 'Toggle external event timeline', placement: 'top' }}
                >
                  Timeline
                </button>
              </div>
            {:else if showExternalEventTimeline}
              <div class="btn-group" style="display:flex;justify-content:flex-end;padding-bottom:5px;">
                <button
                  class="st-button secondary"
                  on:click={() => {
                    showExternalEventTable = true;
                    showExternalEventTimeline = false;
                    externalEventsTableFilterString = '';
                    selectedRowId = selectedEvent?.id ?? null;
                  }}
                  use:tooltip={{ content: 'Toggle external event table', placement: 'top' }}
                >
                  Table
                </button>
                <button
                  class="st-button primary"
                  on:click={() => {
                    showExternalEventTable = false;
                    showExternalEventTimeline = true;
                    externalEventsTableFilterString = '';
                    mouseDownAfterTable = true;
                  }}
                  use:tooltip={{ content: 'Toggle external event timeline', placement: 'top' }}
                >
                  Timeline
                </button>
              </div>
            {/if}
          </slot>
        </svelte:fragment>
        <svelte:fragment slot="body">
          {#if selectedSource}
            {#if showExternalEventTable}
              <div style="height: 100%; position: relative; width: 100%">
                <ExternalEventsTable
                  items={filteredTableExternalEvents}
                  {user}
                  bind:selectedItemId={selectedRowId}
                  on:selectionChanged={onSelectionChanged}
                  on:rowDoubleClicked={onSelectionChanged}
                />
            </div>
            {:else if showExternalEventTimeline}
              <div style=" height: 100%; padding-left: 5px; padding-right: 5px;">
                <div style=" background-color:#ebe9e6;height:15px;">
                  <div style="display:inline; float:left;">{startTime}</div>
                  <div style="display:inline; float:right;">{endTime}</div>
                </div>
                <div style=" height: 100%; position: relative; width: 100%;"
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

                  <div style="display:flex; padding-bottom: 10px;padding-top: 3px">
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
            {/if}
          {:else if $externalSourceWithResolvedNames.length}
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
</style>
