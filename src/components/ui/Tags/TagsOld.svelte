<svelte:options immutable={true} />

<script lang="ts">
  import MultiSelect from 'svelte-multiselect';
  import type { Tag } from '../../../types/tags';
  import TagSelected from './TagSelected.svelte';

  export let allowUserOptions: boolean = true;
  export let id: string = '';
  export let name: string = '';
  export let placeholder: string = 'Enter a tag...';
  export let disabled: boolean = false;
  export let selected: Tag[] = [];
  export let options: Tag[] = [];

  $: selectedObjects = selected.map(value => ({ ...value, label: value.name, value: value.id }));
  $: optionObjects = options.map(value => ({ ...value, label: value.name, value: value.id }));
  $: console.log('selectedObjects :>> ', selectedObjects);
  $: console.log('optionObjects :>> ', optionObjects);
</script>

<MultiSelect
  {allowUserOptions}
  createOptionMsg="Create this tag (enter)"
  {disabled}
  duplicateOptionMsg="This tag already exists"
  {id}
  {name}
  noMatchingOptionsMsg="No matching tags"
  options={optionObjects}
  {placeholder}
  selected={selectedObjects}
  selectedOptionsDraggable={false}
  on:add
  on:remove
  on:removeAll
  on:change
  liSelectedClass="tags-tag"
  let:option
>
  <TagSelected {option} slot="selected" />
  <div class="multiselect--remove-icon" slot="remove-icon">×</div>
</MultiSelect>

<style>
  :global(.multiselect) {
    background-color: var(--st-input-background-color) !important;
    border: var(--st-input-border) !important;
    border-radius: 4px !important;
    color: var(--st-input-color) !important;
    padding: 2px !important;
    padding-right: 20px !important;
  }
  :global(.multiselect > svg) {
    display: none;
  }

  :global(.tags-tag) {
    border-radius: 16px !important;
    margin: 2px !important;
    padding: 0 !important;
    position: relative;
  }

  :global(.multiselect .options) {
    background: #ffffff !important;
    border: 1px solid var(--st-gray-20) !important;
    border-radius: 10px !important;
    box-shadow: 0px 8px 16px 0px var(--st-gray-20) !important;
    margin-top: 8px !important;
  }

  :global(.multiselect button) {
    height: 100%;
    margin: 0 3px 0 0 !important;
  }

  :global(.multiselect .remove:focus),
  :global(.multiselect .remove:hover) {
    background: rgba(0, 0, 0, 0.05) !important;
    border-radius: 0px !important;
    border-bottom-right-radius: 16px !important;
    border-top-right-radius: 16px !important;
    color: inherit !important;
  }

  :global(.multiselect .remove:hover .multiselect--remove-icon) {
    /* background: rgba(0, 0, 0, 0.05) !important; */
    color: black;
  }

  :global(.multiselect .remove) {
    align-items: center;
    border-bottom-right-radius: 16px !important;
    border-top-right-radius: 16px !important;
    display: flex;
    justify-content: center;
    margin: 0px !important;
    padding-right: 3px !important;
    position: absolute;
    right: 0px !important;
    transition: none !important;
    width: 17px !important;
  }

  :global(.multiselect .remove.remove-all) {
    border-bottom-right-radius: 3px !important;
    border-top-right-radius: 3px !important;
  }

  .multiselect--remove-icon {
    color: rgba(0, 0, 0, 0.3);
    font-weight: 600;
    margin-top: -2px;
    user-select: none;
  }
</style>
