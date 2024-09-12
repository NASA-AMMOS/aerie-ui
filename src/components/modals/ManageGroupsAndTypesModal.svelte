<svelte:options immutable={true} />

<script lang="ts">
  import type { ICellRendererParams } from 'ag-grid-community';
  import Truck from 'bootstrap-icons/icons/truck.svg?component';
  import { createEventDispatcher } from 'svelte';
  import { derivationGroups, externalSources } from '../../stores/external-source';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { ExternalEventType } from '../../types/external-event';
  import type { DerivationGroup, ExternalSourceSlim, ExternalSourceType } from '../../types/external-source';
  import {
    showDeleteDerivationGroupModal,
    showDeleteExternalEventTypeModal,
    showDeleteExternalSourceTypeModal,
  } from '../../utilities/modal';
  import { featurePermissions } from '../../utilities/permissions';
  import Collapse from '../Collapse.svelte';
  import ExternalEventTypeManagementTab from '../external-events/ExternalEventTypeManagementTab.svelte';
  import DerivationGroupManagementTab from '../external-source/DerivationGroupManagementTab.svelte';
  import ExternalSourceTypeManagementTab from '../external-source/ExternalSourceTypeManagementTab.svelte';
  import CssGrid from '../ui/CssGrid.svelte';
  import CssGridGutter from '../ui/CssGridGutter.svelte';
  import DataGridActions from '../ui/DataGrid/DataGridActions.svelte';
  import Panel from '../ui/Panel.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';
  import Tab from '../ui/Tabs/Tab.svelte';
  import TabPanel from '../ui/Tabs/TabPanel.svelte';
  import Tabs from '../ui/Tabs/Tabs.svelte';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let user: User | null;

  type CellRendererParams = {
    deleteDerivationGroup: (derivationGroup: DerivationGroup) => Promise<void>;
    deleteExternalEventType: (eventType: ExternalEventType) => Promise<void>;
    deleteExternalSourceType: (sourceType: ExternalSourceType) => Promise<void>;
    viewDerivationGroup: (derivationGroup: DerivationGroup) => void;
    viewExternalEventType: (eventType: ExternalEventType) => void;
    viewExternalSourceType: (sourceType: ExternalSourceType) => void;
  };
  type ModalCellRendererParams = ICellRendererParams<DerivationGroup> & CellRendererParams;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  let derivationGroupsColumnsDef: DataGridColumnDef<DerivationGroup>[] = [];
  let externalSourceTypeColumnDefs: DataGridColumnDef<ExternalSourceType>[] = [];
  let externalEventTypeColumnDefs: DataGridColumnDef<ExternalEventType>[] = [];

  let hasDeletePermission: boolean = false;

  $: hasDeletePermission = featurePermissions.externalSource.canDelete(user);

  derivationGroupsColumnsDef = [
    {
      field: 'name',
      filter: 'string',
      headerName: 'Derivation Group',
      resizable: true,
      sortable: true,
    },
    {
      field: 'source_type_name',
      filter: 'string',
      headerName: 'Source type',
      resizable: true,
      sortable: true,
    },
    {
      field: 'derived_event_total',
      filter: 'number',
      headerName: 'Derived Events in Derivation Group',
      sortable: true,
      valueFormatter: params => {
        return params?.value.length;
      },
      width: 250,
    },
    {
      field: 'sources',
      filter: 'number',
      headerName: 'Associated External Sources',
      sortable: true,
      valueFormatter: params => {
        return params?.value.size;
      },
      width: 200,
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
              content: 'Delete Derivation Group',
              placement: 'bottom',
            },
            hasDeletePermission: hasDeletePermission,
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
        deleteDerivationGroup,
        viewDerivationGroup,
      } as CellRendererParams,
      headerName: '',
      resizable: false,
      sortable: false,
      width: 80,
    },
  ];

  externalSourceTypeColumnDefs = [
    {
      field: 'name',
      filter: 'string',
      headerName: 'External Source Type',
      resizable: true,
      sortable: true,
    },
    {
      filter: 'number',
      headerName: 'Associated External Sources',
      sortable: true,
      valueFormatter: params => {
        const associatedSources = getAssociatedExternalSourcesBySourceType(params.data?.name);
        return `${associatedSources.length}`;
      },
    },
    {
      filter: 'number',
      headerName: 'Associated Derivation Groups',
      sortable: true,
      valueFormatter: params => {
        const associatedDerivationGroups = getAssociatedDerivationGroupsBySourceTypeName(params.data?.name);
        return `${associatedDerivationGroups.length}`;
      },
    },
    {
      cellClass: 'action-cell-container',
      cellRenderer: (params: ModalCellRendererParams) => {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions-cell';
        new DataGridActions({
          props: {
            deleteCallback: params.deleteExternalSourceType,
            deleteTooltip: {
              content: 'Delete External Source Type',
              placement: 'bottom',
            },
            hasDeletePermission: hasDeletePermission,
            rowData: params.data,
            viewCallback: params.viewExternalSourceType,
            viewTooltip: {
              content: 'View External Source Type',
              placement: 'bottom',
            },
          },
          target: actionsDiv,
        });

        return actionsDiv;
      },
      cellRendererParams: {
        deleteExternalSourceType,
        viewExternalSourceType,
      } as CellRendererParams,
      headerName: '',
      resizable: false,
      sortable: false,
      width: 60,
    },
  ];

  externalEventTypeColumnDefs = [
    {
      field: 'name',
      filter: 'string',
      headerName: 'External Event Type',
      resizable: true,
      sortable: true,
    },
    {
      filter: 'number',
      headerName: 'Associated External Sources',
      sortable: true,
      valueFormatter: params => {
        let associatedDerivationGroups = getAssociatedDerivationGroupsByEventType(params.data?.name);
        const sourceMap = associatedDerivationGroups.flatMap(derivationGroup => derivationGroup.sources.size);
        const numOfSources = sourceMap.length > 0 ? sourceMap.reduce((acc, derivationGroupSize) => acc + derivationGroupSize) : 0;
        return `${numOfSources}`;
      },
    },
    {
      filter: 'number',
      headerName: 'Associated Derivation Groups',
      sortable: true,
      valueFormatter: params => {
        const associatedDerivationGroups = getAssociatedDerivationGroupsByEventType(params.data?.name);
        return `${associatedDerivationGroups.length}`;
      },
    },
    {
      cellClass: 'action-cell-container',
      cellRenderer: (params: ModalCellRendererParams) => {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions-cell';
        new DataGridActions({
          props: {
            deleteCallback: params.deleteExternalEventType,
            deleteTooltip: {
              content: 'Delete External Source',
              placement: 'bottom',
            },
            hasDeletePermission: hasDeletePermission,
            rowData: params.data,
            viewCallback: params.viewExternalEventType,
            viewTooltip: {
              content: 'View External Event Type',
              placement: 'bottom',
            },
          },
          target: actionsDiv,
        });

        return actionsDiv;
      },
      cellRendererParams: {
        deleteExternalEventType,
        viewExternalEventType,
      } as CellRendererParams,
      headerName: '',
      resizable: false,
      sortable: false,
      width: 60,
    },
  ];

  const modalColumnSizeNoDetail: string = '1fr 3px 0fr';
  const modalColumnSizeWithDetailDerivationGroup: string = '3fr 3px 1.3fr';
  const modalColumnSizeWithDetailExternalEventType: string = '2fr 3px 1.2fr';
  const modalColumnSizeWithDetailExternalSourceType: string = '2fr 3px 1.2fr';
  let modalColumnSize: string = modalColumnSizeNoDetail;

  let filterString: string = '';

  let selectedDerivationGroup: DerivationGroup | undefined = undefined;
  let selectedDerivationGroupSources: ExternalSourceSlim[] = [];

  let selectedExternalSourceType: ExternalSourceType | undefined = undefined;
  let selectedExternalSourceTypeDerivationGroups: DerivationGroup[] = [];

  let selectedExternalEventType: ExternalEventType | undefined = undefined;
  let selectedExternalEventTypeDerivationGroups: DerivationGroup[] = [];

  $: selectedDerivationGroupSources = $externalSources.filter(
    source => selectedDerivationGroup?.name === source.pkey.derivation_group_name,
  );

  $: selectedExternalSourceTypeDerivationGroups = $derivationGroups.filter(derivationGroup => {
    if (selectedExternalSourceType !== undefined) {
      return derivationGroup.source_type_name === selectedExternalSourceType.name;
    } else {
      return false;
    }
  });

  $: selectedExternalEventTypeDerivationGroups = $derivationGroups.filter(derivationGroup => {
    if (selectedExternalEventType !== undefined) {
      return derivationGroup.event_types.includes(selectedExternalEventType.name);
    } else {
      return false;
    }
  });

  async function deleteDerivationGroup(derivationGroup: DerivationGroup) {
    // Makes sure all associated sources are deleted before this. List of sources already contained in DerivationGroup type.
    await showDeleteDerivationGroupModal(derivationGroup, user);
  }

  async function deleteExternalSourceType(sourceType: ExternalSourceType) {
    let associatedDGs = $derivationGroups.filter(derivationGroup => derivationGroup.source_type_name === sourceType.name);

    // makes sure all associated derivation groups are deleted before this
    await showDeleteExternalSourceTypeModal(sourceType, associatedDGs, user);
  }

  async function deleteExternalEventType(eventType: ExternalEventType) {
    const associatedDerivationGroups: DerivationGroup[] = getAssociatedDerivationGroupsByEventType(eventType.name);
    const associatedExternalSourceNames: string[] = associatedDerivationGroups.flatMap(derivationGroup =>
      Array.from(derivationGroup.sources.keys()),
    );

    // makes sure all associated sources (and therefore events, as orphans are not possible) are deleted before this
    // NOTE: does not update in derivation_group_comp after removing a EE type; derivation_group_comp defaults to 0 event types after its last external source removed,
    //        as it has no awareness of external source type or paired events (as the latter don't even exist).
    await showDeleteExternalEventTypeModal(eventType, associatedExternalSourceNames, user);
  }

  function getAssociatedExternalSourcesBySourceType(sourceType: string | undefined) {
    if (sourceType === undefined) {
      return [];
    }
    let associatedSources = $externalSources.filter(source => source.source_type_name === sourceType);
    return associatedSources;
  }

  function getAssociatedDerivationGroupsBySourceTypeName(sourceTypeName: string | undefined) {
    if (sourceTypeName === undefined) {
      return [];
    }

    let associatedDerivationGroups = $derivationGroups.filter(derivationGroup => derivationGroup.source_type_name === sourceTypeName);

    return associatedDerivationGroups;
  }

  function getAssociatedDerivationGroupsByEventType(eventType: string | undefined) {
    if (eventType === undefined) {
      return [];
    }
    const associatedDerivationGroups: DerivationGroup[] = $derivationGroups.filter(derivationGroup =>
      derivationGroup.event_types.includes(eventType),
    );

    return associatedDerivationGroups;
  }

  function viewDerivationGroup(viewedDerivationGroup: DerivationGroup) {
    const derivationGroup = $derivationGroups.find(derivationGroup => derivationGroup.name === viewedDerivationGroup.name);
    if (selectedDerivationGroup === undefined || selectedDerivationGroup !== derivationGroup) {
      selectedDerivationGroup = derivationGroup;
      selectedExternalSourceType = undefined;
      selectedExternalEventType = undefined;
      modalColumnSize = modalColumnSizeWithDetailDerivationGroup;
    } else {
      selectedDerivationGroup = undefined;
      selectedExternalSourceType = undefined;
      selectedExternalEventType = undefined;
      modalColumnSize = modalColumnSizeNoDetail;
    }
  }

  function viewExternalSourceType(sourceType: ExternalSourceType) {
    if (selectedExternalSourceType === undefined || selectedExternalSourceType !== sourceType) {
      selectedDerivationGroup = undefined;
      selectedExternalSourceType = sourceType;
      selectedExternalEventType = undefined;
      modalColumnSize = modalColumnSizeWithDetailExternalSourceType;
    } else {
      selectedDerivationGroup = undefined;
      selectedExternalSourceType = undefined;
      selectedExternalEventType = undefined;
      modalColumnSize = modalColumnSizeNoDetail;
    }
  }

  function viewExternalEventType(eventType: ExternalEventType) {
    if (selectedExternalEventType === undefined || selectedExternalEventType !== eventType) {
      selectedDerivationGroup = undefined;
      selectedExternalSourceType = undefined;
      selectedExternalEventType = eventType;
      modalColumnSize = modalColumnSizeWithDetailExternalEventType;
    } else {
      selectedDerivationGroup = undefined;
      selectedExternalSourceType = undefined;
      selectedExternalEventType = undefined;
      modalColumnSize = modalColumnSizeNoDetail;
    }
  }
</script>

<Modal height={700} width={1000}>
  <ModalHeader on:close>Manage Derivation Groups and Types</ModalHeader>
  <ModalContent>
    <CssGrid columns={modalColumnSize} minHeight="100%">
      <div class="derivation-groups-modal-filter-container">
        <div style:height="100%">
          <Tabs class="management-tabs" tabListClassName="management-tabs-list">
            <svelte:fragment slot="tab-list">
              <Tab class="management-tab">Derivation Group</Tab>
              <Tab class="management-tab">External Source Type</Tab>
              <Tab class="management-tab">External Event Type</Tab>
            </svelte:fragment>
            <TabPanel>
              <DerivationGroupManagementTab {derivationGroupsColumnsDef} {filterString} />
            </TabPanel>
            <TabPanel>
              <ExternalSourceTypeManagementTab {externalSourceTypeColumnDefs} {filterString} />
            </TabPanel>
            <TabPanel>
              <ExternalEventTypeManagementTab {externalEventTypeColumnDefs} {filterString} />
            </TabPanel>
          </Tabs>
        </div>
      </div>
      {#if selectedDerivationGroup !== undefined}
        <CssGridGutter track={1} type="column" />
        <Panel borderRight padBody={true}>
          <svelte:fragment slot="header">
            <SectionTitle>
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
      {:else if selectedExternalSourceType !== undefined}
        <CssGridGutter track={1} type="column" />
        <Panel borderRight padBody={true}>
          <svelte:fragment slot="header">
            <SectionTitle>
              <Truck slot="icon" />Derivation Groups of Type '{selectedExternalSourceType.name}'
            </SectionTitle>
          </svelte:fragment>
          <svelte:fragment slot="body">
            {#if selectedExternalSourceTypeDerivationGroups.length > 0}
              {#each selectedExternalSourceTypeDerivationGroups as associatedDerivationGroup}
                <!-- Collapsible details -->
                <Collapse title={associatedDerivationGroup.name} tooltipContent={associatedDerivationGroup.name} defaultExpanded={false}>
                  <span slot="right">
                    <p style:color="gray">
                      {associatedDerivationGroup.derived_event_total} events
                    </p>
                  </span>
                  <p>
                    <strong>Name:</strong>
                    {associatedDerivationGroup.name}
                  </p>

                  <Collapse
                    className="anchor-collapse"
                    defaultExpanded={false}
                    title="Event Types"
                    tooltipContent="View Contained Event Types"
                  >
                    {#each associatedDerivationGroup.event_types as eventType}
                      <i>{eventType}</i>
                    {/each}
                  </Collapse>

                  <Collapse
                    className="anchor-collapse"
                    defaultExpanded={false}
                    title="Sources"
                    tooltipContent="View Contained External Sources"
                  >
                    {#each associatedDerivationGroup.sources as source}
                      <i>{source[0]}</i>
                    {/each}
                  </Collapse>
                </Collapse>
              {/each}
            {:else}
              <p>No sources associated with this External Source Type.</p>
            {/if}
          </svelte:fragment>
        </Panel>
      {:else if selectedExternalEventType !== undefined}
        <!--The introduction of schemas should allow this to be greatly simplified, as source types imply event types.
              Need to think about the strictness of EE Type and ES Type pairings, and whether the former can exist
              without an association with the former.-->
        <CssGridGutter track={1} type="column" />
        <Panel borderRight padBody={true}>
          <svelte:fragment slot="header">
            <SectionTitle>
              <Truck slot="icon" />Derivation Groups containing '{selectedExternalEventType.name}'
            </SectionTitle>
          </svelte:fragment>
          <svelte:fragment slot="body">
            {#if selectedExternalEventTypeDerivationGroups.length > 0}
              {#each selectedExternalEventTypeDerivationGroups as associatedDerivationGroup}
                <!-- Collapsible details -->
                <Collapse title={associatedDerivationGroup.name} tooltipContent={associatedDerivationGroup.name} defaultExpanded={false}>
                  <span slot="right">
                    <p style:color="gray">
                      {associatedDerivationGroup.derived_event_total} events
                    </p>
                  </span>
                  <p>
                    <strong>Name:</strong>
                    {associatedDerivationGroup.name}
                  </p>

                  <p>
                    <strong>Source Type:</strong>
                    {associatedDerivationGroup.source_type_name}
                  </p>

                  <Collapse
                    className="anchor-collapse"
                    defaultExpanded={false}
                    title="Event Types"
                    tooltipContent="View Contained Event Types"
                  >
                    {#each associatedDerivationGroup.event_types as eventType}
                      <i>{eventType}</i>
                    {/each}
                  </Collapse>

                  <Collapse
                    className="anchor-collapse"
                    defaultExpanded={false}
                    title="Sources"
                    tooltipContent="View Contained External Sources"
                  >
                    {#each associatedDerivationGroup.sources as source}
                      <i>{source[0]}</i>
                    {/each}
                  </Collapse>
                </Collapse>
              {/each}
            {:else}
              <p>No sources containing this event type.</p>
            {/if}
          </svelte:fragment>
        </Panel>
      {/if}
    </CssGrid>
  </ModalContent>
  <ModalFooter>
    <div class="filter">
      <input
        bind:value={filterString}
        autocomplete="off"
        class="st-input w-100"
        name="filter-ee"
        placeholder={`Filter ...`}
      />
    </div>
    <button class="st-button secondary" on:click={() => dispatch('close')}> Close </button>
  </ModalFooter>
</Modal>

<style>
  :global(.tab-list.management-tabs-list) {
    background-color: var(--st-gray-10);
  }

  :global(button.management-tab) {
    align-items: center;
    gap: 8px;
    text-align: center;
    width: 33%;
  }

  :global(button.management-tab:last-of-type) {
    flex: 1;
  }
  :global(button.management-tab:last-of-type.selected) {
    box-shadow: 1px 0px 0px inset var(--st-gray-20);
  }

  :global(button.management-tab:first-of-type.selected) {
    box-shadow: -1px 0px 0px inset var(--st-gray-20);
  }

  :global(button.management-tab:not(.selected)) {
    box-shadow: 0px -1px 0px inset var(--st-gray-20);
  }

  :global(button.management-tab.selected) {
    background-color: var(--st-gray-20);
    box-shadow:
      1px 0px 0px inset var(--st-gray-20),
      -1px 0px 0px inset var(--st-gray-20);
  }

  .derivation-groups-modal-filter-container {
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
    justify-content: flex-end;
    padding-right: 8px;
    width: 100%;
  }

  .filter {
    align-items: center;
    display: inline-flex;
    flex-direction: row;
    justify-self: center;
    width: 100%;
  }
</style>
