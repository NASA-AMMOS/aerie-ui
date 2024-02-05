<svelte:options immutable={true} />

<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import type { CellEditingStoppedEvent, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
  import { createEventDispatcher } from 'svelte';
  import { SearchParameters } from '../../enums/searchParameters';
  import { allowedConstraintSpecs, constraints } from '../../stores/constraints';
  import { plan, planId } from '../../stores/plan';
  import type { User } from '../../types/app';
  import type { ConstraintMetadata, ConstraintPlanSpec, ConstraintPlanSpecInsertInput } from '../../types/constraint';
  import type { DataGridColumnDef, RowId } from '../../types/data-grid';
  import effects from '../../utilities/effects';
  import { permissionHandler } from '../../utilities/permissionHandler';
  import { featurePermissions } from '../../utilities/permissions';
  import Input from '../form/Input.svelte';
  import type DataGrid from '../ui/DataGrid/DataGrid.svelte';
  import DataGridActions from '../ui/DataGrid/DataGridActions.svelte';
  import { tagsCellRenderer, tagsFilterValueGetter } from '../ui/DataGrid/DataGridTags';
  import SingleActionDataGrid from '../ui/DataGrid/SingleActionDataGrid.svelte';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let user: User | null;

  type CellRendererParams = {
    editConstraint: (constraint: ConstraintMetadata) => void;
  };
  type ConstraintsCellRendererParams = ICellRendererParams<ConstraintMetadata> & CellRendererParams;

  const dispatch = createEventDispatcher();
  const baseColumnDefs: DataGridColumnDef<ConstraintMetadata>[] = [
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
    { field: 'name', filter: 'text', headerName: 'Name', minWidth: 80, resizable: true, sortable: true },
    {
      field: 'owner',
      filter: 'string',
      headerName: 'Owner',
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 80,
    },
    {
      field: 'updated_by',
      filter: 'string',
      headerName: 'Updated By',
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 120,
    },
    {
      field: 'versions',
      filter: 'string',
      headerName: 'Latest',
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      valueGetter: (params: ValueGetterParams<ConstraintMetadata>) => {
        return params?.data?.versions[params?.data?.versions.length - 1].revision;
      },
      width: 80,
    },
    {
      autoHeight: true,
      cellRenderer: tagsCellRenderer,
      field: 'tags',
      filter: 'text',
      filterValueGetter: tagsFilterValueGetter,
      headerName: 'Tags',
      resizable: true,
      sortable: false,
      width: 220,
      wrapText: true,
    },
  ];
  const permissionError = 'You do not have permission to add this constraint.';

  let columnDefs = baseColumnDefs;

  let dataGrid: DataGrid<ConstraintMetadata> | undefined = undefined;
  let filterText: string = '';
  let filteredConstraints: ConstraintMetadata[] = [];
  let hasPermission: boolean = false;
  let selectedConstraints: Record<string, boolean> = {};

  $: filteredConstraints = $constraints.filter(constraint => {
    const filterTextLowerCase = filterText.toLowerCase();
    const includesId = `${constraint.id}`.includes(filterTextLowerCase);
    const includesName = constraint.name.toLocaleLowerCase().includes(filterTextLowerCase);
    return includesId || includesName;
  });
  $: selectedConstraints = $allowedConstraintSpecs.reduce(
    (prevBooleanMap: Record<string, boolean>, constraintPlanSpec: ConstraintPlanSpec) => {
      return {
        ...prevBooleanMap,
        [constraintPlanSpec.constraint_id]: true,
      };
    },
    {},
  );
  $: hasPermission = featurePermissions.constraints.canRead(user);
  $: {
    columnDefs = [
      ...baseColumnDefs,
      {
        cellClass: 'action-cell-container',
        cellRenderer: (params: ConstraintsCellRendererParams) => {
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'actions-cell';
          new DataGridActions({
            props: {
              editCallback: params.editConstraint,
              editTooltip: {
                content: 'Edit Constraint',
                placement: 'bottom',
              },
              hasEditPermission: params.data ? hasEditPermission(user, params.data) : false,
              rowData: params.data,
            },
            target: actionsDiv,
          });

          return actionsDiv;
        },
        cellRendererParams: {
          editConstraint,
        } as CellRendererParams,
        headerName: '',
        resizable: false,
        sortable: false,
        suppressAutoSize: true,
        suppressSizeToFit: true,
        width: 20,
      },
      {
        cellDataType: 'boolean',
        editable: true,
        headerName: '',
        suppressAutoSize: true,
        suppressSizeToFit: true,
        valueGetter: (params: ValueGetterParams<ConstraintMetadata>) => {
          const { data } = params;
          if (data) {
            return !!selectedConstraints[data.id];
          }
          return false;
        },
        width: 35,
      },
    ];
  }
  $: if (selectedConstraints) {
    dataGrid?.redrawRows();
  }

  function editConstraint({ id }: Pick<ConstraintMetadata, 'id'>) {
    const constraint = $constraints.find(c => c.id === id);
    goto(
      `${base}/constraints/edit/${id}?${SearchParameters.REVISION}=${
        constraint?.versions[constraint?.versions.length - 1].revision
      }&${SearchParameters.PLAN_ID}=${$planId}`,
    );
  }

  function editConstraintContext(event: CustomEvent<RowId[]>) {
    editConstraint({ id: event.detail[0] as number });
  }

  function hasEditPermission(_user: User | null, constraint: ConstraintMetadata) {
    return featurePermissions.constraints.canUpdate(user, constraint);
  }

  function onToggleConstraint(event: CustomEvent<CellEditingStoppedEvent<ConstraintMetadata, boolean>>) {
    const {
      detail: { data, newValue },
    } = event;

    if (data) {
      selectedConstraints = {
        ...selectedConstraints,
        [data.id]: newValue,
      };
    }
  }

  async function onUpdateConstraints(selectedConstraints: Record<number, boolean>) {
    if ($plan) {
      const constraintPlanSpecUpdates: {
        constraintPlanSpecIdsToDelete: number[];
        constraintPlanSpecsToAdd: ConstraintPlanSpecInsertInput[];
      } = Object.keys(selectedConstraints).reduce(
        (
          prevConstraintPlanSpecUpdates: {
            constraintPlanSpecIdsToDelete: number[];
            constraintPlanSpecsToAdd: ConstraintPlanSpecInsertInput[];
          },
          selectedConstraintId: string,
        ) => {
          const constraintId = parseInt(selectedConstraintId);
          const isSelected = selectedConstraints[constraintId];

          if (isSelected) {
            return {
              ...prevConstraintPlanSpecUpdates,
              constraintPlanSpecsToAdd: [
                ...prevConstraintPlanSpecUpdates.constraintPlanSpecsToAdd,
                {
                  constraint_id: constraintId,
                  constraint_revision: null,
                  enabled: true,
                  plan_id: $planId,
                } as ConstraintPlanSpecInsertInput,
              ],
            };
          } else {
            return {
              ...prevConstraintPlanSpecUpdates,
              constraintPlanSpecIdsToDelete: [
                ...prevConstraintPlanSpecUpdates.constraintPlanSpecIdsToDelete,
                constraintId,
              ],
            };
          }
        },
        {
          constraintPlanSpecIdsToDelete: [],
          constraintPlanSpecsToAdd: [],
        },
      );

      effects.updateConstraintPlanSpecifications($plan, constraintPlanSpecUpdates.constraintPlanSpecsToAdd, user);
      effects.deleteConstraintPlanSpecifications($plan, constraintPlanSpecUpdates.constraintPlanSpecIdsToDelete, user);
      dispatch('close');
    }
  }
</script>

<Modal height={500} width={600}>
  <ModalHeader on:close>Manage Constraints</ModalHeader>
  <ModalContent style="padding:0">
    <div class="constraints-modal-container">
      <div class="constraints-modal-filter-container">
        <div class="constraints-modal-title">Constraints</div>
        <Input>
          <input bind:value={filterText} class="st-input" placeholder="Filter constraints" style="width: 100%;" />
        </Input>
        <button
          class="st-button secondary ellipsis"
          use:permissionHandler={{
            hasPermission,
            permissionError,
          }}
          on:click={() => goto(`${base}/constraints/new?${SearchParameters.PLAN_ID}=${$planId}`)}
        >
          New
        </button>
      </div>
      <hr />
      <div class="constraints-modal-table-container">
        {#if filteredConstraints.length}
          <SingleActionDataGrid
            bind:dataGrid
            {columnDefs}
            hasEdit={true}
            {hasEditPermission}
            itemDisplayText="Constraint"
            items={filteredConstraints}
            {user}
            on:cellEditingStopped={onToggleConstraint}
            on:editItem={editConstraintContext}
          />
        {:else}
          <div class="p1 st-typography-label">No Constraints Found</div>
        {/if}
      </div>
    </div>
  </ModalContent>
  <ModalFooter>
    <button class="st-button secondary" on:click={() => dispatch('close')}> Cancel </button>
    <button class="st-button" on:click={() => onUpdateConstraints(selectedConstraints)}> Update </button>
  </ModalFooter>
</Modal>

<style>
  .constraints-modal-container {
    display: grid;
    grid-template-rows: min-content min-content auto;
    height: 100%;
    row-gap: 0.5rem;
  }

  .constraints-modal-container hr {
    border: none;
    border-top: 1px solid var(--st-gray-30);
    margin: 0 1rem;
    width: auto;
  }

  .constraints-modal-filter-container {
    align-items: center;
    column-gap: 0.25rem;
    display: grid;
    grid-template-columns: min-content auto min-content;
    margin: 0.5rem 1rem 0;
  }

  .constraints-modal-title {
    font-weight: bold;
  }

  .constraints-modal-table-container {
    height: 100%;
    padding: 0 1rem 0.5rem;
    width: 100%;
  }
</style>
