<svelte:options immutable={true} />

<script lang="ts">
  import type { ICellRendererParams } from 'ag-grid-community';
  import { createEventDispatcher } from 'svelte';
  import { initializeView, view, views } from '../../stores/views';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { View } from '../../types/view';
  import effects from '../../utilities/effects';
  import { setQueryParam } from '../../utilities/generic';
  import BulkActionDataGrid from '../ui/DataGrid/BulkActionDataGrid.svelte';
  import DataGridActions from '../ui/DataGrid/DataGridActions.svelte';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let height: number | string = 150;
  export let width: number | string = 380;

  type CellRendererParams = {
    deleteView: (view: View) => void;
    openView: (view: View) => void;
  };
  type ViewCellRendererParams = ICellRendererParams<View> & CellRendererParams;

  const dispatch = createEventDispatcher();
  const columnDefs: DataGridColumnDef[] = [
    {
      field: 'id',
      filter: 'number',
      headerName: 'ID',
      resizable: true,
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 60,
    },
    { field: 'name', filter: 'text', headerName: 'Name', resizable: true, sortable: true },
    { field: 'owner', filter: 'text', headerName: 'Owner', resizable: true, sortable: true },
    { field: 'updated_at', filter: 'text', headerName: 'Last Edited', resizable: true, sortable: true },
    {
      cellClass: 'action-cell-container',
      cellRenderer: (params: ViewCellRendererParams) => {
        const isEditable = params.data.owner !== 'system';
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions-cell';
        new DataGridActions({
          props: {
            ...(isEditable
              ? {
                  deleteCallback: params.deleteView,
                  deleteTooltip: {
                    content: 'Delete View',
                    placement: 'bottom',
                  },
                }
              : {}),
            rowData: params.data,
            viewCallback: params.openView,
            viewTooltip: {
              content: 'Open View',
              placement: 'bottom',
            },
          },
          target: actionsDiv,
        });

        return actionsDiv;
      },
      cellRendererParams: {
        deleteView,
        openView,
      } as CellRendererParams,
      field: 'actions',
      headerName: '',
      resizable: false,
      sortable: false,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 55,
    },
  ];

  async function deleteView({ id: viewId }: View) {
    const success = await effects.deleteView(viewId);

    if (success) {
      if ($view.id === viewId) {
        goToNextView();
      }
    }
  }

  async function deleteViews({ detail: views }: CustomEvent<View[]>) {
    const ids = views.map(({ id }) => id);
    const success = await effects.deleteViews(ids);

    if (success) {
      if (ids.includes($view.id)) {
        goToNextView();
      }
    }
  }

  async function goToNextView() {
    const nextView = await effects.getView(null);
    initializeView({ ...nextView });
    setQueryParam('viewId', `${nextView.id}`);
  }

  async function openView({ id: viewId }: View) {
    const query = new URLSearchParams(`?viewId=${viewId}`);
    const newView = await effects.getView(query);

    if (view) {
      initializeView({ ...newView });
      setQueryParam('viewId', `${newView.id}`);
      dispatch('close');
    } else {
      console.log(`No view found for ID: ${viewId}`);
    }
  }
</script>

<Modal {height} {width}>
  <ModalHeader on:close>Saved Views</ModalHeader>
  <ModalContent>
    <BulkActionDataGrid
      {columnDefs}
      isRowSelectable={rowData => rowData.data.owner !== 'system'}
      items={$views}
      pluralItemDisplayText="Views"
      singleItemDisplayText="View"
      on:bulkDeleteItems={deleteViews}
      on:rowDoubleClicked={event => openView(event.detail)}
    />
  </ModalContent>
  <ModalFooter>
    <button class="st-button" on:click={() => dispatch('close')}> Close </button>
  </ModalFooter>
</Modal>
