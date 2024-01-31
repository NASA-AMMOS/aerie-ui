<svelte:options immutable={true} />

<script lang="ts">
  import { page } from '$app/stores';
  import ConstraintForm from '../../../../components/constraints/ConstraintForm.svelte';
  import { SearchParameters } from '../../../../enums/searchParameters';
  import { tags } from '../../../../stores/tags';
  import type { ConstraintDefinition } from '../../../../types/constraint';
  import { getSearchParameterNumber } from '../../../../utilities/generic';
  import type { PageData } from './$types';

  export let data: PageData;

  const revision: number =
    getSearchParameterNumber(SearchParameters.REVISION, $page.url.searchParams) ??
    data.initialConstraint.versions[data.initialConstraint.versions.length - 1].revision;

  const constraintDefinition: Pick<ConstraintDefinition, 'revision' | 'tags'> = data.initialConstraint.versions.find(
    ({ revision: constraintRevision }) => revision === constraintRevision,
  ) as Pick<ConstraintDefinition, 'revision' | 'tags'>;
</script>

<ConstraintForm
  initialConstraintDescription={data.initialConstraint.description}
  initialConstraintId={data.initialConstraint.id}
  initialConstraintName={data.initialConstraint.name}
  initialConstraintPublic={data.initialConstraint.public}
  initialConstraintDefinitionTags={constraintDefinition.tags.map(({ tag }) => tag)}
  initialConstraintMetadataTags={data.initialConstraint.tags.map(({ tag }) => tag)}
  initialConstraintOwner={data.initialConstraint.owner}
  initialConstraintRevision={revision}
  initialConstraintRevisions={data.initialConstraint.versions.map(({ revision }) => revision)}
  initialTags={$tags}
  mode="edit"
  user={data.user}
/>
