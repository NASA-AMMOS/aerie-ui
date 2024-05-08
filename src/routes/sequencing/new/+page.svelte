<svelte:options immutable={true} />

<script lang="ts">
  import SequenceForm from '../../../components/sequencing/SequenceForm.svelte';
  import { parcels } from '../../../stores/sequencing';
  import type { PageData } from './$types';

  export let data: PageData;

  // default to latest parcel id
  const initialSequenceParcelId = $parcels.length ? $parcels.at(-1)!.id : undefined;
</script>

<SequenceForm mode="create" user={data.user} {initialSequenceParcelId} />
