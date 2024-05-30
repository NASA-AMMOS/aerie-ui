<svelte:options immutable={true} />

<script lang="ts">
  import PageTitle from '../../components/app/PageTitle.svelte';
  import ExternalSourceManager from '../../components/external-source/ExternalSourceManager.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<PageTitle title="External Sources" />

<ExternalSourceManager user={data.user}></ExternalSourceManager>

<style>
</style>
