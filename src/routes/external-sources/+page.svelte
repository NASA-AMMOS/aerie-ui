<svelte:options immutable={true} />

<script lang="ts">
  import { onDestroy } from 'svelte';
  import PageTitle from '../../components/app/PageTitle.svelte';
  import ExternalSourceManager from '../../components/external-source/ExternalSourceManager.svelte';
  import { createDerivationGroupError, createExternalSourceError, createExternalSourceEventTypeLinkError, createExternalSourceTypeError, derivationGroupPlanLinkError } from '../../stores/external-source';
  import type { PageData } from './$types';

  export let data: PageData;

  onDestroy(() => {
    // Clear the error stores when the page is destroyed
    createExternalSourceError.set(null);
    createExternalSourceTypeError.set(null);
    createDerivationGroupError.set(null);
    derivationGroupPlanLinkError.set(null);
    createExternalSourceEventTypeLinkError.set(null);
  });
</script>

<PageTitle title="External Sources" />

<ExternalSourceManager user={data.user}></ExternalSourceManager>
