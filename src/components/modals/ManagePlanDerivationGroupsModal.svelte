<svelte:options immutable={true} />

<script lang="ts">
  import { base } from '$app/paths';
  import type { ICellRendererParams } from 'ag-grid-community';
  import Truck from 'bootstrap-icons/icons/truck.svg?component';
  import { createEventDispatcher } from 'svelte';
  import {
    derivationGroupPlanLinkError,
    derivationGroups,
    externalSources,
    selectedPlanDerivationGroupNames,
  } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import { plugins } from '../../stores/plugins';
  import { view, viewUpdateRow } from '../../stores/views';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { DerivationGroup, ExternalSourceSlim } from '../../types/external-source';
  import type { Layer, Timeline } from '../../types/timeline';
  import effects from '../../utilities/effects';
  import { formatDate } from '../../utilities/time';
  import { isExternalEventLayer } from '../../utilities/timeline';
  import { showFailureToast } from '../../utilities/toast';
  import Collapse from '../Collapse.svelte';
  import Input from '../form/Input.svelte';
  import CssGrid from '../ui/CssGrid.svelte';
  import CssGridGutter from '../ui/CssGridGutter.svelte';
  import DataGrid from '../ui/DataGrid/DataGrid.svelte';
  import DataGridActions from '../ui/DataGrid/DataGridActions.svelte';
  import Panel from '../ui/Panel.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let user: User | null;

  type CellRendererParams = {
    viewDerivationGroup: (derivationGroup: DerivationGroup) => void;
  };
  type DerivationGroupCellRendererParams = ICellRendererParams<DerivationGroup> & CellRendererParams;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  let externalEventLayers: Layer[] | undefined;
  let dataGrid: DataGrid<DerivationGroup>;
  let columnDefs: DataGridColumnDef<DerivationGroup>[] = [];
  let timelines: Timeline[] = [];

  $: if ($selectedPlanDerivationGroupNames && dataGrid) {
    // no current way to change just a specific cell unless we add something about plan associations to the DG object,
    //    which we don't seek to do.
    // this does mean every update to any entry in selectedPlanDerivationGroupIds refreshes the whole column, and flashes it,
    //    though that isn't particularly a problem and does do good to signal association complete. Also a small delay, which
    //    buffers button smashing and repeated updates pretty well!
    dataGrid.refreshCells();
  }

  $: timelines = $view?.definition.plan.timelines || [];

  $: externalEventLayers = $view?.definition.plan.timelines
    .flatMap(timeline => timeline.rows)
    .flatMap(row => row.layers)
    .filter(layer => isExternalEventLayer(layer));

  const modalColumnSizeNoDetail: string = '1fr 3px 0fr';
  const modalColumnSizeWithDetail: string = '3fr 3px 1.3fr';
  let modalColumnSize: string = modalColumnSizeNoDetail;

  let filterText: string = '';
  let filteredDerivationGroups: DerivationGroup[] = [];

  let selectedDerivationGroup: DerivationGroup | undefined = undefined;
  let selectedDerivationGroupSources: ExternalSourceSlim[] = [];
  $: if (selectedDerivationGroup !== undefined) {
    modalColumnSize = modalColumnSizeWithDetail;
  }
  $: selectedDerivationGroupSources = $externalSources.filter(
    source => selectedDerivationGroup?.name === source.pkey.derivation_group_name,
  );

  $: filteredDerivationGroups = $derivationGroups.filter(derivationGroup => {
    const filterTextLowerCase = filterText.toLowerCase();
    const includesName = derivationGroup.name.toLocaleLowerCase().includes(filterTextLowerCase);
    return includesName;
  });

  $: {
    columnDefs = [
      {
        field: 'name',
        filter: 'string',
        headerName: 'Derivation Group',
        resizable: true,
        sortable: true,
        suppressAutoSize: false,
        suppressSizeToFit: false,
      },
      {
        field: 'source_type_name',
        filter: 'string',
        headerName: 'Source type',
        resizable: true,
        sortable: true,
        suppressAutoSize: false,
        suppressSizeToFit: false,
      },
      {
        field: 'derived_event_total',
        filter: 'number',
        headerName: 'Derived Events in Derivation Group',
        sortable: true,
        suppressAutoSize: true,
        suppressSizeToFit: true,
        valueFormatter: params => {
          return params?.value.length;
        },
      },
      {
        cellRenderer: (params: DerivationGroupCellRendererParams) => {
          var input = document.createElement('input');
          input.type = 'checkbox';
          input.checked = $selectedPlanDerivationGroupNames.includes(params?.data?.name ?? '');
          input.addEventListener('click', event => changeDerivationGroupAssociation(event, params?.data?.name));
          return input;
        },
        filter: 'string',
        headerName: 'Included',
        sortable: true,
        suppressAutoSize: true,
        suppressSizeToFit: true,
        width: 100,
      },
      {
        cellClass: 'action-cell-container',
        cellRenderer: (params: DerivationGroupCellRendererParams) => {
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'actions-cell';
          new DataGridActions({
            props: {
              rowData: params.data,
              viewCallback: params.viewDerivationGroup,
              viewTooltip: {
                content: 'View Derivation Group',
                placement: 'bottom',
              },
            },
            target: actionsDiv,
          });

          return actionsDiv;
        },
        cellRendererParams: {
          viewDerivationGroup,
        } as CellRendererParams,
        headerName: '',
        resizable: false,
        sortable: false,
        suppressAutoSize: true,
        suppressSizeToFit: true,
        width: 40,
      },
    ];
  }

  function viewDerivationGroup(derivationGroup: DerivationGroup) {
    const dg = $derivationGroups.find(dg => dg.name === derivationGroup.name);
    selectedDerivationGroup = dg;
  }

  function getRowId(derivationGroup: DerivationGroup): string {
    return `${derivationGroup.name}:${derivationGroup.source_type_name}`;
  }

  function handleUpdateLayerNewDerivationGroups(newLayers: Layer[]) {
    // Derivation Group association is done on a *plan* level which makes this a little tricky. We want to update *all* available External Event Layers with the new layers (post-association), so we must look through all available timelines & their rows to find the layers we're updating
    timelines.forEach(currentTimeline => {
      currentTimeline.rows.forEach(currentRow => {
        const regeneratedLayers = currentRow.layers.map(currentLayer => {
          const layerHasNewVersion = newLayers.find(nl => nl.id === currentLayer.id);
          return layerHasNewVersion !== undefined ? layerHasNewVersion : currentLayer;
        });
        viewUpdateRow('layers', regeneratedLayers, currentTimeline.id, currentRow.id);
      });
    });
  }

  function changeDerivationGroupAssociation(event: MouseEvent, derivationGroupName: string | undefined) {
    if (event?.target && derivationGroupName !== undefined) {
      if ((event.target as any).checked) {
        // insert
        effects.insertDerivationGroupForPlan(derivationGroupName, $plan, user);
        if ($derivationGroupPlanLinkError !== null) {
          showFailureToast('Failed to link derivation group & plan.');
        } else {
          // Insert all the external event types from the derivation group to the timeline filter
          const derivationGroup = $derivationGroups.find(
            derivationGroup => derivationGroup.name === derivationGroupName,
          );
          if (derivationGroup !== undefined && externalEventLayers !== undefined) {
            externalEventLayers = externalEventLayers.map(layer => {
              let event_types = (layer.filter.externalEvent?.event_types ?? [])
                .concat(derivationGroup.event_types) // add new event types associated with this DG
                .filter((val, ind, arr) => arr.indexOf(val) === ind); // guarantee uniqueness
              return {
                ...layer,
                filter: {
                  ...layer.filter,
                  externalEvent: {
                    ...layer.filter.externalEvent,
                    event_types: event_types,
                  },
                },
              };
            });
            handleUpdateLayerNewDerivationGroups(externalEventLayers);
          }
        }
      } else {
        // delete
        effects.deleteDerivationGroupForPlan(derivationGroupName, $plan, user);
        if ($derivationGroupPlanLinkError !== null) {
          showFailureToast('Failed to unlink derivation group & plan.');
        } else {
          // Remove all the external event types from the derivation group to the timeline filter
          const derivationGroup = $derivationGroups.find(
            derivationGroup => derivationGroup.name === derivationGroupName,
          );
          if (derivationGroup !== undefined && externalEventLayers !== undefined) {
            externalEventLayers = externalEventLayers.map(layer => {
              let event_types = (layer.filter.externalEvent?.event_types ?? [])
                .filter(et => !derivationGroup.event_types.includes(et)) // remove any event types associated with this DG
                .filter((val, ind, arr) => arr.indexOf(val) === ind); // guarantee uniqueness
              return {
                ...layer,
                filter: {
                  ...layer.filter,
                  externalEvent: {
                    ...layer.filter.externalEvent,
                    event_types: event_types,
                  },
                },
              };
            });
            handleUpdateLayerNewDerivationGroups(externalEventLayers);
          }
        }
      }
    }
  }
</script>

<Modal height={600} width={1000}>
  <ModalHeader on:close>Manage Derivation Groups</ModalHeader>
  <ModalContent style=" overflow-y:scroll; padding:0;">
    <CssGrid columns={modalColumnSize} minHeight="100%">
      <div class="derivationgroups-modal-container" style="height:100%">
        <div class="derivationgroups-modal-filter-container">
          <div class="derivationgroups-modal-title">Derivation Groups</div>
          <Input>
            <input
              bind:value={filterText}
              class="st-input"
              placeholder="Filter derivation groups"
              style="width: 100%;"
            />
          </Input>
          <button
            class="st-button secondary ellipsis"
            name="new-external-source"
            on:click={() => window.open(`${base}/external-sources`)}
          >
            Upload
          </button>
        </div>
        <hr />
        <div class="derivationgroups-modal-table-container" style="height:100%">
          {#if filteredDerivationGroups.length}
            <DataGrid bind:this={dataGrid} {columnDefs} rowData={filteredDerivationGroups} {getRowId} />
          {:else}
            <div class="p1 st-typography-label">No Derivation Groups Found</div>
          {/if}
        </div>
      </div>
      {#if selectedDerivationGroup !== undefined}
        <CssGridGutter track={1} type="column" />
        <Panel borderRight padBody={true} overflowYBody="scroll">
          <svelte:fragment slot="header">
            <SectionTitle overflow="hidden">
              <Truck slot="icon" />Sources in '{selectedDerivationGroup.name}'
            </SectionTitle>
          </svelte:fragment>
          <svelte:fragment slot="body">
            {#if selectedDerivationGroupSources.length > 0}
              {#each selectedDerivationGroupSources as source}
                <!-- Collapsible details -->
                <Collapse title={source.pkey.key} tooltipContent={source.pkey.key} defaultExpanded={false}>
                  <span slot="right">
                    <p style:color="gray">
                      {selectedDerivationGroup.sources.get(source.pkey.key)?.event_counts} events
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
                {#each selectedDerivationGroup.event_types as eventType}
                  <i>{eventType}</i>
                {/each}
              </Collapse>
            {:else}
              <p>No sources in this group.</p>
            {/if}
          </svelte:fragment>
        </Panel>
      {/if}
    </CssGrid>
  </ModalContent>
  <ModalFooter>
    <button class="st-button secondary" on:click={() => dispatch('close')}> Close </button>
  </ModalFooter>
</Modal>

<style>
  .derivationgroups-modal-container {
    display: grid;
    grid-template-rows: min-content min-content auto;
    height: 100%;
    row-gap: 0.5rem;
  }

  .derivationgroups-modal-container hr {
    border: none;
    border-top: 1px solid #e0e0e0;
    margin: 0 1rem;
    width: auto;
  }

  .derivationgroups-modal-filter-container {
    align-items: center;
    column-gap: 0.25rem;
    display: grid;
    grid-template-columns: min-content auto min-content;
    margin: 0.5rem 1rem 0;
  }

  .derivationgroups-modal-title {
    font-weight: bold;
  }

  .derivationgroups-modal-table-container {
    height: 100%;
    padding: 0 1rem 0.5rem;
    width: 100%;
  }
</style>
