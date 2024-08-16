<svelte:options immutable={true} />

<script lang="ts">
  import { base } from '$app/paths';
  import type { ICellRendererParams } from 'ag-grid-community';
  import Truck from 'bootstrap-icons/icons/truck.svg?component';
  import { createEventDispatcher } from 'svelte';
  import {
    derivationGroupPlanLinkError,
    derivationGroups,
    externalSourceWithResolvedNames,
    selectedPlanDerivationGroupNames,
  } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import { plugins } from '../../stores/plugins';
  import { view } from '../../stores/views';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { DerivationGroup, ExternalSourceWithResolvedNames } from '../../types/external-source';
  import type { ExternalEventLayer } from '../../types/timeline';
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

  let externalEventLayers: ExternalEventLayer[] | undefined;
  let dataGrid: DataGrid<DerivationGroup>;
  let baseColumnDefs: DataGridColumnDef<DerivationGroup>[] = [];

  selectedPlanDerivationGroupNames.subscribe(() => {
    if (baseColumnDefs.length > 0 && dataGrid) {
      // no current way to change just a specific cell unless we add something about plan associations to the DG object,
      //    which we don't seek to do.
      // this does mean every update to any entry in selectedPlanDerivationGroupIds refreshes the whole column, and flashes it,
      //    though that isn't particularly a problem and does do good to signal association complete. Also a small delay, which
      //    buffers button smashing and repeated updates pretty well!
      dataGrid.refreshCells();
    }
  });

  $: externalEventLayers = $view?.definition.plan.timelines
    .flatMap(timeline => timeline.rows)
    .flatMap(row => row.layers)
    .filter(layer => isExternalEventLayer(layer));

  baseColumnDefs = [
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
        input.addEventListener('click', event => {
          if (event?.target && params.data) {
            if ((event.target as any).checked) {
              // insert
              effects.insertDerivationGroupForPlan(params.data.name, $plan, user);
              if ($derivationGroupPlanLinkError !== null) {
                console.log($derivationGroupPlanLinkError);
                showFailureToast('Failed to link derivation group & plan.');
              } else {
                // Insert all the external event types from the derivation group to the timeline filter
                const derivationGroup = $derivationGroups.find(
                  derivationGroup => derivationGroup.name === params?.data?.name,
                );
                if (derivationGroup !== undefined) {
                  externalEventLayers?.forEach(externalEventLayer => {
                    if (externalEventLayer.filter.externalEvent !== undefined) {
                      externalEventLayer.filter.externalEvent.event_types =
                        externalEventLayer.filter.externalEvent.event_types.concat(derivationGroup.event_types);
                      externalEventLayer.filter.externalEvent.event_types =
                        externalEventLayer.filter.externalEvent.event_types.filter(
                          (val, ind, arr) => arr.indexOf(val) === ind,
                        ); // uniqueness
                    }
                  });
                }
              }
            } else {
              // delete
              effects.deleteDerivationGroupForPlan(params.data.name, $plan, user);
              if ($derivationGroupPlanLinkError !== null) {
                console.log($derivationGroupPlanLinkError);
                showFailureToast('Failed to unlink derivation group & plan.');
              }
            }
          }
        });
        return input;
      },
      enableCellChangeFlash: true,
      filter: 'string',
      headerName: 'Included',
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 100,
    },
  ];

  const modalColumnSizeNoDetail: string = '1fr 3px 0fr';
  const modalColumnSizeWithDetail: string = '3fr 3px 1fr';
  let modalColumnSize: string = modalColumnSizeNoDetail;
  let columnDefs = baseColumnDefs;

  let filterText: string = '';
  let filteredDerivationGroups: DerivationGroup[] = [];

  let selectedDerivationGroup: DerivationGroup | undefined = undefined;
  let selectedDerivationGroupSources: ExternalSourceWithResolvedNames[] = [];
  $: if (selectedDerivationGroup !== undefined) {
    modalColumnSize = modalColumnSizeWithDetail;
  }
  $: selectedDerivationGroupSources = $externalSourceWithResolvedNames.filter(
    source => selectedDerivationGroup?.name === source.derivation_group_name,
  );

  $: filteredDerivationGroups = $derivationGroups.filter(derivationGroup => {
    const filterTextLowerCase = filterText.toLowerCase();
    const includesName = derivationGroup.name.toLocaleLowerCase().includes(filterTextLowerCase);
    return includesName;
  });

  $: {
    columnDefs = [
      ...baseColumnDefs,
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
        <div class="constraiderivationgroups-modal-table-container" style="height:100%">
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
            <SectionTitle>
              <Truck />Sources in '{selectedDerivationGroup.name}'
            </SectionTitle>
          </svelte:fragment>
          <svelte:fragment slot="body">
            {#if selectedDerivationGroupSources.length > 0}
              {#each selectedDerivationGroupSources as source}
                <!-- Collapsible details -->
                <Collapse title={source.key} tooltipContent={source.key} defaultExpanded={false}>
                  <span slot="right">
                    <p style:color="gray">
                      {selectedDerivationGroup.sources.get(source.key)?.event_counts} events
                    </p>
                  </span>
                  <p>
                    <strong>Key:</strong>
                    {source.key}
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

  .constraiderivationgroups-modal-table-container {
    height: 100%;
    padding: 0 1rem 0.5rem;
    width: 100%;
  }
</style>
