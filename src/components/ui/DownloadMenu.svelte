<svelte:options immutable={true} />

<script lang="ts">
  import { Button, cn, DropdownMenu } from '@nasa-jpl/stellar-svelte';
  import { ChevronDown, Download } from 'lucide-svelte';
  import type { DownloadMenuOption } from '../../types/dropdown';
  import Tooltip from './Tooltip.svelte';

  /** Where the dropdown opens relative to the trigger. */
  export let align: 'start' | 'end' = 'end';
  export let className: string = '';
  export let disabled: boolean = false;
  /** Used for the trigger's title/aria-label, e.g. "Download revision b" or "Download foo.txt (Working copy)". */
  export let label: string;
  /** Called with the chosen option's `name` (the filename to save it as) when an item is clicked. */
  export let onDownload: (name: string) => void;
  /** One entry per naming convention offered, e.g. plain filename and/or the revision-versioned filename. */
  export let options: DownloadMenuOption[];
  export let size: 'icon' | undefined = undefined;
  export let variant: 'ghost' | 'default' | 'link' | 'destructive' | 'outline' | 'secondary' | undefined = 'outline';

  $: singleOption = options.length === 1 ? options[0] : null;

  function selectOption(option: DownloadMenuOption) {
    if (!option.disabled) {
      onDownload(option.name);
    }
  }
</script>

{#if singleOption}
  <Tooltip
    content={singleOption.disabledReason ?? ''}
    disabled={!singleOption.disabled || !singleOption.disabledReason}
  >
    <Button
      {variant}
      {size}
      disabled={disabled || (singleOption.disabled && !singleOption.disabledReason)}
      class={cn(
        'flex shrink-0 items-center gap-0.5',
        singleOption.disabled && singleOption.disabledReason ? 'cursor-not-allowed opacity-50' : '',
        className,
      )}
      title={label}
      aria-label={label}
      on:click={() => selectOption(singleOption)}
    >
      <Download size={14} class="shrink-0" />
    </Button>
  </Tooltip>
{:else}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
      <Button
        builders={[builder]}
        {variant}
        {size}
        {disabled}
        class={cn('flex w-auto shrink-0 items-center gap-0.5', className)}
        title={label}
        aria-label={label}
      >
        <Download size={14} class="shrink-0" />
        <ChevronDown size={10} class="shrink-0" />
      </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content {align} class="z-[10000]">
      {#each options as option (option.label)}
        <Tooltip
          content={option.disabledReason ?? ''}
          disabled={!option.disabled || !option.disabledReason}
          wrapperClass="w-full"
        >
          <DropdownMenu.Item
            size="sm"
            class={option.disabled ? 'cursor-not-allowed text-muted-foreground opacity-50' : ''}
            on:click={() => selectOption(option)}
          >
            {option.label}
          </DropdownMenu.Item>
        </Tooltip>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
