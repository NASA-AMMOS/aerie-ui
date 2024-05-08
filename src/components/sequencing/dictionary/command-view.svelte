<svelte:options immutable={true} />

<script lang="ts">
  import type { FswCommand, FswCommandArgument, HwCommand } from '@nasa-jpl/aerie-ampcs';
  import {
    isFswCommandArgumentEnum,
    isFswCommandArgumentFloat,
    isFswCommandArgumentInteger,
    isFswCommandArgumentNumeric,
    isFswCommandArgumentRepeat,
    isFswCommandArgumentUnsigned,
    isFswCommandArgumentVarString,
  } from '../form/utils';

  export let command: FswCommand | HwCommand;

  function getArgDetails(arg: FswCommandArgument) {
    let details: string = arg.arg_type;
    if (
      isFswCommandArgumentFloat(arg) ||
      isFswCommandArgumentInteger(arg) ||
      isFswCommandArgumentNumeric(arg) ||
      isFswCommandArgumentUnsigned(arg)
    ) {
      if (arg.bit_length !== null) {
        details += `(${arg.bit_length.toString(10)})`;
      }
      details += ' ';
      if (arg.units) {
        details += `(${arg.units}) `;
      }
      if (arg.range) {
        details += `[${arg.range.min}, ${arg.range.max}] `;
      }
      details += `- ${arg.description}`;

      return details;
    } else if (isFswCommandArgumentVarString(arg)) {
      details += `- ${arg.description}`;
      return details;
    } else if (isFswCommandArgumentEnum(arg)) {
      details = ` ${arg.enum_name}`;
      if (arg.bit_length !== null) {
        details += `(${arg.bit_length.toString(10)})`;
      }
      details += `- ${arg.description}`;
      return details;
    } else if (isFswCommandArgumentRepeat(arg)) {
      if (arg.repeat) {
        details += ` [${arg.repeat.min}, ${arg.repeat.max}]`;
      }

      details += `- ${arg.description}`;

      return details;
    }
    return '';
  }

  // TODO: Restricted Modes
</script>

<div class="command-info">
  <div>{command.type.split('_')[0].toUpperCase()} Command</div>
  <div>{command.stem}</div>
  <div>Description</div>
  <div>{command.description}</div>
  {#if command.type === 'fsw_command' && command.arguments.length}
    <div>Arguments</div>
    <div>
      <ul>
        {#each command.arguments as arg}
          {#if isFswCommandArgumentRepeat(arg)}
            <li>
              <span class="arg-name">{arg.name}</span> - {getArgDetails(arg)}
              <ul>
                {#each arg.repeat?.arguments ?? [] as repeatArg}
                  <li><span class="arg-name">{repeatArg.name}</span> - {getArgDetails(repeatArg)}</li>
                {/each}
              </ul>
            </li>
          {:else}
            <li><span class="arg-name">{arg.name}</span> - {getArgDetails(arg)}</li>
          {/if}
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .command-info {
    display: grid;
    grid-template-columns: 130px 1fr;
    overflow: scroll;
    width: 100%;
  }

  .command-info > div:nth-child(odd)::after {
    content: ':';
  }

  span.arg-name {
    font-weight: bold;
  }

  ul {
    padding-left: 20px;
  }
</style>
