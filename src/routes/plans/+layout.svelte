<svelte:options immutable={true} />

<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import Nav from '../../components/app/Nav.svelte';
  import { plugins, pluginsLoaded } from '../../stores/plugins';
  import { loadPluginCode } from '../../utilities/plugins';
  import { showFailureToast } from '../../utilities/toast';

  let pluginsEnabled = env.PUBLIC_TIME_PLUGIN_ENABLED === 'true';
  $pluginsLoaded = pluginsEnabled ? false : true;

  onMount(() => {
    if (pluginsEnabled) {
      loadPlugins();
    }
  });

  async function loadPlugins() {
    try {
      $plugins = await loadPluginCode('/resources/time-plugin.js');
      $pluginsLoaded = true;
    } catch (err) {
      console.log('Unable to load plugin:', err);
      showFailureToast('Unable to load plugin');
      // TODO should we allow users to continue if the plugin cannot be loaded?
    }
  }
</script>

{#if !pluginsEnabled || $pluginsLoaded}
  <slot />
{:else}
  <div style="display: flex; flex-direction: column; height: 100%">
    <Nav user={null} />
    <div
      class="st-typography-header"
      style="align-items: center;display: flex; flex: 1; justify-content: center; width: 100%"
    >
      Loading plugins...
    </div>
  </div>
{/if}
