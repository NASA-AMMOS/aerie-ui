<svelte:options immutable={true} />

<script lang="ts">
  import type { ChannelDictionary, CommandDictionary, ParameterDictionary } from '@nasa-jpl/aerie-ampcs';
  import {
    channelDictionaries,
    commandDictionaries,
    getParsedChannelDictionary,
    getParsedCommandDictionary,
    getParsedParameterDictionary,
    parameterDictionaries as parameterDictionariesStore,
    parcel,
    parcelToParameterDictionaries,
  } from '../../stores/sequencing';
  import type { User } from '../../types/app';
  import ChannelDictionaryView from './dictionary/channel-dictionary-view.svelte';
  import CommandDictionaryView from './dictionary/command-dictionary-view.svelte';
  import ParameterDictionaryView from './dictionary/parameter-dictionary-view.svelte';

  export let user: User | null;

  let channelDictionary: ChannelDictionary | null;
  let commandDictionary: CommandDictionary | null;
  let parameterDictionary: ParameterDictionary | null;
  let parameterDictionaries: ParameterDictionary[] = [];
  let selectedDictionary: ChannelDictionary | CommandDictionary | ParameterDictionary | null = null;
  let selectedDictionaryType: 'command' | 'channel' | 'parameter' | undefined = undefined;

  $: {
    if (!selectedDictionary) {
      selectedDictionaryType = undefined;
    } else if ('telemetries' in selectedDictionary) {
      selectedDictionaryType = 'channel';
    } else if ('fswCommands' in selectedDictionary) {
      selectedDictionaryType = 'command';
    } else if ('params' in selectedDictionary) {
      selectedDictionaryType = 'parameter';
    }
  }

  $: {
    const unparsedChannelDictionary = $channelDictionaries.find(cd => cd.id === $parcel?.channel_dictionary_id);
    const unparsedCommandDictionary = $commandDictionaries.find(cd => cd.id === $parcel?.command_dictionary_id);
    const unparsedParameterDictionaries = $parameterDictionariesStore.filter(pd => {
      const parameterDictionary = $parcelToParameterDictionaries.find(p => p.parameter_dictionary_id === pd.id);

      if (parameterDictionary) {
        return pd;
      }
    });

    if (unparsedCommandDictionary) {
      Promise.all([
        getParsedCommandDictionary(unparsedCommandDictionary, user),
        unparsedChannelDictionary ? getParsedChannelDictionary(unparsedChannelDictionary, user) : null,
        ...unparsedParameterDictionaries.map(unparsedParameterDictionary => {
          return getParsedParameterDictionary(unparsedParameterDictionary, user);
        }),
      ]).then(([parsedCommandDictionary, parsedChannelDictionary, ...parsedParameterDictionaries]) => {
        const nonNullParsedParameterDictionaries = parsedParameterDictionaries.filter(
          (pd): pd is ParameterDictionary => !!pd,
        );

        channelDictionary = parsedChannelDictionary;
        commandDictionary = parsedCommandDictionary;
        parameterDictionaries = nonNullParsedParameterDictionaries;
      });
    }
  }

  function isCommandDictionary(dictionary: any): dictionary is CommandDictionary {
    return 'fswCommands' in dictionary;
  }

  function isChannelDictionary(dictionary: any): dictionary is ChannelDictionary {
    return 'telemetries' in dictionary;
  }

  function isParameterDictionary(dictionary: any): dictionary is ParameterDictionary {
    return 'params' in dictionary;
  }
</script>

<div class="parcel-view">
  {#if $parcel}
    <nav class="breadcrumbs">
      <ol>
        {#if selectedDictionary}
          <li>
            <a
              href="#parcel"
              on:click={() => {
                selectedDictionary = null;
              }}>{$parcel.name}</a
            >
          </li>
        {:else}
          <li>{$parcel.name}</li>
        {/if}

        {#if selectedDictionary}
          <li>
            {selectedDictionary.id}
            {#if selectedDictionaryType}
              ({selectedDictionaryType})
            {/if}
          </li>
        {/if}
      </ol>
    </nav>
  {/if}

  {#if $parcel && !selectedDictionary}
    {#if commandDictionary}
      <div>
        Command Dictionary: <a
          href="#parcel"
          on:click={() => {
            selectedDictionary = commandDictionary;
          }}>{commandDictionary.id}</a
        >
      </div>
    {/if}
    {#if channelDictionary}
      <div>
        Channel Dictionary: <a
          href="#parcel"
          on:click={() => {
            selectedDictionary = channelDictionary;
          }}>{channelDictionary.id}</a
        >
      </div>
    {/if}
    {#if parameterDictionaries.length}
      <div>
        Parameter Dictionaries:
        {#each parameterDictionaries as pd}
          <a
            href="#parcel"
            on:click={() => {
              parameterDictionary = pd;
              selectedDictionary = parameterDictionary;
            }}>{pd.id}</a
          >
        {/each}
      </div>
    {/if}
  {:else if selectedDictionary}
    {#if isCommandDictionary(selectedDictionary)}
      <CommandDictionaryView commandDictionary={selectedDictionary} />
    {:else if isChannelDictionary(selectedDictionary)}
      <ChannelDictionaryView channelDictionary={selectedDictionary} />
    {:else if isParameterDictionary(selectedDictionary)}
      <ParameterDictionaryView parameterDictionary={selectedDictionary} />
    {/if}
  {/if}
</div>

<style>
  .parcel-view {
    padding: 10px;
    width: 100%;
  }

  nav {
    border-bottom: 1px solid black;
  }

  .breadcrumbs ol {
    list-style-type: none;
    padding-left: 0;
  }

  nav > ol > li {
    display: inline-block;
  }

  nav > ol > li > a::after {
    color: #000;
    content: '>';
    display: inline-block;
    font-size: 80%;
    font-weight: bold;
    padding: 0 3px;
  }
</style>
