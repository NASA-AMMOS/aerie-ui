<svelte:options immutable={true} />

<script lang="ts">
  import { env } from '$env/dynamic/public';
  import WarningIcon from '@nasa-jpl/stellar/icons/warning.svg?component';
  import { mergeWith } from 'lodash-es';
  import { onMount } from 'svelte';
  import Nav from '../../components/app/Nav.svelte';
  import { plugins, pluginsError, pluginsLoaded } from '../../stores/plugins';
  import { loadPluginCode } from '../../utilities/plugins';

  let pluginsEnabled = env.PUBLIC_TIME_PLUGIN_ENABLED === 'true';
  $pluginsLoaded = pluginsEnabled ? false : true;

  onMount(() => {
    if (pluginsEnabled && !$pluginsLoaded) {
      loadPlugins();
    }
  });

  async function loadPlugins() {
    try {
      // Load plugins and merge with default plugin
      const userPlugins = await loadPluginCode('/resources/time-plugin.js');
      $plugins = mergeWith($plugins, userPlugins, (_, src) => (Array.isArray(src) ? src : undefined));
      $pluginsLoaded = true;
    } catch (err) {
      console.log('Unable to load plugin:', err);
      $pluginsLoaded = false;
      $pluginsError = `Unable to load plugin: ${err}`;
    }
  }
</script>

{#if !pluginsEnabled || ($pluginsLoaded && !$pluginsError)}
  <slot />
{:else}
  <div class="plans-layout">
    <Nav user={null} />
    <div class="message st-typography-header">
      {#if $pluginsError}
        <div class="error">
          <WarningIcon />
          {$pluginsError}
        </div>
      {:else}
        Loading plugins...
      {/if}
    </div>
  </div>
{/if}

<style>
  .plans-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .message {
    align-items: center;
    display: flex;
    flex: 1;
    justify-content: center;
    width: 100%;
  }

  .error {
    align-items: center;
    color: var(--st-error-red);
    display: flex;
    gap: 8px;
    max-width: 70vw;
    text-wrap: balance;
  }

  .error :global(svg) {
    flex-shrink: 0;
  }
</style>
