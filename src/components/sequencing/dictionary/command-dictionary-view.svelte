<svelte:options immutable={true} />

<script lang="ts">
  import type { CommandDictionary, FswCommand, HwCommand } from '@nasa-jpl/aerie-ampcs';
  import CommandView from './command-view.svelte';

  export let commandDictionary: CommandDictionary;

  let command: FswCommand | HwCommand | null;
  let commands: (FswCommand | HwCommand)[] = [];
  let filteredCommands: (FswCommand | HwCommand)[] = [];
  let stemFilter: string = '';

  $: {
    commands = [...commandDictionary.fswCommands, ...commandDictionary.hwCommands].sort((a, b) =>
      a.stem.localeCompare(b.stem),
    );
  }

  $: {
    if (stemFilter) {
      try {
        const stemRegExp: RegExp | null = new RegExp(stemFilter, 'ig');
        filteredCommands = commands.filter(cmd => stemRegExp.test(cmd.stem));
      } catch {
        // user entered invalid regexp
        const upperCaseFilter = stemFilter.toUpperCase();
        filteredCommands = commands.filter(cmd => cmd.stem.includes(upperCaseFilter));
      }
    } else {
      filteredCommands = commands;
    }
  }
</script>

<div>Command Filter <input bind:value={stemFilter} /></div>
<div class="detail-view" role="listbox">
  {#each filteredCommands as cmd}
    <a on:click={() => (command = cmd)} href="#parcel">
      <div class={command === cmd ? 'selected' : undefined}>
        {cmd.stem}
      </div>
    </a>
  {/each}
</div>
<hr />
{#if command}
  <CommandView {command} />
{/if}

<style>
  .detail-view {
    height: 100px;
    overflow: scroll;
  }

  .selected {
    background: var(--st-gray-20);
    border: solid 1px var(--st-gray-70);
  }

  a:visited {
    color: var(--st-primary-text-color);
  }
</style>
