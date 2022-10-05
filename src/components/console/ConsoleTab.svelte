<svelte:options immutable={true} />

<script lang="ts">
  import Tab from '../ui/Tabs/Tab.svelte';

  export let title: string = '';
  export let icon: string = '';
</script>

<Tab>
  <span>{icon}{title}</span>
</Tab>
