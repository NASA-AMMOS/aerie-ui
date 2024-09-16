<svelte:options immutable={true} />

<script lang="ts">
  import { base } from '$app/paths';
  import type { ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
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
  import { viewAddFilterToRow } from '../../stores/views';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { ExternalEventType } from '../../types/external-event';
  import type { DerivationGroup, ExternalSourceSlim } from '../../types/external-source';
  import effects from '../../utilities/effects';
  import { formatDate } from '../../utilities/time';
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

  const modalColumnSizeNoDetail: string = '1fr 3px 0fr';
  const modalColumnSizeWithDetail: string = '3fr 3px 1.3fr';

  let dataGrid: DataGrid<DerivationGroup>;
  let columnDefs: DataGridColumnDef<DerivationGroup>[] = [];

  let modalColumnSize: string = modalColumnSizeNoDetail;

  let filterText: string = '';
  let filteredDerivationGroups: DerivationGroup[] = [];

  let selectedDerivationGroup: DerivationGroup | undefined = undefined;
  let selectedDerivationGroupSources: ExternalSourceSlim[] = [];

  $: if ($selectedPlanDerivationGroupNames && dataGrid) {
    // no current way to change just a specific cell unless we add something about plan associations to the DG object,
    //    which we don't seek to do.
    // this does mean every update to any entry in selectedPlanDerivationGroupIds refreshes the whole column. Also a
    //    small delay, which buffers button smashing and repeated updates pretty well!
    dataGrid.refreshCells();
  }

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
        width: 250,
      },
      {
        cellDataType: 'boolean',
        editable: true,
        headerName: 'Included in Plan',
        resizable: false,
        suppressAutoSize: true,
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams<DerivationGroup>) => {
          const { data } = params;
          if (data) {
            return $selectedPlanDerivationGroupNames.includes(data.name);
          }
          return false;
        },
        width: 115,
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

  function viewDerivationGroup(viewedDerivationGroup: DerivationGroup) {
    const derivationGroup = $derivationGroups.find(
      derivationGroup => derivationGroup.name === viewedDerivationGroup.name,
    );
    selectedDerivationGroup = derivationGroup;
  }

  function getRowId(derivationGroup: DerivationGroup): string {
    return `${derivationGroup.name}:${derivationGroup.source_type_name}`;
  }

  async function changeDerivationGroupAssociation(checked: boolean, derivationGroupName: string | undefined) {
    if (derivationGroupName !== undefined) {
      if (checked) {
        // insert
        await effects.insertDerivationGroupForPlan(derivationGroupName, $plan, user);
        if ($derivationGroupPlanLinkError === null) {
          // Add filter to timeline
          const derivationGroup = $derivationGroups.find(
            iterDerivationGroup => iterDerivationGroup.name === derivationGroupName,
          );
          if (derivationGroup) {
            const derivationGroupExternalEventTypes: ExternalEventType[] = derivationGroup.event_types.map(
              eventType => ({ name: eventType }),
            );
            viewAddFilterToRow(derivationGroupExternalEventTypes, 'external-event');
          }
        }
      } else {
        // delete
        await effects.deleteDerivationGroupForPlan(derivationGroupName, $plan, user);
        if ($derivationGroupPlanLinkError !== null) {
          console.log('Removed');
        }
      }
    }
  }
</script>

<Modal height={600} width={1000}>
  <ModalHeader on:close>Manage Derivation Groups</ModalHeader>
  <ModalContent style=" overflow-y:scroll; padding:0;">
    <CssGrid columns={modalColumnSize} minHeight="100%">
      <div class="derivation-groups-modal-container" style="height:100%">
        <div class="derivation-groups-modal-filter-container" style:display="flex">
          <Input layout="inline">
            <input bind:value={filterText} class="st-input" placeholder="Filter derivation groups" />
          </Input>
          <button
            class="st-button secondary ellipsis"
            name="new-external-source"
            on:click={() => window.open(`${base}/external-sources`)}
            style:width="100px"
            style:align-items="center"
            style:display="flex"
          >
            Upload
          </button>
        </div>
        <hr />
        <div class="derivation-groups-modal-table-container" style="height:100%">
          {#if filteredDerivationGroups.length}
            <DataGrid
              bind:this={dataGrid}
              {columnDefs}
              rowData={filteredDerivationGroups}
              {getRowId}
              on:cellEditingStopped={event => {
                const { newValue, data } = event.detail;
                changeDerivationGroupAssociation(newValue, data?.name);
              }}
            />
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
  .derivation-groups-modal-container {
    display: grid;
    grid-template-rows: min-content min-content auto;
    height: 100%;
    row-gap: 0.5rem;
  }

  .derivation-groups-modal-container hr {
    border: none;
    border-top: 1px solid #e0e0e0;
    margin: 0 1rem;
    width: auto;
  }

  .derivation-groups-modal-filter-container {
    align-items: center;
    column-gap: 0.25rem;
    display: grid;
    grid-template-columns: min-content auto min-content;
    margin: 0.5rem 1rem 0;
  }

  .derivation-groups-modal-table-container {
    height: 100%;
    padding: 0 1rem 0.5rem;
    width: 100%;
  }
</style>
