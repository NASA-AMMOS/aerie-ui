<svelte:options immutable={true} />

<script lang="ts">
  import { tooltip } from '../../utilities/tooltip';
  import type { Field } from '../../types/form';

  export let field: Field<any>;
</script>

{#if field.invalid}
  <div
    class="error"
    use:tooltip={{
      content: field.firstError,
      maxWidth: 'none',
      placement: 'bottom',
      theme: 'error',
    }}
  >
    <span>{field.firstError}</span>
  </div>
{/if}

<style>
  .error {
    cursor: default;
    display: table;
    table-layout: fixed;
    width: 100%;
  }

  .error > span {
    color: var(--st-red);
    display: table-cell;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
