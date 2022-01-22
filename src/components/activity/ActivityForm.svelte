<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type {
    ActivitiesMap,
    ActivityType,
    ArgumentsMap,
    FormParameter,
  } from '../../types';
  import Field from '../form/Field.svelte';
  import Label from '../form/Label.svelte';
  import ConfirmModal from '../modals/Confirm.svelte';
  import Decomposition from './Decomposition.svelte';
  import Parameters from '../parameters/Parameters.svelte';
  import Panel from '../ui/Panel.svelte';
  import { reqValidateActivityArguments } from '../../utilities/requests';
  import Card from '../ui/Card.svelte';
  import { required, timestamp } from '../../utilities/validators';
  import {
    getFormParameters,
    updateFormParameter,
  } from '../../utilities/parameters';
  import { tooltip } from '../../utilities/tooltip';
  import Input from '../form/Input.svelte';
  import { field } from '../../stores/form';
  import Error from '../form/Error.svelte';

  const dispatch = createEventDispatcher();

  export let activitiesMap: ActivitiesMap = {};
  export let activityTypes: ActivityType[] = [];
  export let argumentsMap: ArgumentsMap = {};
  export let children: string[] | null = null;
  export let duration: number | null;
  export let id: number | undefined;
  export let modelId: number | undefined;
  export let parent: string | null = null;
  export let startTime: string = '';
  export let type: string = '';

  let confirmDeleteActivityModal: ConfirmModal | null = null;

  $: activityType = activityTypes.find(({ name }) => name === type);
  $: formParameters = getFormParameters(activityType.parameters, argumentsMap);
  $: hasChildren = children ? children.length > 0 : false;
  $: isChild = parent !== null;
  $: parentId = isChild ? parent : 'None (Root Activity)';
  $: startTimeField = field<string>(startTime, [required, timestamp]);

  function getArguments(formParameter: FormParameter): ArgumentsMap {
    const { name, value } = formParameter;
    const newArgument = { [name]: value };
    return { ...argumentsMap, ...newArgument };
  }

  async function onChangeFormParameters(event: CustomEvent<FormParameter>) {
    const { detail: formParameter } = event;

    formParameters = updateFormParameter(formParameters, formParameter, {
      loading: true,
    });

    const { name, value } = formParameter;
    const { errors, success } = await reqValidateActivityArguments(
      type,
      modelId,
      { [name]: value },
    );

    if (success) {
      formParameters = updateFormParameter(formParameters, formParameter, {
        error: null,
        loading: false,
      });
      const newArguments = getArguments(formParameter);
      dispatch('updateArguments', { arguments: newArguments, id });
    } else {
      formParameters = updateFormParameter(formParameters, formParameter, {
        error: errors[0],
        loading: false,
      });
    }
  }

  function onDelete() {
    dispatch('delete', id);
  }

  function onUpdateStartTime() {
    if ($startTimeField.valid) {
      dispatch('updateStartTime', { id, startTime: $startTimeField.value });
    }
  }
</script>

<Panel hideFooter>
  <span slot="header">Selected Activity</span>
  <span slot="header-right">
    <button
      class="st-button icon"
      disabled={isChild}
      on:click|stopPropagation={() => confirmDeleteActivityModal.modal.show()}
      use:tooltip={{ content: 'Delete Activity', placement: 'left' }}
    >
      <i class="bi bi-trash" />
    </button>
  </span>

  <span slot="body">
    <Field>
      <Label for="id">Activity ID</Label>
      <Input>
        <input bind:value={id} class="st-input w-100" disabled name="id" />
        <i class="bi bi-lock-fill" slot="right" />
      </Input>
    </Field>

    <Field>
      <Label for="activity-type">Activity Type</Label>
      <Input>
        <input
          bind:value={type}
          class="st-input w-100"
          disabled
          name="activity-type"
        />
        <i class="bi bi-lock-fill" slot="right" />
      </Input>
    </Field>

    <Field>
      <Label for="parent-id">Parent ID</Label>
      <Input>
        <input
          bind:value={parentId}
          class="st-input w-100"
          disabled
          name="parent-id"
        />
        <i class="bi bi-lock-fill" slot="right" />
      </Input>
    </Field>

    {#if duration !== null}
      <Field>
        <Label for="duration">Duration</Label>
        <Input>
          <input
            bind:value={duration}
            class="st-input w-100"
            disabled
            name="duration"
          />
          <i class="bi bi-lock-fill" slot="right" />
        </Input>
      </Field>
    {/if}

    <Field>
      <Label for="start-time" invalid={$startTimeField.invalid}>
        Start Time
      </Label>
      <input
        bind:value={$startTimeField.value}
        autocomplete="off"
        class="st-input w-100"
        class:error={$startTimeField.invalid}
        disabled={isChild}
        name="start-time"
        on:change={onUpdateStartTime}
      />
      <Error
        invalid={$startTimeField.invalid}
        error={$startTimeField.firstError}
      />
    </Field>

    <Field>
      <details open>
        <summary>Parameters</summary>
        <div class="mt-2">
          <Parameters
            disabled={isChild}
            {formParameters}
            on:change={onChangeFormParameters}
          />
        </div>
      </details>
    </Field>

    <Field>
      <details open={hasChildren}>
        <summary>Decomposition</summary>
        <div class="mt-2">
          {#if hasChildren}
            <Decomposition {activitiesMap} {children} {type} />
          {:else}
            <Card class="p-1">This activity has no children</Card>
          {/if}
        </div>
      </details>
    </Field>
  </span>
</Panel>

<ConfirmModal
  bind:this={confirmDeleteActivityModal}
  confirmText="Delete"
  message="Are you sure you want to delete this activity?"
  title="Delete Activity"
  on:confirm={onDelete}
/>

<style>
  details {
    cursor: pointer;
  }
</style>
