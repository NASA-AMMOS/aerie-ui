<svelte:options immutable={true} />

<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../components/app/Nav.svelte';
  import { plugins } from '../stores/plugins';
  import { modalBodyClickListener, modalBodyKeyListener } from '../utilities/modal';
  import { loadPluginCode } from '../utilities/plugins';
  import type { LayoutData } from './$types';

  export let data: LayoutData;
  let pluginsLoaded = data.timePluginPath ? false : true;

  onMount(() => {
    loadPlugins();
  });

  async function loadPlugins() {
    if (data.timePluginPath) {
      $plugins = await loadPluginCode(data.timePluginPath);
    }
    pluginsLoaded = true;
  }
</script>

<svelte:body on:click={modalBodyClickListener} on:keydown={modalBodyKeyListener} />

{#if pluginsLoaded}
  <slot />
{:else}
  <div style="display: flex; flex-direction: column; height: 100%">
    <Nav />
    <div
      class="st-typography-header"
      style="align-items: center;display: flex; flex: 1; justify-content: center; width: 100%"
    >
      Loading plugins...
    </div>
  </div>
{/if}

<div id="svelte-modal" />
