<svelte:options immutable={true} />

<script lang="ts">
  import { setContext } from 'svelte';
  import { modalBodyClickListener, modalBodyKeyListener } from '../utilities/modal';

  // Define global svelte-radix icon settings
  const iconCtx = { size: 15 };
  setContext('iconCtx', iconCtx);
</script>

<svelte:body on:click={modalBodyClickListener} on:keydown={modalBodyKeyListener} />

<slot />

<div id="svelte-modal" />
