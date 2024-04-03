<svelte:options immutable={true} />

<script lang="ts">
  import PageTitle from '../../components/app/PageTitle.svelte';
  import NewSequences from '../../components/sequencing/Sequences.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<PageTitle title="Sequencing" />

<NewSequences user={data.user} />
