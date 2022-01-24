<script lang="ts" context="module">
  import type { LoadInput, LoadOutput } from '@sveltejs/kit';

  export async function load({
    fetch,
    session,
  }: LoadInput): Promise<LoadOutput> {
    if (!session.user) {
      return {
        redirect: '/login',
        status: 302,
      };
    }

    const { models = [], plans = [] } = await reqGetPlansAndModels(fetch);

    return {
      props: {
        models,
        plans,
      },
    };
  }
</script>

<script lang="ts">
  import { goto, prefetch } from '$app/navigation';
  import { page } from '$app/stores';
  import ConfirmModal from '../../components/modals/Confirm.svelte';
  import Field from '../../components/form/Field.svelte';
  import AlertError from '../../components/ui/AlertError.svelte';
  import Card from '../../components/ui/Card.svelte';
  import Grid from '../../components/ui/Grid.svelte';
  import TopBar from '../../components/ui/TopBar.svelte';
  import { tooltip } from '../../utilities/tooltip';
  import { onMount } from 'svelte';
  import { compare, removeQueryParam } from '../../utilities/generic';
  import { min, required, timestamp } from '../../utilities/validators';
  import {
    CreatePlan,
    CreatePlanModel,
    reqCreatePlan,
    reqCreateSimulation,
    reqDeletePlanAndSimulations,
    reqGetPlansAndModels,
  } from '../../utilities/requests';
  import { simulationTemplates } from '../../stores/simulation';
  import { field } from '../../stores/form';
  import Error from '../../components/form/Error.svelte';

  export let models: CreatePlanModel[] = [];
  export let plans: CreatePlan[] = [];

  let confirmDeletePlan: ConfirmModal | null = null;
  let createButtonText = 'Create';
  let error: string | null = null;
  let simulationTemplateId: number | null = null;

  let endTimeField = field<string>('', [required, timestamp]);
  let modelIdField = field<number>(-1, [required, min(1)]);
  let nameField = field<string>('', [required]);
  let startTimeField = field<string>('', [required, timestamp]);

  $: createButtonEnabled =
    $endTimeField.dirtyAndValid &&
    $modelIdField.dirtyAndValid &&
    $nameField.dirtyAndValid &&
    $startTimeField.dirtyAndValid;
  $: simulationTemplates.setVariables({ modelId: $modelIdField.value });
  $: sortedModels = models.sort((a, b) => compare(a.name, b.name));
  $: sortedPlans = plans.sort((a, b) => compare(a.name, b.name));

  onMount(() => {
    const queryModelId = $page.url.searchParams.get('modelId');
    if (queryModelId) {
      $modelIdField.value = parseFloat(queryModelId);
      removeQueryParam('modelId');
    }
  });

  async function createPlan() {
    createButtonText = 'Creating...';
    error = null;

    const newPlan = await reqCreatePlan(
      $endTimeField.value,
      $modelIdField.value,
      $nameField.value,
      $startTimeField.value,
    );
    await reqCreateSimulation(newPlan.id, simulationTemplateId);

    if (newPlan) {
      plans = [...plans, newPlan];
    } else {
      error = 'Create plan failed.';
    }

    createButtonText = 'Create';
  }

  async function deletePlan(event: CustomEvent<CreatePlan>) {
    const { detail: plan } = event;
    const { id } = plan;
    const success = await reqDeletePlanAndSimulations(id);

    if (success) {
      plans = plans.filter(plan => plan.id !== id);
    }
  }
</script>

<Grid rows="32px auto">
  <TopBar>Plans</TopBar>
  <Grid gap="0.2rem" columns="20% auto" padding="0.2rem">
    <Card>
      <form on:submit|preventDefault={createPlan}>
        <Field visible={error !== null}>
          <AlertError message={error} />
        </Field>

        <Field>
          <label for="model">Models</label>
          <select
            class="st-select w-100"
            name="model"
            value={$modelIdField.value}
            on:change={({ currentTarget }) => {
              const { value } = currentTarget;
              if (value !== '') {
                $modelIdField.value = parseFloat(value);
              } else {
                $modelIdField.value = -1;
              }
            }}
          >
            <option value="" />
            {#each sortedModels as model}
              <option value={model.id}>
                {model.name}
              </option>
            {/each}
          </select>
        </Field>

        <Field>
          <label class:error={$nameField.invalid} for="name"> Name </label>
          <input
            bind:value={$nameField.value}
            autocomplete="off"
            class="st-input w-100"
            class:error={$nameField.invalid}
            name="name"
          />
          <Error field={$nameField} />
        </Field>

        <Field>
          <label class:error={$startTimeField.invalid} for="start-time">
            Start Time
          </label>
          <input
            bind:value={$startTimeField.value}
            autocomplete="off"
            class="st-input w-100"
            class:error={$startTimeField.invalid}
            name="start-time"
            placeholder="YYYY-DDDThh:mm:ss"
          />
          <Error field={$startTimeField} />
        </Field>

        <Field>
          <label class:error={$endTimeField.invalid} for="end-time">
            End Time
          </label>
          <input
            bind:value={$endTimeField.value}
            autocomplete="off"
            class="st-input w-100"
            class:error={$endTimeField.invalid}
            name="end-time"
            placeholder="YYYY-DDDThh:mm:ss"
          />
          <Error field={$endTimeField} />
        </Field>

        <Field>
          <label for="simulation-templates">Simulation Templates</label>
          {#if $simulationTemplates.length}
            <select
              class="st-select w-100"
              name="simulation-templates"
              value={simulationTemplateId}
              on:change={({ currentTarget }) => {
                const { value } = currentTarget;
                if (value !== '') {
                  simulationTemplateId = parseFloat(value);
                } else {
                  simulationTemplateId = null;
                }
              }}
            >
              <option value="" />
              {#each $simulationTemplates as template}
                <option value={template.id}>
                  {template.description}
                </option>
              {/each}
            </select>
          {:else}
            <input class="st-input w-100" disabled value="Empty" />
          {/if}
        </Field>

        <Field>
          <button
            class="st-button create-button"
            disabled={!createButtonEnabled}
            type="submit"
          >
            {createButtonText}
          </button>
        </Field>
      </form>
    </Card>
    <div>
      {#if plans.length}
        <Card>
          <table class="table">
            <thead>
              <tr>
                <th>Actions</th>
                <th>Name</th>
                <th>Plan ID</th>
                <th>Model ID</th>
                <th>Start Time</th>
                <th>End Time</th>
              </tr>
            </thead>
            <tbody>
              {#each sortedPlans as plan}
                <tr>
                  <td class="actions">
                    <button
                      class="st-button icon fs-6"
                      on:click={() => goto(`plans/${plan.id}`)}
                      on:pointerenter={() => prefetch(`plans/${plan.id}`)}
                      use:tooltip={{
                        content: 'Open Plan',
                        placement: 'bottom',
                      }}
                    >
                      <i class="bi bi-box-arrow-in-up-right" />
                    </button>
                    <button
                      class="st-button icon fs-6"
                      on:click|stopPropagation={() =>
                        confirmDeletePlan.modal.show(plan)}
                      use:tooltip={{
                        content: 'Delete Plan',
                        placement: 'bottom',
                      }}
                    >
                      <i class="bi bi-trash" />
                    </button>
                  </td>
                  <td>{plan.name}</td>
                  <td>{plan.id}</td>
                  <td>{plan.modelId}</td>
                  <td>{plan.startTime}</td>
                  <td>{plan.endTime}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </Card>
      {:else}
        <Card class="p-1">No Plans Found</Card>
      {/if}
    </div>
  </Grid>
</Grid>

<ConfirmModal
  bind:this={confirmDeletePlan}
  confirmText="Delete"
  message="Are you sure you want to delete this plan?"
  title="Delete Plan"
  on:confirm={deletePlan}
/>

<style>
  .actions {
    align-items: center;
    display: grid;
    gap: 12px;
    grid-template-columns: 16px 16px;
    justify-content: center;
  }

  .create-button {
    width: 100px;
  }
</style>
