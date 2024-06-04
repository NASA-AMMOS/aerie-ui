<svelte:options immutable={true} />

<script lang="ts">
  import { merge } from 'lodash-es';
  import { onMount } from 'svelte';
  import Nav from '../components/app/Nav.svelte';
  import { adaptations } from '../stores/adaptations';
  import { loadAdaptationCode } from '../utilities/adaptations';
  import { modalBodyClickListener, modalBodyKeyListener } from '../utilities/modal';

  let adaptationsLoaded = false;

  onMount(() => {
    loadAdaptations();
  });

  async function loadAdaptations() {
    const adaptationPaths = ['../time-adaptation.js', '../sequence-adaptation.js'];
    let loadedAdaptations = {};
    (await Promise.all(adaptationPaths.map(loadAdaptationCode))).map(result => {
      loadedAdaptations = merge(result, loadedAdaptations);
    });
    $adaptations = loadedAdaptations;
    adaptationsLoaded = true;
    console.log('adaptations :>> ', $adaptations);
  }
</script>

<svelte:body on:click={modalBodyClickListener} on:keydown={modalBodyKeyListener} />

{#if adaptationsLoaded}
  <slot />
{:else}
  <div style="display: flex; flex-direction: column; height: 100%">
    <Nav />
    <div
      class="st-typography-header"
      style="align-items: center;display: flex; flex: 1; justify-content: center; width: 100%"
    >
      Loading adaptations...
    </div>
  </div>
{/if}

<div id="svelte-modal" />
