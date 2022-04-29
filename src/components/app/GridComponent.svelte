<script lang="ts">
  export let grid: GridComponent;

  let component: unknown;

  $: if (grid) loadComponent();

  async function loadComponent() {
    if (grid) {
      if (grid.componentName === 'ActivityForm') {
        component = (await import('./../activity/ActivityForm.svelte')).default;
      } else if (grid.componentName === 'ActivityTable') {
        component = (await import('./../activity/ActivityTable.svelte')).default;
      } else if (grid.componentName === 'ActivityTypes') {
        component = (await import('./../activity/ActivityTypes.svelte')).default;
      } else if (grid.componentName === 'ConstraintEditor') {
        component = (await import('./../constraint/ConstraintEditor.svelte')).default;
      } else if (grid.componentName === 'ConstraintViolations') {
        component = (await import('./../constraint/ConstraintViolations.svelte')).default;
      } else if (grid.componentName === 'Constraints') {
        component = (await import('./../constraint/Constraints.svelte')).default;
      } else if (grid.componentName === 'IFrame') {
        component = (await import('./../ui/IFrame.svelte')).default;
      } else if (grid.componentName === 'Scheduling') {
        component = (await import('./../scheduling/Scheduling.svelte')).default;
      } else if (grid.componentName === 'SchedulingEditor') {
        component = (await import('./../scheduling/SchedulingEditor.svelte')).default;
      } else if (grid.componentName === 'Simulation') {
        component = (await import('./../simulation/Simulation.svelte')).default;
      } else if (grid.componentName === 'Timeline') {
        component = (await import('./../timeline/Timeline.svelte')).default;
      } else if (grid.componentName === 'TimelineForm') {
        component = (await import('./../timeline/form/TimelineForm.svelte')).default;
      } else if (grid.componentName === 'ViewEditor') {
        component = (await import('./../view/ViewEditor.svelte')).default;
      } else if (grid.componentName === 'Views') {
        component = (await import('./../view/Views.svelte')).default;
      }
    }
  }
</script>

{#if component}
  <svelte:component this={component} {...grid} gridId={grid.id} />
{/if}
