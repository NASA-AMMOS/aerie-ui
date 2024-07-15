<svelte:options immutable={true} />

<script lang="ts">
  import type { ICellRendererParams } from 'ag-grid-community';
  import { createEventDispatcher } from 'svelte';
  import { derivationGroupPlanLinkError, derivationGroups, selectedPlanDerivationGroupIds } from '../../stores/external-source';
  import { plan } from '../../stores/plan';
  import type { User } from '../../types/app';
  import type { DerivationGroupMetadata } from '../../types/constraint';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import effects from '../../utilities/effects';
  import Input from '../form/Input.svelte';
  import DataGrid from '../ui/DataGrid/DataGrid.svelte';
  import DataGridActions from '../ui/DataGrid/DataGridActions.svelte';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalFooter from './ModalFooter.svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let user: User | null;

  type CellRendererParams = {
    viewDerivationGroup: (derivationGroup: DerivationGroupMetadata) => void;
  };
  type DerivationGroupCellRendererParams = ICellRendererParams<DerivationGroupMetadata> & CellRendererParams;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  // TODO: Finish updating these
  // TODO: Include source type(s) here, maybe as a mouse-over to derivation group? or maybe swap that and the event counts?
  const baseColumnDefs: DataGridColumnDef<DerivationGroupMetadata>[] = [
    {
      field: 'name',
      filter: 'string',
      headerName: 'Derivation Group',
      resizable: true,
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 385,
    },
    {
      field: 'totalEventCount',
      filter: 'number',
      headerName: 'Events in derivation group',
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 190,
    },
    {
      cellRenderer: (params: DerivationGroupCellRendererParams) => {
        var input = document.createElement('input');
        input.type = 'checkbox';
        input.checked=$selectedPlanDerivationGroupIds.includes(params.data.id)
        input.addEventListener('click', (event) => {
          if (event?.target && params.data) {
            if (event.target.checked) {
              // insert
              effects.insertDerivationGroupForPlan(params.data.id, $plan, user);
              if (derivationGroupPlanLinkError !== null) {
                console.log("Successfully linked derivation group & plan.");
              }
            } else {
              // delete
              effects.deleteDerivationGroupForPlan(params.data.id, $plan, user);
              if (derivationGroupPlanLinkError !== null) {
                console.log("Failed to link derivation group & plan.");
              }
            }
          }
        });
        return input;
      },
      field: 'updated_by',
      filter: 'string',
      headerName: 'Included',
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 100,
    },
  ];
  // TODO
  //const permissionError = 'You do not have permission to add this derivation group.';

  let columnDefs = baseColumnDefs;

  let dataGrid: DataGrid<DerivationGroupMetadata> | undefined = undefined;
  let filterText: string = '';
  let filteredDerivationGroups: DerivationGroupMetadata[] = [];
  // TODO
  //let hasCreatePermission: boolean = false;
  //let hasEditSpecPermission: boolean = false;
  let selectedDerivationGroups: Record<string, boolean> = {};

  $: filteredDerivationGroups = $derivationGroups.filter(derivationGroup => {
    const filterTextLowerCase = filterText.toLowerCase();
    const includesId = `${derivationGroup.id}`.includes(filterTextLowerCase);
    const includesName = derivationGroup.name.toLocaleLowerCase().includes(filterTextLowerCase);
    return includesId || includesName;
  });
  // TODO
  // $: selectedDerivationGroups = $allowedConstraintSpecs.reduce(
  //   (prevBooleanMap: Record<string, boolean>, constraintPlanSpec: ConstraintPlanSpec) => {
  //     return {
  //       ...prevBooleanMap,
  //       [constraintPlanSpec.constraint_id]: true,
  //     };
  //   },
  //   {},
  // );
  /** TODO
  $: hasCreatePermission = featurePermissions.derivationGroup.canCreate(user);
  $: hasEditSpecPermission = $plan ? featurePermissions.constraintsPlanSpec.canUpdate(user, $plan) : false;
  */


  // <input
  //       type="checkbox"
  //       bind:checked={enabled}
  //       style:cursor="pointer"
  //       on:change={onEnable}
  //       on:click|stopPropagation
  //     />

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
      }
    ];
  }
  // TODO
  // $: if (selectedDerivationGroups) {
  //   dataGrid?.redrawRows();
  // }

  function viewDerivationGroup({ id }: Pick<DerivationGroupMetadata, 'id'>) {
    const derivationGroup = $derivationGroups.find(dg => dg.id === id);
    console.log(derivationGroup);
    /** TODO
    window.open(
      `${base}/constraints/edit/${derivation?.id}?${SearchParameters.REVISION}=${constraint?.versions[0].revision}&${SearchParameters.MODEL_ID}=${$plan?.model.id}`,
    );
    **/
  }

  // function onToggleConstraint(event: CustomEvent<CellEditingStoppedEvent<DerivationGroupMetadata, boolean>>) {
  //   const {
  //     detail: { data, newValue },
  //   } = event;

  //   if (data) {
  //     selectedDerivationGroups = {
  //       ...selectedDerivationGroups,
  //       [data.id]: newValue,
  //     };
  //   }
  // }

  // async function onUpdateConstraints(selectedDerivationGroups: Record<number, boolean>) {
  //   if ($plan) {
  //     const constraintPlanSpecUpdates: {
  //       constraintPlanSpecIdsToDelete: number[];
  //       constraintPlanSpecsToAdd: ConstraintPlanSpecInsertInput[];
  //     } = Object.keys(selectedDerivationGroups).reduce(
  //       (
  //         prevConstraintPlanSpecUpdates: {
  //           constraintPlanSpecIdsToDelete: number[];
  //           constraintPlanSpecsToAdd: ConstraintPlanSpecInsertInput[];
  //         },
  //         selectedConstraintId: string,
  //       ) => {
  //         const constraintId = parseInt(selectedConstraintId);
  //         const isSelected = selectedDerivationGroups[constraintId];
  //         const constraintPlanSpec = $allowedConstraintPlanSpecMap[constraintId];

  //         if (isSelected) {
  //           if (!constraintPlanSpec || constraintPlanSpec.constraint_metadata?.owner === user?.id) {
  //             return {
  //               ...prevConstraintPlanSpecUpdates,
  //               constraintPlanSpecsToAdd: [
  //                 ...prevConstraintPlanSpecUpdates.constraintPlanSpecsToAdd,
  //                 {
  //                   constraint_id: constraintId,
  //                   constraint_revision: null,
  //                   enabled: true,
  //                   plan_id: $planId,
  //                 } as ConstraintPlanSpecInsertInput,
  //               ],
  //             };
  //           }
  //           return prevConstraintPlanSpecUpdates;
  //         } else {
  //           return {
  //             ...prevConstraintPlanSpecUpdates,
  //             constraintPlanSpecIdsToDelete: [
  //               ...prevConstraintPlanSpecUpdates.constraintPlanSpecIdsToDelete,
  //               constraintId,
  //             ],
  //           };
  //         }
  //       },
  //       {
  //         constraintPlanSpecIdsToDelete: [],
  //         constraintPlanSpecsToAdd: [],
  //       },
  //     );

  //     await effects.updateConstraintPlanSpecifications(
  //       $plan,
  //       constraintPlanSpecUpdates.constraintPlanSpecsToAdd,
  //       constraintPlanSpecUpdates.constraintPlanSpecIdsToDelete,
  //       user,
  //     );
  //     dispatch('close');
  //   }
  // }
</script>

<Modal height={500} width={750}>
  <ModalHeader on:close>Manage Derivation Groups</ModalHeader>
  <ModalContent style="padding:0">
    <div class="derivationgroups-modal-container">
      <div class="derivationgroups-modal-filter-container">
        <div class="derivationgroups-modal-title">Derivation Groups</div>
        <Input>
          <input bind:value={filterText} class="st-input" placeholder="Filter derivation groups" style="width: 100%;" />
        </Input>
        <!-- TODO
         use:permissionHandler={{
          hasPermission: hasCreatePermission,
          permissionError,
        }} -->
        <!-- TODO on:click={() => window.open(`${base}/constraints/new?${SearchParameters.MODEL_ID}=${$plan?.model_id}`)} -->
        <button
          class="st-button secondary ellipsis"
          name="new-constraint"
        >
          Upload
        </button>
      </div>
      <hr />

      <!-- TODO
       on:cellEditingStopped={onToggleConstraint} -->
      <div class="constraiderivationgroups-modal-table-container">
        {#if filteredDerivationGroups.length}
          <DataGrid
            bind:this={dataGrid}
            {columnDefs}
            rowData={filteredDerivationGroups}
          />
        {:else}
          <div class="p1 st-typography-label">No Derivation Groups Found</div>
        {/if}
      </div>
    </div>
  </ModalContent>
  <ModalFooter>
    <button class="st-button secondary" on:click={() => dispatch('close')}> Cancel </button>

    <!-- TODO
    use:permissionHandler={{
      hasPermission: hasEditSpecPermission && !$planReadOnly,
      permissionError: $planReadOnly
        ? PlanStatusMessages.READ_ONLY
        : 'You do not have permission to update the constraints on this plan.',
    }} -->
    <!-- <button
      class="st-button"
      on:click={() => onUpdateConstraints(selectedDerivationGroups)}
    >
      Update
    </button> -->
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
