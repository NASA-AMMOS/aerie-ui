<svelte:options immutable={true} />

<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import PageTitle from '../../../components/app/PageTitle.svelte';
  import ModelAssociations from '../../../components/model/ModelAssociations.svelte';
  import ModelForm from '../../../components/model/ModelForm.svelte';
  import CssGrid from '../../../components/ui/CssGrid.svelte';
  import CssGridGutter from '../../../components/ui/CssGridGutter.svelte';
  import Panel from '../../../components/ui/Panel.svelte';
  import SectionTitle from '../../../components/ui/SectionTitle.svelte';
  import { SearchParameters } from '../../../enums/searchParameters';
  import { constraints } from '../../../stores/constraints';
  import { model } from '../../../stores/model';
  import { schedulingConditions, schedulingGoals } from '../../../stores/scheduling';
  import type { User, UserId } from '../../../types/app';
  import type { ConstraintModelSpecInsertInput } from '../../../types/constraint';
  import type { Association, BaseMetadata } from '../../../types/metadata';
  import type {
    SchedulingConditionModelSpecificationInsertInput,
    SchedulingGoalModelSpecificationInsertInput,
    SchedulingGoalModelSpecificationSetInput,
  } from '../../../types/scheduling';
  import effects from '../../../utilities/effects';
  import { featurePermissions } from '../../../utilities/permissions';
  import type { PageData } from './$types';

  export let data: PageData;

  let hasCreatePermission: boolean = false;
  let hasEditSpecPermission: boolean = false;
  let hasModelChanged: boolean = false;
  let metadataList: BaseMetadata[] = [];
  let modelMetadata: {
    description?: string;
    name: string;
    owner: UserId;
    version: string;
  } | null = null;
  let initialModelMetadata: {
    description?: string;
    name: string;
    owner: UserId;
    version: string;
  } | null = null;
  let initialSelectedModelSpecifications: Record<
    Association,
    Record<
      number,
      {
        priority?: number;
        revision: number | null;
        selected: boolean;
      }
    >
  > = {
    condition: {},
    constraint: {},
    goal: {},
  };
  let selectedModelSpecifications: Record<
    Association,
    Record<
      number,
      {
        priority?: number;
        revision: number | null;
        selected: boolean;
      }
    >
  > = {
    condition: {},
    constraint: {},
    goal: {},
  };
  let selectedSpecifications: Record<
    number,
    {
      priority?: number;
      revision: number | null;
      selected: boolean;
    }
  > = {};
  let selectedAssociation: Association = 'constraint';
  let user: User | null = null;

  $: user = data.user;
  $: model.update(() => data.initialModel);
  $: if ($model) {
    initialModelMetadata = {
      description: $model.description,
      name: $model.name,
      owner: $model.owner,
      version: $model.version,
    };
    initialSelectedModelSpecifications = {
      condition: $model.scheduling_specification_conditions.reduce((selectedSpecs, conditionSpecification) => {
        return {
          ...selectedSpecs,
          [conditionSpecification.condition_id]: {
            revision: conditionSpecification.condition_revision,
            selected: true,
          },
        };
      }, {}),
      constraint: $model.constraint_specification.reduce((selectedSpecs, constraintSpecification) => {
        return {
          ...selectedSpecs,
          [constraintSpecification.constraint_id]: {
            revision: constraintSpecification.constraint_revision,
            selected: true,
          },
        };
      }, {}),
      goal: $model.scheduling_specification_goals.reduce((selectedSpecs, goalSpecification) => {
        return {
          ...selectedSpecs,
          [goalSpecification.goal_id]: {
            priority: goalSpecification.priority,
            revision: goalSpecification.goal_revision,
            selected: true,
          },
        };
      }, {}),
    };
    modelMetadata = { ...initialModelMetadata };
    selectedModelSpecifications = { ...initialSelectedModelSpecifications };
  }
  $: switch (selectedAssociation) {
    case 'goal':
      hasCreatePermission = featurePermissions.schedulingGoals.canCreate(user);
      hasEditSpecPermission = featurePermissions.schedulingGoalsModelSpec.canUpdate(user);
      metadataList = $schedulingGoals;
      selectedSpecifications = selectedModelSpecifications.goal;
      break;
    case 'condition':
      hasCreatePermission = featurePermissions.schedulingConditions.canCreate(user);
      hasEditSpecPermission = featurePermissions.schedulingConditionsModelSpec.canUpdate(user);
      metadataList = $schedulingConditions;
      selectedSpecifications = selectedModelSpecifications.condition;
      break;
    case 'constraint':
    default:
      hasCreatePermission = featurePermissions.constraints.canCreate(user);
      hasEditSpecPermission = featurePermissions.constraintsModelSpec.canUpdate(user);
      metadataList = $constraints;
      selectedSpecifications = selectedModelSpecifications.constraint;
  }
  $: hasModelChanged =
    JSON.stringify(initialModelMetadata) !== JSON.stringify(modelMetadata) ||
    JSON.stringify(initialSelectedModelSpecifications) !== JSON.stringify(selectedModelSpecifications);

  function onClose() {
    goto(`${base}/models`);
  }

  function onCreatePlanWithModel(event: CustomEvent<number>) {
    const { detail: modelId } = event;

    goto(`${base}/plans?modelId=${modelId}`);
  }

  async function onDeleteModel() {
    if ($model) {
      await effects.deleteModel($model, user);

      goto(`${base}/models`);
    }
  }

  function onModelMetadataChange(
    event: CustomEvent<{
      description: string;
      name: string;
      owner: UserId;
      version: string;
    }>,
  ) {
    const { detail: metadata } = event;

    modelMetadata = metadata;
  }

  async function onSave() {
    if ($model && modelMetadata) {
      await effects.updateModel($model.id, modelMetadata, user);

      const constraintModelSpecUpdates: {
        constraintIdsToDelete: number[];
        constraintModelSpecsToAdd: ConstraintModelSpecInsertInput[];
      } = Object.keys(selectedModelSpecifications.constraint).reduce(
        (
          prevConstraintPlanSpecUpdates: {
            constraintIdsToDelete: number[];
            constraintModelSpecsToAdd: ConstraintModelSpecInsertInput[];
          },
          selectedConstraintId: string,
        ) => {
          const constraintId = parseInt(selectedConstraintId);
          const constraintSpecification = selectedModelSpecifications.constraint[constraintId];
          const isSelected = constraintSpecification.selected;
          if (isSelected) {
            return {
              ...prevConstraintPlanSpecUpdates,
              constraintModelSpecsToAdd: [
                ...prevConstraintPlanSpecUpdates.constraintModelSpecsToAdd,
                {
                  constraint_id: constraintId,
                  constraint_revision: constraintSpecification.revision,
                  model_id: $model?.id,
                } as ConstraintModelSpecInsertInput,
              ],
            };
          } else {
            return {
              ...prevConstraintPlanSpecUpdates,
              constraintIdsToDelete: [...prevConstraintPlanSpecUpdates.constraintIdsToDelete, constraintId],
            };
          }
        },
        {
          constraintIdsToDelete: [],
          constraintModelSpecsToAdd: [],
        },
      );
      await effects.updateConstraintModelSpecifications(
        $model,
        constraintModelSpecUpdates.constraintModelSpecsToAdd,
        constraintModelSpecUpdates.constraintIdsToDelete,
        user,
      );

      const conditionModelSpecUpdates: {
        conditionIdsToDelete: number[];
        conditionModelSpecsToAdd: SchedulingConditionModelSpecificationInsertInput[];
      } = Object.keys(selectedModelSpecifications.condition).reduce(
        (
          prevConstraintPlanSpecUpdates: {
            conditionIdsToDelete: number[];
            conditionModelSpecsToAdd: SchedulingConditionModelSpecificationInsertInput[];
          },
          selectedConstraintId: string,
        ) => {
          const conditionId = parseInt(selectedConstraintId);
          const conditionSpecification = selectedModelSpecifications.condition[conditionId];
          const isSelected = conditionSpecification.selected;
          if (isSelected) {
            return {
              ...prevConstraintPlanSpecUpdates,
              conditionModelSpecsToAdd: [
                ...prevConstraintPlanSpecUpdates.conditionModelSpecsToAdd,
                {
                  condition_id: conditionId,
                  condition_revision: conditionSpecification.revision,
                  model_id: $model?.id,
                } as SchedulingConditionModelSpecificationInsertInput,
              ],
            };
          } else {
            return {
              ...prevConstraintPlanSpecUpdates,
              conditionIdsToDelete: [...prevConstraintPlanSpecUpdates.conditionIdsToDelete, conditionId],
            };
          }
        },
        {
          conditionIdsToDelete: [],
          conditionModelSpecsToAdd: [],
        },
      );
      await effects.updateSchedulingConditionModelSpecifications(
        $model,
        conditionModelSpecUpdates.conditionModelSpecsToAdd,
        conditionModelSpecUpdates.conditionIdsToDelete,
        user,
      );

      const goalModelSpecUpdates: {
        goalIdsToDelete: number[];
        goalModelSpecsToAdd: SchedulingGoalModelSpecificationInsertInput[];
        goalModelSpecsToUpdate: SchedulingGoalModelSpecificationSetInput[];
      } = Object.keys(selectedModelSpecifications.goal).reduce(
        (
          prevConstraintPlanSpecUpdates: {
            goalIdsToDelete: number[];
            goalModelSpecsToAdd: SchedulingGoalModelSpecificationInsertInput[];
            goalModelSpecsToUpdate: SchedulingGoalModelSpecificationSetInput[];
          },
          selectedConstraintId: string,
        ) => {
          const goalId = parseInt(selectedConstraintId);
          const goalSpecification = selectedModelSpecifications.goal[goalId];
          const isSelected = goalSpecification.selected;

          if (isSelected && initialSelectedModelSpecifications.goal[goalId] === undefined) {
            return {
              ...prevConstraintPlanSpecUpdates,
              goalModelSpecsToAdd: [
                ...prevConstraintPlanSpecUpdates.goalModelSpecsToAdd,
                {
                  goal_id: goalId,
                  goal_revision: goalSpecification.revision,
                  model_id: $model?.id,
                  priority: goalSpecification.priority,
                } as SchedulingGoalModelSpecificationInsertInput,
              ],
            };
          } else if (isSelected) {
            return {
              ...prevConstraintPlanSpecUpdates,
              goalModelSpecsToUpdate: [
                ...prevConstraintPlanSpecUpdates.goalModelSpecsToUpdate,
                {
                  goal_id: goalId,
                  goal_revision: goalSpecification.revision,
                  model_id: $model?.id,
                  priority: goalSpecification.priority,
                } as SchedulingGoalModelSpecificationSetInput,
              ],
            };
          } else {
            return {
              ...prevConstraintPlanSpecUpdates,
              goalIdsToDelete: [...prevConstraintPlanSpecUpdates.goalIdsToDelete, goalId],
            };
          }
        },
        {
          goalIdsToDelete: [],
          goalModelSpecsToAdd: [],
          goalModelSpecsToUpdate: [],
        },
      );
      await effects.updateSchedulingGoalModelSpecifications(
        $model,
        goalModelSpecUpdates.goalModelSpecsToAdd,
        goalModelSpecUpdates.goalIdsToDelete,
        user,
      );
      for (let i = 0; i < goalModelSpecUpdates.goalModelSpecsToUpdate.length; i++) {
        const goalSpecUpdate = goalModelSpecUpdates.goalModelSpecsToUpdate[i];
        await effects.updateSchedulingGoalModelSpecification($model, goalSpecUpdate, user);
      }

      const finalUpdatedModel = await effects.getModel($model.id, user);

      model.update(() => finalUpdatedModel);
    }
  }

  function onSelectAssociation(event: CustomEvent<Association>) {
    const { detail } = event;
    selectedAssociation = detail;
  }

  function onToggleSpecification(event: CustomEvent<{ id: number; selected: boolean }>) {
    const {
      detail: { id, selected },
    } = event;

    selectedModelSpecifications = {
      ...selectedModelSpecifications,
      [selectedAssociation]: {
        ...selectedModelSpecifications[selectedAssociation],
        [id]: {
          ...selectedModelSpecifications[selectedAssociation][id],
          priority: selectedAssociation === 'goal' ? 0 : undefined,
          selected,
        },
      },
    };
  }

  function onUpdateSpecifications(
    event: CustomEvent<
      Record<
        number,
        {
          priority?: number;
          revision: number | null;
          selected: boolean;
        }
      >
    >,
  ) {
    const { detail: updatedSpecifications } = event;

    selectedSpecifications = updatedSpecifications;

    switch (selectedAssociation) {
      case 'condition':
        selectedModelSpecifications.condition = selectedSpecifications;
        break;
      case 'goal':
        selectedModelSpecifications.goal = selectedSpecifications;
        break;
      case 'constraint':
      default:
        selectedModelSpecifications.constraint = selectedSpecifications;
    }

    selectedModelSpecifications = { ...selectedModelSpecifications };
  }

  function onViewMetadata(event: CustomEvent<number>) {
    const { detail: id } = event;

    switch (selectedAssociation) {
      case 'condition':
        window.open(`${base}/scheduling/conditions/edit/${id}?${SearchParameters.MODEL_ID}=${$model?.id}`);
        break;
      case 'goal':
        window.open(`${base}/scheduling/goals/edit/${id}?${SearchParameters.MODEL_ID}=${$model?.id}`);
        break;
      case 'constraint':
      default:
        window.open(`${base}/constraints/edit/${id}?${SearchParameters.MODEL_ID}=${$model?.id}`);
    }
  }
</script>

<PageTitle subTitle={data.initialModel.name} title="Models" />

<CssGrid columns="0.5fr 3px 1fr">
  <Panel>
    <svelte:fragment slot="header">
      <SectionTitle>Model info</SectionTitle>
    </svelte:fragment>

    <svelte:fragment slot="body">
      <ModelForm
        initialModelDescription={$model?.description}
        initialModelName={$model?.name}
        initialModelOwner={$model?.owner}
        initialModelVersion={$model?.version}
        modelId={$model?.id}
        createdAt={$model?.created_at}
        user={data.user}
        on:createPlan={onCreatePlanWithModel}
        on:deleteModel={onDeleteModel}
        on:hasModelChanged={onModelMetadataChange}
      />
    </svelte:fragment>
  </Panel>

  <CssGridGutter track={1} type="column" />

  <ModelAssociations
    {hasCreatePermission}
    {hasEditSpecPermission}
    {hasModelChanged}
    {metadataList}
    model={$model}
    {selectedAssociation}
    {selectedSpecifications}
    on:close={onClose}
    on:save={onSave}
    on:selectAssociation={onSelectAssociation}
    on:toggleSpecification={onToggleSpecification}
    on:updateSpecifications={onUpdateSpecifications}
    on:viewMetadata={onViewMetadata}
  />
</CssGrid>
