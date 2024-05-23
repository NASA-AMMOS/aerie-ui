<svelte:options immutable={true} />

<script lang="ts">
  import ParcelForm from '../../../../components/parcels/ParcelForm.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<ParcelForm mode="edit" user={data.user} />
