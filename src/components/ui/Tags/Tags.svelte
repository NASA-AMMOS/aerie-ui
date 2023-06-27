<svelte:options immutable={true} />

<script lang="ts">
  import type { ModifierPhases } from '@popperjs/core';
  import { createEventDispatcher } from 'svelte';
  import { createPopperActions } from 'svelte-popperjs';
  import type { Tag } from '../../../types/tags';
  import TagChip from './Tag.svelte';

  export let createTagObject: (name: string) => Tag;
  export let id: string = '';
  export let name: string = '';
  export let placeholder: string = 'Enter a tag...';
  export let inputRef: HTMLInputElement | null = null;
  export let tagsRef: HTMLDivElement | null = null;
  export let tagsWidth: number = 100;
  export let disabled: boolean = false;
  export let selected: Tag[] = [];
  export let suggestionsLimit: number = 8;
  export let options: Tag[] = [];

  const dispatch = createEventDispatcher();
  const [popperRef, popperContent, getInstance] = createPopperActions({
    placement: 'bottom-start',
    strategy: 'fixed',
  });
  const extraOpts = {
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } },
      {
        enabled: true,
        fn: ({ state }) => {
          state.styles.popper.width = `${state.rects.reference.width}px`;
        },
        name: 'sameWidth',
        phase: 'beforeWrite' as ModifierPhases,
        requires: ['computeStyles'],
      },
    ],
  };

  let activeIndex: number = -1;
  let activeTag: Tag | null = null;
  let exactMatchFound: boolean = false;
  let filteredOptions: Tag[] = [];
  let searchText: string | null = '';
  let suggestionsVisible = false;
  let tags: Tag[] = [];

  $: tags = [...selected];
  $: if (options && searchText !== null && options) {
    exactMatchFound = options.findIndex(tag => compareTagNames(tag.name, searchText)) > -1;
    filteredOptions = [];
    options.forEach(option => {
      // Filter out already selected options
      if (findTag(option.name, tags)) {
        // exactMatchFound = true;
        activeTag = option;
        return;
      }

      // Filter to match searchText, case insensitive
      let substringMatch = false;
      if (searchText) {
        substringMatch = option.name.toLocaleLowerCase().indexOf(searchText.toLocaleLowerCase()) > -1;
      } else {
        substringMatch = true;
      }
      if (substringMatch) {
        filteredOptions.push(option);
      }
    });

    // If searchText matches one of the filtered options, bring this option to the top
    const optionMatchIndex = filteredOptions.findIndex(tag => compareTagNames(tag.name, searchText));
    if (optionMatchIndex > -1) {
      filteredOptions.unshift(filteredOptions.splice(optionMatchIndex, 1)[0]);
    }

    // Limit filtered options
    filteredOptions = filteredOptions.slice(0, suggestionsLimit);
  }

  $: if (typeof activeIndex === 'number' && filteredOptions) {
    activeTag = activeIndex > -1 ? filteredOptions.at(activeIndex) : null;
  }

  function openSuggestions() {
    if (disabled) {
      return;
    }
    suggestionsVisible = true;
  }

  function closeSuggestions() {
    suggestionsVisible = false;
    activeIndex = -1;
    searchText = '';
  }

  function compareTagNames(name1: Tag['name'], name2: Tag['name']) {
    return name1.toLocaleLowerCase() === name2.toLocaleLowerCase();
  }

  function findTag(name: string, tags: Tag[]) {
    return tags.find(t => compareTagNames(t.name, name));
  }

  function add(tag: Tag) {
    tags = tags.concat(tag);
    searchText = '';
    dispatch('add', tag);
    updatePopperPosition();
    closeSuggestions();
  }

  function onKeydown(event: KeyboardEvent) {
    const { key } = event;

    // on escape or tab out of input close options dropdown and reset input value
    if (event.key === `Escape` || event.key === `Tab`) {
      closeSuggestions();
    } else if (key === 'Enter' && (searchText || activeTag)) {
      // prevent add if searchText matches tag name that is already selected
      if (searchText && !activeTag && findTag(searchText, tags)) {
        return;
      }

      // Use active tag or create a placeholder tag if needed
      add(activeTag || findTag(searchText, filteredOptions) || createTagObject(searchText));
    } else if (key === 'Backspace' && searchText === '' && tags.length) {
      const lastTag = tags.at(-1);
      tags = tags.slice(0, -1);
      removeTag(lastTag);
      return;
    } else if ([`ArrowDown`, `ArrowUp`].includes(event.key)) {
      // if no option is active yet, but there are matching options, make first one active
      if (activeIndex === -1 && filteredOptions.length > 0) {
        activeIndex = 0;
        openSuggestions();
        return;
      }
      event.preventDefault();
      // if none of the above special cases apply, we make next/prev option
      // active with wrap around at both ends
      const increment = event.key === `ArrowUp` ? -1 : 1;

      activeIndex = (activeIndex + increment) % filteredOptions.length;
      if (activeIndex < 0) {
        activeIndex = filteredOptions.length - 1;
      }
    } else {
      openSuggestions();
    }
  }

  function onTagRemove(tag: Tag) {
    // Find the tag by name since it may not have an ID yet
    tags = tags.filter(t => t.name !== tag.name);
    removeTag(tag);
  }

  function removeTag(tag: Tag) {
    dispatch('remove', tag);
    updatePopperPosition();
  }

  function updatePopperPosition() {
    getInstance()?.update();
  }

  function onClickOutside(event: MouseEvent | TouchEvent) {
    if (tagsRef && !tagsRef.contains(event.target as Node)) {
      closeSuggestions();
    }
  }
</script>

<svelte:window on:click={onClickOutside} on:touchstart={onClickOutside} />

<div class="tags" use:popperRef bind:this={tagsRef} bind:clientWidth={tagsWidth}>
  <div class="tags-selected-items">
    {#each tags as tag}
      <TagChip {tag} on:click={() => onTagRemove(tag)} />
    {/each}
    <input
      {id}
      {name}
      {placeholder}
      class="st-input tags-input"
      on:mouseup={openSuggestions}
      on:focus={openSuggestions}
      on:keydown={onKeydown}
      bind:value={searchText}
      bind:this={inputRef}
    />
    {#if suggestionsVisible}
      <div class="tags-portal" use:popperContent={extraOpts}>
        <div class="tags-options">
          {#if filteredOptions.length}
            <div class="tags-option tag-header st-typography-label">Suggestions</div>
            {#each filteredOptions as tag}
              <div
                class="tags-option"
                on:mousedown|stopPropagation
                on:mouseup|stopPropagation={() => add(tag)}
                class:active={activeTag?.id === tag.id}
              >
                <TagChip {tag} removable={false} />
              </div>
            {/each}
            {#if !exactMatchFound && searchText}
              <div
                on:mousedown|stopPropagation
                on:mouseup|stopPropagation={() => add(createTagObject(searchText))}
                class="tags-option"
              >
                Add "{searchText}" (enter)
              </div>
            {/if}
          {:else if !exactMatchFound && searchText}
            <div
              on:mousedown|stopPropagation
              on:mouseup|stopPropagation={() => add(createTagObject(searchText))}
              class="tags-option"
            >
              Add "{searchText}" (enter)
            </div>
          {:else if exactMatchFound && searchText}
            <div class="tags-option tags-option-message">{searchText} already added</div>
          {:else}
            <div class="tags-option tags-option-message">No other tags found</div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .tags {
    background-color: var(--st-input-background-color);
    border: var(--st-input-border);
    border-radius: 4px;
    color: var(--st-input-color);
    display: flex;
    gap: 8px;
    max-height: 40vh;
    padding: 2px;
  }

  .tags-selected-items {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 2px;
    margin: 0;
    padding: 0;
  }

  .tags-input {
    background: none;
    border: none;
    flex: 1;
    height: 20px;
    min-width: 80px;
    outline: none;
  }

  .tags-portal {
    background: #ffffff;
    border: 1px solid var(--st-gray-20);
    border-radius: 10px;
    box-shadow: 0px 8px 16px 0px var(--st-gray-20);
    min-width: 150px;
    overflow: hidden;
    user-select: none;
    z-index: 99999;
  }

  .tags-option {
    border-bottom: 1px solid var(--st-gray-20);
    cursor: pointer;
    display: flex;
    padding: 8px;
  }

  .tags-option.active,
  .tags-option:hover {
    background: var(--st-gray-10);
  }

  .tag-header {
    background: var(--st-gray-10);
    cursor: default;
  }

  .tags-option-message {
    cursor: default;
  }

  .tags-option-message:hover {
    background: inherit;
  }
</style>
