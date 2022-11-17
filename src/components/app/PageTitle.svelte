<script lang="ts">
  export let route: string = '';
  export let subRoute: string = '';

  $: pageTitle = ((route: string = '', subRoute: string = '') => {
    if (subRoute && route) {
      return `${subRoute} - ${route}`;
    }

    if (subRoute || route) {
      return `${subRoute || route}`;
    }

    return '';
  })(route, subRoute);
</script>

<svelte:head>
  <title>{pageTitle} &#10022; Aerie</title>
</svelte:head>
