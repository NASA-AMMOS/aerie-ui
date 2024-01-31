<svelte:options immutable={true} />

<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import HideIcon from '@nasa-jpl/stellar/icons/visible_hide.svg?component';
  import ShowIcon from '@nasa-jpl/stellar/icons/visible_show.svg?component';
  import { SearchParameters } from '../../enums/searchParameters';
  import {
    constraintDefinition,
    constraintId,
    constraintRevision,
    constraintsFormColumns,
  } from '../../stores/constraints';
  import type { User, UserId } from '../../types/app';
  import type { ConstraintDefinition, ConstraintMetadata } from '../../types/constraint';
  import type { ConstraintMetadataTagsInsertInput, Tag, TagsChangeEvent } from '../../types/tags';
  import effects from '../../utilities/effects';
  import { setQueryParam } from '../../utilities/generic';
  import { permissionHandler } from '../../utilities/permissionHandler';
  import { featurePermissions } from '../../utilities/permissions';
  import { diffTags } from '../../utilities/tags';
  import { showSuccessToast } from '../../utilities/toast';
  import PageTitle from '../app/PageTitle.svelte';
  import CssGrid from '../ui/CssGrid.svelte';
  import CssGridGutter from '../ui/CssGridGutter.svelte';
  import Panel from '../ui/Panel.svelte';
  import RadioButton from '../ui/RadioButtons/RadioButton.svelte';
  import RadioButtons from '../ui/RadioButtons/RadioButtons.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';
  import TagsInput from '../ui/Tags/TagsInput.svelte';
  import ConstraintEditor from './ConstraintEditor.svelte';

  type SavedConstraintMetadata = Pick<ConstraintMetadata, 'description' | 'name' | 'owner' | 'public' | 'tags'>;
  type SavedConstraintDefinition = Pick<ConstraintDefinition, 'definition' | 'tags'>;

  // export let initialConstraintDefinitionCode: string = 'export default (): Constraint => {\n\n}\n';
  export let initialConstraintDescription: string = '';
  export let initialConstraintId: number | null = null;
  export let initialConstraintName: string = '';
  export let initialConstraintPublic: boolean = true;
  export let initialConstraintDefinitionTags: Tag[] = [];
  export let initialConstraintMetadataTags: Tag[] = [];
  export let initialConstraintOwner: UserId = null;
  export let initialConstraintRevision: number = 0;
  export let initialConstraintRevisions: number[] = [];
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
  let constraintRevisions: number[] = initialConstraintRevisions;
  let hasPermission: boolean = false;
  let isDefinitionModified: boolean = false;
  let isDefinitionDataModified: boolean = false;
  let isMetadataModified: boolean = false;
  let saveButtonEnabled: boolean = false;
  let saveButtonText: string = 'Save';
  let savedConstraintMetadata: SavedConstraintMetadata = {
    description: constraintDescription,
    name: constraintName,
    owner: constraintOwner,
    public: constraintPublic,
    tags: constraintMetadataTags.map(tag => ({ tag })),
  };
  let savedConstraintDefinition: SavedConstraintDefinition = {
    definition: constraintDefinitionCode,
    tags: constraintDefinitionTags.map(tag => ({ tag })),
  };

  $: if (initialConstraintId !== null) {
    $constraintId = initialConstraintId;
    constraintMetadataId = initialConstraintId;
  }
  $: if (selectedConstraintRevision !== null) {
    $constraintRevision = selectedConstraintRevision;
    if (browser) {
      setQueryParam(SearchParameters.REVISION, `${selectedConstraintRevision}`);
    }
  }
  $: if ($constraintDefinition != null) {
    constraintDefinitionCode = $constraintDefinition.definition;
    constraintDefinitionTags = $constraintDefinition.tags.map(({ tag }) => tag);
    savedConstraintDefinition = $constraintDefinition;
  }
  $: hasPermission = featurePermissions.constraints.canCreate(user);
  $: isMetadataModified = diffConstraintMetadata(savedConstraintMetadata, {
    description: constraintDescription,
    name: constraintName,
    owner: constraintOwner,
    public: constraintPublic,
    tags: constraintMetadataTags.map(tag => ({ tag })),
  });
  $: isDefinitionModified = diffConstraintDefinition(savedConstraintDefinition, {
    definition: constraintDefinitionCode,
  });
  $: isDefinitionDataModified = diffTags(
    (savedConstraintDefinition.tags || []).map(({ tag }) => tag),
    constraintDefinitionTags,
  );

  $: pageTitle = mode === 'edit' ? 'Constraints' : 'New Constraint';
  $: pageSubtitle = mode === 'edit' ? savedConstraintMetadata.name : '';
  $: saveButtonEnabled =
    constraintDefinitionCode !== '' &&
    constraintName !== '' &&
    (isMetadataModified || isDefinitionDataModified || isDefinitionModified);
  $: saveButtonClass = saveButtonEnabled ? 'primary' : 'secondary';
  $: if (isMetadataModified || isDefinitionModified) {
    // saveButtonText = mode === 'edit' && !isMetadataModified && !isDefinitionModified ? 'Saved' : 'Save';
    if ((isMetadataModified || isDefinitionDataModified) && !isDefinitionModified) {
      saveButtonText = 'Update';
    } else if (isDefinitionModified) {
      saveButtonText = 'Save as new version';
    }
  }

  function diffConstraintMetadata(
    constraintMetadataA: SavedConstraintMetadata,
    constraintMetadataB: SavedConstraintMetadata,
  ) {
    if (
      constraintMetadataA.description !== constraintMetadataB.description ||
      constraintMetadataA.name !== constraintMetadataB.name ||
      constraintMetadataA.public !== constraintMetadataB.public ||
      constraintMetadataA.owner !== constraintMetadataB.owner ||
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
    constraintDefinitionA: Pick<SavedConstraintDefinition, 'definition'>,
    constraintDefinitionB: Pick<SavedConstraintDefinition, 'definition'>,
  ) {
    return constraintDefinitionA.definition !== constraintDefinitionB.definition;
  }

  function onDidChangeModelContent(event: CustomEvent<{ value: string }>) {
    const { detail } = event;
    const { value } = detail;
    constraintDefinitionCode = value;
  }

  async function onDefinitionTagsInputChange(event: TagsChangeEvent) {
    const {
      detail: { tag, type },
    } = event;
    if (type === 'remove') {
      constraintDefinitionTags = constraintDefinitionTags.filter(t => t.name !== tag.name);
    } else if (type === 'create' || type === 'select') {
      let tagsToAdd: Tag[] = [tag];
      if (type === 'create') {
        tagsToAdd = (await effects.createTags([{ color: tag.color, name: tag.name }], user)) || [];
      }
      constraintDefinitionTags = constraintDefinitionTags.concat(tagsToAdd);
    }
  }

  async function onMetadataTagsInputChange(event: TagsChangeEvent) {
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

  function onSetPublic(event: CustomEvent<{ id: 'public' | 'private' }>) {
    const {
      detail: { id },
    } = event;

    constraintPublic = id === 'public';
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
        selectedConstraintRevision = definition.revision;
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
        showSuccessToast('Constraint Updated Successfully');
      }
      if (isDefinitionDataModified && !isDefinitionModified) {
        await saveConstraintDefinitionRevisionTags();
        showSuccessToast('Constraint Updated Successfully');
      } else if (isDefinitionModified) {
        await createNewConstraintDefinition();
        showSuccessToast('New Constraint Revision Created Successfully');
      }
    } else {
      await createConstraint();
      showSuccessToast('New Constraint Created Successfully');
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
          public: constraintPublic,
        },
        user,
      );

      const newMetadataTags = constraintMetadataTags.filter(
        tag => !savedConstraintMetadata.tags.find(({ tag: t }) => tag.id === t.id),
      );

      await createConstraintMetadataTags($constraintId, newMetadataTags);

      // Disassociate old tags from constraint
      const unusedTags = savedConstraintMetadata.tags
        .filter(({ tag }) => !constraintMetadataTags.find(t => tag.id === t.id))
        .map(({ tag }) => tag.id);

      await effects.deleteConstraintMetadataTags(unusedTags, user);

      savedConstraintMetadata = {
        description: constraintDescription,
        name: constraintName,
        owner: constraintOwner,
        public: constraintPublic,
        tags: constraintMetadataTags.map(tag => ({ tag })),
      };
    }
  }

  async function saveConstraintDefinitionRevisionTags() {
    if ($constraintId !== null && selectedConstraintRevision !== null) {
      // Associate new tags with constraint definition version
      const newDefinitionTags = constraintDefinitionTags
        .filter(tag => !savedConstraintDefinition.tags.find(({ tag: t }) => tag.id === t.id))
        .map(({ id: tag_id }) => ({
          constraint_id: $constraintId as number,
          constraint_revision: selectedConstraintRevision as number,
          tag_id,
        }));
      await effects.createConstraintDefinitionTags(newDefinitionTags, user);

      // Disassociate old tags from constraint
      const unusedTags = initialConstraintDefinitionTags
        .filter(tag => !constraintDefinitionTags.find(t => tag.id === t.id))
        .map(tag => tag.id);
      await effects.deleteConstraintDefinitionTags(unusedTags, user);
    }
  }
</script>

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
        <label for="metadataTags">Tags</label>
        <TagsInput
          name="metadataTags"
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
          on:change={onMetadataTagsInputChange}
        />
      </fieldset>

      {#if mode === 'edit'}
        <fieldset>
          <label for="constraintId">Constraint ID</label>
          <input class="st-input w-100" disabled name="constraintId" value={$constraintId} />
        </fieldset>
      {/if}
      <fieldset>
        <label for="constraintOwner">Owner</label>
        <input bind:value={constraintOwner} class="st-input w-100" name="constraintOwner" />
      </fieldset>

      <fieldset>
        <label for="public">Visibility</label>
        <RadioButtons selectedButtonId={constraintPublic ? 'public' : 'private'} on:select-radio-button={onSetPublic}>
          <RadioButton id="private"><div class="public-button"><HideIcon /><span>Private</span></div></RadioButton>
          <RadioButton id="public"><div class="public-button"><ShowIcon /><span>Public</span></div></RadioButton>
        </RadioButtons>
      </fieldset>

      <div class="definition-divider" />

      {#if mode === 'edit'}
        <fieldset>
          <label for="versions">Version</label>
          {#if !isDefinitionModified}
            <select bind:value={selectedConstraintRevision} class="st-select w-100" name="versions">
              {#each constraintRevisions as revision}
                <option value={revision}>
                  {revision}
                </option>
              {/each}
            </select>
          {:else}
            <select disabled class="st-select w-100" name="versions">
              <option value={constraintRevisions[constraintRevisions.length - 1] + 1}>
                {constraintRevisions[constraintRevisions.length - 1] + 1} (Next version)
              </option>
            </select>
          {/if}
        </fieldset>
      {/if}

      <fieldset>
        <label for="definitionTags">Version Tags</label>
        <TagsInput
          name="definitionTags"
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
          selected={constraintDefinitionTags}
          on:change={onDefinitionTagsInputChange}
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

<style>
  .public-button {
    column-gap: 0.3rem;
    display: grid;
    grid-template-columns: min-content min-content;
  }

  .definition-divider {
    border-top: 1px solid var(--st-gray-20);
    display: grid;
    margin: 2rem 1rem;
  }
</style>
