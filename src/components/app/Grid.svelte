<svelte:options immutable={false} />

<script lang="ts">
  import Split from 'split-grid';
  import type { SplitInstance } from 'split-grid';
  import { tick } from 'svelte';
  import GridComponent from './GridComponent.svelte';
  import { viewActions } from '../../stores/views';

  export let grid: Grid;

  let split: SplitInstance;
  let splitGridDiv: HTMLDivElement;

  $: if (splitGridDiv && grid) setSplit();

  function onDragEnd(): void {
    if (splitGridDiv) {
      if (grid.type === 'columns') {
        const newSizes: string = splitGridDiv.style['grid-template-columns'];
        viewActions.updateLayout(grid.id, 'columnSizes', newSizes);
      } else if (grid.type === 'rows') {
        const newSizes: string = splitGridDiv.style['grid-template-rows'];
        viewActions.updateLayout(grid.id, 'rowSizes', newSizes);
      }
    }
  }

  async function setSplit() {
    await tick();

    if (split) split.destroy();
    split = Split({ onDragEnd });

    if (splitGridDiv) {
      const columnGutters = splitGridDiv.querySelectorAll<HTMLDivElement>(':scope > .gutter.column');
      const rowGutters = splitGridDiv.querySelectorAll<HTMLDivElement>(':scope > .gutter.row');

      for (const columnGutter of Array.from(columnGutters)) {
        const track = columnGutter.getAttribute('data-track');
        const trackAsNumber = parseFloat(track);
        split.addColumnGutter(columnGutter, trackAsNumber);
      }

      for (const rowGutter of Array.from(rowGutters)) {
        const track = rowGutter.getAttribute('data-track');
        const trackAsNumber = parseFloat(track);
        split.addRowGutter(rowGutter, trackAsNumber);
      }
    }
  }
</script>

{#if grid?.type === 'columns'}
  <div bind:this={splitGridDiv} class="split-grid" style="grid-template-columns: {grid.columnSizes};">
    {#each grid.columns as column}
      {#if column.type === 'gutter'}
        <div class="gutter column" data-track={column.track} />
      {:else}
        <svelte:self grid={column} />
      {/if}
    {/each}
  </div>
{:else if grid?.type === 'rows'}
  <div bind:this={splitGridDiv} class="split-grid" style="grid-template-rows: {grid.rowSizes};">
    {#each grid.rows as row}
      {#if row.type === 'gutter'}
        <div class="gutter row" data-track={row.track} />
      {:else}
        <svelte:self grid={row} />
      {/if}
    {/each}
  </div>
{:else if grid?.type === 'component'}
  <div class="component" data-component-name={grid.componentName}>
    <GridComponent {grid} />
  </div>
{/if}

<style>
  .component {
    display: grid;
    height: 100%;
    overflow-y: scroll;
    width: 100%;
  }

  .gutter {
    background-color: #eee;
    background-position: 50%;
    background-repeat: no-repeat;
  }

  .gutter.column {
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
    cursor: col-resize;
  }

  .gutter.row {
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=');
    cursor: row-resize;
  }

  .split-grid {
    display: grid;
    overflow: scroll;
  }
</style>
