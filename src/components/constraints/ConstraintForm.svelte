<svelte:options immutable={true} />

<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import {
    constraintDefinition,
    constraintId,
    constraintRevision,
    constraintsFormColumns,
  } from '../../stores/constraints';
  import type { User, UserId } from '../../types/app';
  import type { ConstraintDefinition, ConstraintMetadata } from '../../types/constraint';
  import type {
    ConstraintDefinitionTagsInsertInput,
    ConstraintMetadataTagsInsertInput,
    Tag,
    TagsChangeEvent,
  } from '../../types/tags';
  import effects from '../../utilities/effects';
  import { isSaveEvent } from '../../utilities/keyboardEvents';
  import { permissionHandler } from '../../utilities/permissionHandler';
  import { featurePermissions } from '../../utilities/permissions';
  import { diffTags } from '../../utilities/tags';
  import PageTitle from '../app/PageTitle.svelte';
  import CssGrid from '../ui/CssGrid.svelte';
  import CssGridGutter from '../ui/CssGridGutter.svelte';
  import Panel from '../ui/Panel.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';
  import TagsInput from '../ui/Tags/TagsInput.svelte';
  import ConstraintEditor from './ConstraintEditor.svelte';

  // export let initialConstraintDefinitionCode: string = 'export default (): Constraint => {\n\n}\n';
  export let initialConstraintDescription: string = '';
  export let initialConstraintId: number | null = null;
  export let initialConstraintName: string = '';
  export let initialConstraintPublic: boolean = true;
  export let initialConstraintDefinitionTags: Tag[] = [];
  export let initialConstraintMetadataTags: Tag[] = [];
  export let initialConstraintOwner: UserId = null;
  export let initialConstraintRevision: number = 0;
  export let initialTags: Tag[] = [];
  export let mode: 'create' | 'edit' = 'create';
  export let user: User | null;

  const permissionError = `You do not have permission to ${mode === 'edit' ? 'edit this' : 'create a'} constraint.`;

  let selectedConstraintRevision: number | null = initialConstraintRevision;

  let constraintDefinitionCode: string = 'export default (): Constraint => {\n\n}\n';
  let constraintDefinitionTags: Tag[] = initialConstraintDefinitionTags;
  let constraintDescription: string = initialConstraintDescription;
  let constraintMetadataId: number | null = initialConstraintId;
  let constraintMetadataTags: Tag[] = initialConstraintMetadataTags;
  let constraintName: string = initialConstraintName;
  let constraintOwner: UserId = initialConstraintOwner ?? user?.id ?? null;
  let constraintPublic: boolean = initialConstraintPublic;
  let hasPermission: boolean = false;
  let isDefinitionModified: boolean = false;
  let isDefinitionTagsModified: boolean = false;
  let isMetadataModified: boolean = false;
  let saveButtonEnabled: boolean = false;
  let saveButtonText: string = 'Save';
  let savedConstraintMetadata: Partial<ConstraintMetadata> = {
    description: constraintDescription,
    name: constraintName,
    tags: constraintMetadataTags.map(tag => ({ tag })),
  };
  let savedConstraintDefinition: Partial<ConstraintDefinition> = {
    definition: constraintDefinitionCode,
    tags: constraintDefinitionTags.map(tag => ({ tag })),
  };

  $: if (initialConstraintId !== null) {
    $constraintId = initialConstraintId;
    constraintMetadataId = initialConstraintId;
  }
  $: if (selectedConstraintRevision !== null) {
    $constraintRevision = selectedConstraintRevision;
  }
  $: if ($constraintDefinition != null) {
    constraintDefinitionCode = $constraintDefinition.definition;
    constraintDefinitionTags = $constraintDefinition.tags.map(({ tag }) => tag);
  }
  $: hasPermission = featurePermissions.constraints.canCreate(user);
  $: isMetadataModified = diffConstraintMetadata(savedConstraintMetadata, {
    description: constraintDescription,
    name: constraintName,
    tags: constraintMetadataTags.map(tag => ({ tag })),
  });
  $: isDefinitionModified = diffConstraintDefinition(savedConstraintDefinition, {
    definition: constraintDefinitionCode,
  });
  $: isDefinitionTagsModified = diffTags(
    (savedConstraintDefinition.tags || []).map(({ tag }) => tag),
    constraintDefinitionTags,
  );

  $: pageTitle = mode === 'edit' ? 'Constraints' : 'New Constraint';
  $: pageSubtitle = mode === 'edit' ? savedConstraintMetadata.name : '';
  $: saveButtonClass = saveButtonEnabled && isMetadataModified && isDefinitionModified ? 'primary' : 'secondary';
  $: saveButtonEnabled = constraintDefinitionCode !== '' && constraintName !== '';
  $: if (isMetadataModified || isDefinitionModified) {
    // saveButtonText = mode === 'edit' && !isMetadataModified && !isDefinitionModified ? 'Saved' : 'Save';
    if ((isMetadataModified || isDefinitionTagsModified) && !isDefinitionModified) {
      saveButtonText = 'Update';
    } else if (isDefinitionModified) {
      saveButtonText = 'Save as new version';
    }
  }

  function diffConstraintMetadata(
    constraintMetadataA: Partial<ConstraintMetadata>,
    constraintMetadataB: Partial<ConstraintMetadata>,
  ) {
    if (
      constraintMetadataA.description !== constraintMetadataB.description ||
      constraintMetadataA.name !== constraintMetadataB.name ||
      diffTags(
        (constraintMetadataA.tags || []).map(({ tag }) => tag),
        (constraintMetadataB.tags || []).map(({ tag }) => tag),
      )
    ) {
      return true;
    }

    return false;
  }

  function diffConstraintDefinition(
    constraintDefinitionA: Partial<ConstraintDefinition>,
    constraintDefinitionB: Partial<ConstraintDefinition>,
  ) {
    return constraintDefinitionA.definition !== constraintDefinitionB.definition;
  }

  function onDidChangeModelContent(event: CustomEvent<{ value: string }>) {
    const { detail } = event;
    const { value } = detail;
    constraintDefinitionCode = value;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (isSaveEvent(event)) {
      event.preventDefault();
      saveConstraint();
    }
  }

  async function onTagsInputChange(event: TagsChangeEvent) {
    const {
      detail: { tag, type },
    } = event;
    if (type === 'remove') {
      constraintMetadataTags = constraintMetadataTags.filter(t => t.name !== tag.name);
    } else if (type === 'create' || type === 'select') {
      let tagsToAdd: Tag[] = [tag];
      if (type === 'create') {
        tagsToAdd = (await effects.createTags([{ color: tag.color, name: tag.name }], user)) || [];
      }
      constraintMetadataTags = constraintMetadataTags.concat(tagsToAdd);
    }
  }

  async function createConstraint() {
    if (saveButtonEnabled) {
      const newConstraintId = await effects.createConstraint(
        constraintName,
        constraintPublic,
        constraintMetadataTags.map(({ id }) => ({ tag_id: id })),
        constraintDefinitionCode,
        constraintDefinitionTags.map(({ id }) => ({ tag_id: id })),
        user,
        constraintDescription,
      );

      if (newConstraintId !== null) {
        goto(`${base}/constraints/edit/${newConstraintId}`);
      }
    }
  }

  async function createNewConstraintDefinition() {
    if (saveButtonEnabled && constraintMetadataId !== null) {
      const definition = await effects.createConstraintDefinition(
        constraintMetadataId,
        constraintDefinitionCode,
        constraintDefinitionTags.map(({ id }) => ({ tag_id: id })),
        user,
      );

      if (definition !== null) {
        console.log('definition :>> ', definition);
      }
    }
  }

  async function createConstraintMetadataTags(constraintId: number, constraintTags: Tag[]) {
    // Associate new tags with constraint definition version
    const newConstraintTags: ConstraintMetadataTagsInsertInput[] = (constraintTags || []).map(({ id: tag_id }) => ({
      constraint_id: constraintId,
      tag_id,
    }));
    await effects.createConstraintMetadataTags(newConstraintTags, user);
  }

  async function saveConstraint() {
    if (constraintId) {
      if (isMetadataModified) {
        await saveConstraintMetadata();
      }
      if (isDefinitionTagsModified && !isDefinitionModified) {
        await saveConstraintDefinitionRevisionTags();
      } else if (isDefinitionModified) {
        await createNewConstraintDefinition();
      }
    } else {
      await createConstraint();
    }
  }

  async function saveConstraintMetadata() {
    if (constraintId !== null) {
      await effects.updateConstraintMetadata(
        $constraintId,
        {
          description: constraintDescription,
          name: constraintName,
          owner: constraintOwner,
        },
        user,
      );

      const newTags = constraintMetadataTags.filter(tag => !initialConstraintMetadataTags.find(t => tag.id === t.id));

      await createConstraintMetadataTags($constraintId, newTags);

      // Disassociate old tags from constraint
      const unusedTags = initialConstraintMetadataTags
        .filter(tag => !constraintMetadataTags.find(t => tag.id === t.id))
        .map(tag => tag.id);

      await effects.deleteConstraintMetadataTags(unusedTags, user);

      savedConstraintMetadata = {
        description: constraintDescription,
        name: constraintName,
        tags: constraintMetadataTags.map(tag => ({ tag })),
      };
    }
  }

  async function saveConstraintDefinitionRevisionTags() {
    if ($constraintId !== null && selectedConstraintRevision !== null) {
      // Associate new tags with constraint definition version
      const newConstraintTags: ConstraintDefinitionTagsInsertInput[] = (constraintDefinitionTags || []).map(
        ({ id: tag_id }) => ({
          constraint_id: $constraintId as number,
          revision: selectedConstraintRevision as number,
          tag_id,
        }),
      );
      await effects.createConstraintDefinitionTags(newConstraintTags, user);

      // Disassociate old tags from constraint
      const unusedTags = initialConstraintDefinitionTags
        .filter(tag => !constraintDefinitionTags.find(t => tag.id === t.id))
        .map(tag => tag.id);
      await effects.deleteConstraintDefinitionTags(unusedTags, user);
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<PageTitle subTitle={pageSubtitle} title={pageTitle} />

<CssGrid bind:columns={$constraintsFormColumns}>
  <Panel overflowYBody="hidden" padBody={false}>
    <svelte:fragment slot="header">
      <SectionTitle>{mode === 'create' ? 'New Constraint' : 'Edit Constraint'}</SectionTitle>

      <div class="right">
        <button class="st-button secondary ellipsis" on:click={() => goto(`${base}/constraints`)}>
          {mode === 'create' ? 'Cancel' : 'Close'}
        </button>
        <button
          class="st-button {saveButtonClass} ellipsis"
          disabled={!saveButtonEnabled}
          use:permissionHandler={{
            hasPermission,
            permissionError,
          }}
          on:click={saveConstraint}
        >
          {saveButtonText}
        </button>
      </div>
    </svelte:fragment>

    <svelte:fragment slot="body">
      {#if mode === 'edit'}
        <fieldset>
          <label for="constraintId">Constraint ID</label>
          <input class="st-input w-100" disabled name="constraintId" value={$constraintId} />
        </fieldset>
      {/if}

      <fieldset>
        <label for="model">Model</label>
        <select
          bind:value={constraintModelId}
          class="st-select w-100"
          disabled={constraintPlanId !== null}
          name="model"
          use:permissionHandler={{
            hasPermission,
            permissionError,
          }}
        >
          <option value={null} />
          {#each models as model}
            <option value={model.id} disabled={!hasModelPermission(model.id, mode, user)}>
              {model.name}
              (Version: {model.version})
            </option>
          {/each}
        </select>
      </fieldset>

      <fieldset>
        <label for="plan">Plan</label>
        <select
          bind:value={constraintPlanId}
          class="st-select w-100"
          name="plan"
          use:permissionHandler={{
            hasPermission,
            permissionError,
          }}
        >
          <option value={null} />
          {#each plans as plan}
            <option value={plan.id} disabled={!hasPlanPermission(plan, mode, user)}>
              {plan.name} ({plan.id})
            </option>
          {/each}
        </select>
      </fieldset>

      <fieldset>
        <label for="constraint-name">Name</label>
        <input
          bind:value={constraintName}
          autocomplete="off"
          class="st-input w-100"
          name="constraint-name"
          placeholder="Enter Constraint Name (required)"
          required
          use:permissionHandler={{
            hasPermission,
            permissionError,
          }}
        />
      </fieldset>

      <fieldset>
        <label for="constraint-description">Description</label>
        <textarea
          bind:value={constraintDescription}
          autocomplete="off"
          class="st-input w-100"
          name="constraint-description"
          placeholder="Enter Constraint Description (optional)"
          use:permissionHandler={{
            hasPermission,
            permissionError,
          }}
        />
      </fieldset>

      <fieldset>
        <label for="tags">Tags</label>
        <TagsInput
          use={[
            [
              permissionHandler,
              {
                hasPermission,
                permissionError,
              },
            ],
          ]}
          options={initialTags}
          selected={constraintMetadataTags}
          on:change={onTagsInputChange}
        />
      </fieldset>
    </svelte:fragment>
  </Panel>

  <CssGridGutter track={1} type="column" />

  <ConstraintEditor
    constraintDefinition={constraintDefinitionCode}
    readOnly={!hasPermission}
    title="{mode === 'create' ? 'New' : 'Edit'} Constraint - Definition Editor"
    {user}
    on:didChangeModelContent={onDidChangeModelContent}
  />
</CssGrid>
