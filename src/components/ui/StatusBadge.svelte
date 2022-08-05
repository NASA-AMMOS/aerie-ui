<script lang="ts">
  import { getColorForStatus, Status, statusColors } from '../../utilities/status';

  export let status: Status = Status.Clean;

  let color: string = statusColors.blue;

  $: color = getColorForStatus(status);
</script>

<span class="status" style="color: {color}">
  {status}
</span>

<style>
  .status {
    align-items: center;
    color: var(--st-gray-90);
    display: inline-flex;
    justify-content: center;
  }
</style>
