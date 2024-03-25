<svelte:options accessors={true} immutable={true} />

<script lang="ts">
  import BookIcon from '@nasa-jpl/stellar/icons/book.svg?component';
  import ChecklistOnPageIcon from '@nasa-jpl/stellar/icons/checklist_on_page.svg?component';
  import VerticalCollapseIcon from '@nasa-jpl/stellar/icons/vertical_collapse_with_center_line.svg?component';
  import { Calendar, ChevronDown, ClipboardCopy, Code, Desktop, PaperPlane, RowSpacing, RulerSquare, Table } from 'svelte-radix';
  import { viewUpdateGrid } from '../../stores/views';
  import type { ViewGrid, ViewGridComponent, ViewGridSection } from '../../types/view';
  import Menu from './Menu.svelte';
  import MenuItem from './MenuItem.svelte';

  export let gridSection: ViewGridSection;
  export let title: string = '';

  let gridMenu: Menu;

  function onClickMenuItem(gridComponent: ViewGridComponent): void {
    const update: Partial<ViewGrid> = {};

    if (gridSection === 'LeftTop') {
      update.leftComponentTop = gridComponent;
    } else if (gridSection === 'LeftBottom') {
      update.leftComponentBottom = gridComponent;
    } else if (gridSection === 'MiddleBottom') {
      update.middleComponentBottom = gridComponent;
    } else if (gridSection === 'RightTop') {
      update.rightComponentTop = gridComponent;
    } else if (gridSection === 'RightBottom') {
      update.rightComponentBottom = gridComponent;
    }

    viewUpdateGrid(update);
  }
</script>

<div class="grid-menu st-typography-medium" role="none" on:click|stopPropagation={() => gridMenu.toggle()}>
  <div class="title">{title}</div>
  <ChevronDown />

  <Menu bind:this={gridMenu}>
    <MenuItem on:click={() => onClickMenuItem('ActivityDirectivesTablePanel')}>
      <Table />
      Activity Directives Table
    </MenuItem>
    <MenuItem on:click={() => onClickMenuItem('ActivitySpansTablePanel')}>
      <Table />
      Simulated Activities Table
    </MenuItem>
    <MenuItem on:click={() => onClickMenuItem('ActivityTypesPanel')}>
      <BookIcon />
      Activity Types
    </MenuItem>
    <MenuItem on:click={() => onClickMenuItem('ConstraintsPanel')}>
      <VerticalCollapseIcon />
      Constraints
    </MenuItem>
    <MenuItem on:click={() => onClickMenuItem('ExpansionPanel')}>
      <RowSpacing />
      Expansion
    </MenuItem>
    <MenuItem on:click={() => onClickMenuItem('IFramePanel')}>
      <Desktop />
      External Application
    </MenuItem>
    <MenuItem on:click={() => onClickMenuItem('PlanMetadataPanel')}>
      <ClipboardCopy />
      Plan Metadata
    </MenuItem>
    <MenuItem on:click={() => onClickMenuItem('SchedulingGoalsPanel')}>
      <Calendar />
      Scheduling Goals
    </MenuItem>
    <MenuItem on:click={() => onClickMenuItem('SchedulingConditionsPanel')}>
      <Code />
      Scheduling Conditions
    </MenuItem>
    <MenuItem on:click={() => onClickMenuItem('ActivityFormPanel')}>
      <RulerSquare />
      Selected Activity
    </MenuItem>
    <MenuItem on:click={() => onClickMenuItem('SimulationPanel')}>
      <PaperPlane />
      Simulation
    </MenuItem>
    <MenuItem on:click={() => onClickMenuItem('TimelineEditorPanel')}>
      <ChecklistOnPageIcon />
      Timeline Editor
    </MenuItem>
  </Menu>
</div>

<style>
  .grid-menu {
    align-items: center;
    border: 1px solid var(--st-gray-30);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    font-size: 13px;
    gap: 5px;
    height: 24px;
    justify-content: center;
    padding: 4px 8px;
    position: relative;
    user-select: none;
  }

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
