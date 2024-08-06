<svelte:options immutable={true} />

<script lang="ts">
  import type { ICellRendererParams } from 'ag-grid-community';
  import Truck from 'bootstrap-icons/icons/truck.svg?component';
  import { createEventDispatcher } from 'svelte';
  import { externalEventTypes } from '../../stores/external-event';
  import {
    derivationGroups,
    externalSourceTypes,
    externalSourceWithResolvedNames,
    getEventSourceTypeName
  } from '../../stores/external-source';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { ExternalEventType } from '../../types/external-event';
  import type {
    DerivationGroup,
    ExternalSourceType,
    ExternalSourceWithResolvedNames
  } from '../../types/external-source';
  import effects from '../../utilities/effects';
  import { showDeleteDerivationGroupModal } from '../../utilities/modal';
  import { featurePermissions } from '../../utilities/permissions';
  import Collapse from '../Collapse.svelte';
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
  let mode: string = "dg";

  type CellRendererParams = {
    viewDerivationGroup: (derivationGroup: DerivationGroup) => void;
    deleteDerivationGroup: (derivationGroup: DerivationGroup) => Promise<void>;
    deleteExternalSourceType: (sourceType: ExternalSourceType) => void;
    deleteExternalEventType: (eventType: ExternalEventType) => void;
  };
  type ModalCellRendererParams = ICellRendererParams<DerivationGroup> & CellRendererParams;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  let dgDataGrid: DataGrid<DerivationGroup>;
  let dgColumnDefs: DataGridColumnDef<DerivationGroup>[] = [];
  let estDataGrid: DataGrid<ExternalSourceType>;
  let estColumnDefs: DataGridColumnDef<ExternalSourceType>[] = [];
  let eetDataGrid: DataGrid<ExternalEventType>;
  let eetColumnDefs: DataGridColumnDef<ExternalEventType>[] = [];

  let hasDeletePermission: boolean = false;

  $: hasDeletePermission = featurePermissions.externalSource.canDelete(user);

  dgColumnDefs = [
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
      field: 'source_type_id',
      filter: 'string',
      headerName: 'Source type',
      resizable: true,
      sortable: true,
      suppressAutoSize: false,
      suppressSizeToFit: false,
      valueFormatter: params => {
        const sourceTypeName = getEventSourceTypeName(params?.value, $externalSourceTypes);
        return sourceTypeName ? sourceTypeName : '';
      },
    },
    {
      field: 'derivedEventTotal',
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
      field: 'sources',
      filter: 'number',
      headerName: 'Associated External Sources',
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      valueFormatter: params => {
        return params?.value.size
      },
    },
    {
      cellClass: 'action-cell-container',
      cellRenderer: (params: ModalCellRendererParams) => {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions-cell';
        new DataGridActions({
          props: {
            deleteCallback: params.deleteDerivationGroup,
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
        deleteDerivationGroup,
      } as CellRendererParams,
      headerName: '',
      resizable: false,
      sortable: false,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 25,
    },
    {
      cellClass: 'action-cell-container',
      cellRenderer: (params: ModalCellRendererParams) => {
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
    }
  ];

  const modalColumnSizeNoDetail: string = '1fr 3px 0fr';
  const modalColumnSizeWithDetail: string = '3fr 3px 1fr';
  let modalColumnSize: string = modalColumnSizeNoDetail;

  let filterText: string = '';

  let selectedDerivationGroup: DerivationGroup | undefined = undefined;
  let selectedDerivationGroupSources: ExternalSourceWithResolvedNames[] = [];
  $: if (selectedDerivationGroup !== undefined) {
    modalColumnSize = modalColumnSizeWithDetail;
  } else {
    modalColumnSize = modalColumnSizeNoDetail;
  }
  $: selectedDerivationGroupSources = $externalSourceWithResolvedNames.filter(
    source => selectedDerivationGroup?.id === source.derivation_group_id,
  );

  async function deleteDerivationGroup(derivationGroup: DerivationGroup) {
    if (derivationGroup.sources.size <= 0) {
      await effects.deleteDerivationGroup(derivationGroup.id, user);
    }
    else {
      await showDeleteDerivationGroupModal(derivationGroup);
    }
  }

  function viewDerivationGroup(derivationGroup: DerivationGroup) {
    const dg = $derivationGroups.find(dg => dg.id === derivationGroup.id);
    if (selectedDerivationGroup === undefined) {
      selectedDerivationGroup = dg;
    }
    else {
      selectedDerivationGroup = undefined;
    }
  }
</script>

<Modal height={600} width={1000}>
  <ModalHeader on:close>
    Manage Derivation Groups and Types
    <div class="derivationgroups-modal-filter-container" style="margin-left: auto; margin-right: 15px">
      <select bind:value={mode} name="mode" id="mode" class="st-select" style="width: 200px">
        <option value="dg">Derivation Groups</option>
        <option value="est">External Source Types</option>
        <option value="eet">External Event Types</option>
      </select> 
    </div>
  </ModalHeader>
  <ModalContent style=" overflow-y:scroll; padding:0;">
    <CssGrid columns={modalColumnSize} minHeight="100%">
      <div class="constraiderivationgroups-modal-table-container" style="height:100%; padding-top: 10px">
        {#if mode==="dg"}
          <DataGrid bind:this={dgDataGrid} columnDefs={dgColumnDefs} rowData={$derivationGroups} />
        {:else if mode ==="est"}
          <DataGrid bind:this={estDataGrid} columnDefs={estColumnDefs} rowData={$externalSourceTypes} />
        {:else}
          <DataGrid bind:this={eetDataGrid} columnDefs={eetColumnDefs} rowData={$externalEventTypes} />
        {/if}
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
                    {source.source_type}
                  </p>

                  <p>
                    <strong>Start Time:</strong>
                    {source.start_time}
                  </p>

                  <p>
                    <strong>End Time:</strong>
                    {source.end_time}
                  </p>

                  <p>
                    <strong>Valid At:</strong>
                    {source.valid_at}
                  </p>

                  <p>
                    <strong>Created At:</strong>
                    {source.created_at}
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
  .derivationgroups-modal-filter-container {
    align-items: center;
    column-gap: 0.25rem;
    display: grid;
    grid-template-columns: min-content auto min-content;
    margin: 0.5rem 1rem 0;
  }

  .constraiderivationgroups-modal-table-container {
    height: 100%;
    padding: 0 1rem 0.5rem;
    width: 100%;
  }
</style>
