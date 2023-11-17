<svelte:options immutable={true} />

<script lang="ts">
  import WarningIcon from '@nasa-jpl/stellar/icons/warning.svg?component';
  import WarningExtraIcon from '@nasa-jpl/stellar/icons/warning_extra.svg?component';
  import WarningMissingIcon from '@nasa-jpl/stellar/icons/warning_missing.svg?component';
  import WarningUnknownIcon from '@nasa-jpl/stellar/icons/warning_unknown.svg?component';
  import type { ICellRendererParams, IRowNode } from 'ag-grid-community';
  import OutsideBoundsIcon from '../../../assets/out-of-bounds.svg?component';
  import type { DataGridColumnDef } from '../../../types/data-grid';
  import type { ActivityValidationErrors } from '../../../types/errors';
  import { isInstantiationError, isUnknownTypeError, isValidationNoticesError } from '../../../utilities/errors';
  import { pluralize } from '../../../utilities/text';
  import DataGrid from '../../ui/DataGrid/DataGrid.svelte';
  import TabPanel from '../../ui/Tabs/TabPanel.svelte';
  import ActivityIssueCell from './ActivityIssuesCell.svelte';

  interface ActivityErrorCounts {
    all: number;
    extra: number;
    invalidAnchor: number;
    invalidParameter: number;
    missing: number;
    outOfBounds: number;
    wrongType: number;
  }

  interface ActivityError {
    errorCounts: ActivityErrorCounts;
    id: number;
    location: string[];
    type: string;
  }
  type ActivityIssueCellRendererParams = ICellRendererParams<ActivityError>;

  type ErrorCategories =
    | 'all'
    | 'extra'
    | 'invalidAnchor'
    | 'invalidParameter'
    | 'missing'
    | 'outOfBounds'
    | 'wrongType';

  export let activityValidationErrors: ActivityValidationErrors[] = [];
  export let title: string;

  function doesExternalFilterPass({ data }: IRowNode<ActivityError>) {
    if (data) {
      switch (selectedCategory) {
        case 'extra':
          return data.errorCounts.extra > 0;
        case 'invalidParameter':
          return data.errorCounts.invalidParameter > 0;
        case 'missing':
          return data.errorCounts.missing > 0;
        case 'wrongType':
          return data.errorCounts.wrongType > 0;
        case 'invalidAnchor':
          return data.errorCounts.invalidAnchor > 0;
        case 'outOfBounds':
          return data.errorCounts.outOfBounds > 0;
      }
    }
    return false;
  }

  function isExternalFilterPresent() {
    return selectedCategory !== 'all';
  }

  function onSelectCategory(event: MouseEvent) {
    const { target } = event;
    if (target) {
      const { value } = target as HTMLButtonElement;

      selectedCategory = value as ErrorCategories;
    }

    dataGrid.onFilterChanged();
  }

  const columnDefs: DataGridColumnDef<ActivityError>[] = [
    {
      field: 'type',
      filter: 'string',
      headerName: 'Activity',
      resizable: true,
      sortable: true,
      width: 60,
    },
    {
      field: 'id',
      filter: 'number',
      headerName: 'ID',
      resizable: true,
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 60,
    },
    {
      field: 'fields',
      filter: 'number',
      headerName: '# fields',
      resizable: true,
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      valueFormatter: ({ data }) => {
        return `${data?.location.length ? data.location.length : ''}`;
      },
      width: 95,
    },
    {
      field: 'location',
      filter: 'string',
      headerName: 'Location',
      resizable: true,
      sortable: true,
      valueFormatter: ({ data }) => {
        return data?.location.join(', ') ?? '';
      },
      width: 80,
    },
    {
      autoHeight: true,
      cellRenderer: (params: ActivityIssueCellRendererParams) => {
        const issuesDiv = document.createElement('div');
        issuesDiv.className = 'issues-cell';
        new ActivityIssueCell({
          props: {
            counts: params.value,
          },
          target: issuesDiv,
        });

        return issuesDiv;
      },
      field: 'errorCounts',
      headerName: 'Issue',
      resizable: true,
      sortable: true,
      width: 80,
    },
  ];

  let counts: ActivityErrorCounts = {
    all: 0,
    extra: 0,
    invalidAnchor: 0,
    invalidParameter: 0,
    missing: 0,
    outOfBounds: 0,
    wrongType: 0,
  };
  let dataGrid: DataGrid<ActivityError>;
  let selectedCategory: ErrorCategories = 'all';
  let tableErrors: ActivityError[] = [];

  $: {
    let all = 0;
    let extra = 0;
    let invalidAnchor = 0;
    let invalidParameter = 0;
    let missing = 0;
    let outOfBounds = 0;
    let wrongType = 0;

    let tableErrorsMap: Record<string, ActivityError> = {};

    activityValidationErrors.forEach(({ activityId, errors, type }) => {
      if (tableErrorsMap[activityId] === undefined) {
        tableErrorsMap[activityId] = {
          errorCounts: {
            all: 0,
            extra: 0,
            invalidAnchor: 0,
            invalidParameter: 0,
            missing: 0,
            outOfBounds: 0,
            wrongType: 0,
          },
          id: activityId,
          location: [],
          type,
        };
      }

      const location: string[] = tableErrorsMap[activityId].location;
      errors.forEach(error => {
        if (isInstantiationError(error)) {
          const extraCount = error.errors.extraneousArguments.length;
          const missingCount = error.errors.missingArguments.length;
          const invalidParameterCount = error.errors.unconstructableArguments.length;

          extra += extraCount;
          missing += missingCount;
          invalidParameter += invalidParameterCount;

          tableErrorsMap[activityId].errorCounts.extra += extraCount;
          tableErrorsMap[activityId].errorCounts.missing += missingCount;
          tableErrorsMap[activityId].errorCounts.invalidParameter += invalidParameterCount;

          location.push(...error.errors.extraneousArguments);
          location.push(...error.errors.missingArguments);
          error.errors.unconstructableArguments.forEach(({ name }) => {
            location.push(name);
          });
        } else if (isUnknownTypeError(error)) {
          wrongType += 1;

          tableErrorsMap[activityId].errorCounts.wrongType += 1;
        } else if (isValidationNoticesError(error)) {
          const invalidParameterCount = error.errors.validationNotices.length;

          invalidParameter += invalidParameterCount;

          tableErrorsMap[activityId].errorCounts.invalidParameter += invalidParameterCount;

          error.errors.validationNotices.forEach(({ subjects }) => {
            location.push(...subjects);
          });
        } else {
          const { message } = error;
          if (/end-time\sanchor/i.test(message)) {
            invalidAnchor += 1;

            tableErrorsMap[activityId].errorCounts.invalidAnchor += 1;
          } else if (/plan\sstart/i.test(message)) {
            outOfBounds += 1;

            tableErrorsMap[activityId].errorCounts.outOfBounds += 1;
          }
        }
      });

      tableErrorsMap[activityId].location = [...new Set(location)];
    });

    all = extra + invalidAnchor + invalidParameter + missing + outOfBounds + wrongType;

    counts = {
      all,
      extra,
      invalidAnchor,
      invalidParameter,
      missing,
      outOfBounds,
      wrongType,
    };

    tableErrors = Object.values(tableErrorsMap);
  }
</script>

<TabPanel>
  <div class="activity-errors-container">
    <div class="console-header">
      <div>{title}</div>
    </div>
    <div class="errors">
      <div class="rollups">
        <button class="count all" class:selected={selectedCategory === 'all'} value="all" on:click={onSelectCategory}>
          All ({counts.all})
        </button>
        {#if counts.extra}
          <button class="count" class:selected={selectedCategory === 'extra'} value="extra" on:click={onSelectCategory}>
            <WarningExtraIcon class="red-icon" />{counts.extra} extra parameter{pluralize(counts.extra)}
          </button>
        {/if}
        {#if counts.missing}
          <button
            class="count"
            class:selected={selectedCategory === 'missing'}
            value="missing"
            on:click={onSelectCategory}
          >
            <WarningMissingIcon class="red-icon" />{counts.missing} missing parameter{pluralize(counts.missing)}
          </button>
        {/if}
        {#if counts.wrongType}
          <button
            class="count"
            class:selected={selectedCategory === 'wrongType'}
            value="wrongType"
            on:click={onSelectCategory}
          >
            <WarningUnknownIcon class="red-icon" />{counts.wrongType} wrong parameter type{pluralize(counts.wrongType)}
          </button>
        {/if}
        {#if counts.invalidParameter}
          <button
            class="count"
            class:selected={selectedCategory === 'invalidParameter'}
            value="invalidParameter"
            on:click={onSelectCategory}
          >
            <WarningIcon class="orange-icon" />{counts.invalidParameter} invalid parameter{pluralize(
              counts.invalidParameter,
            )}
          </button>
        {/if}
        {#if counts.invalidAnchor}
          <button
            class="count"
            class:selected={selectedCategory === 'invalidAnchor'}
            value="invalidAnchor"
            on:click={onSelectCategory}
          >
            <WarningIcon class="orange-icon" />{counts.invalidAnchor} invalid anchor{pluralize(counts.invalidAnchor)}
          </button>
        {/if}
        {#if counts.outOfBounds}
          <button
            class="count"
            class:selected={selectedCategory === 'outOfBounds'}
            value="outOfBounds"
            on:click={onSelectCategory}
          >
            <OutsideBoundsIcon />{counts.outOfBounds} outside plan bounds
          </button>
        {/if}
      </div>
      <div class="errors-table">
        <DataGrid
          bind:this={dataGrid}
          {columnDefs}
          rowData={tableErrors}
          rowSelection="single"
          {doesExternalFilterPass}
          {isExternalFilterPresent}
          on:selectionChanged
        />
      </div>
    </div>
  </div>
</TabPanel>

<style>
  .activity-errors-container {
    display: grid;
    grid-template-rows: min-content auto;
    height: 100%;
  }

  .console-header {
    color: var(--st-gray-60);
    display: grid;
    font-size: 11px;
    font-weight: 700;
    grid-template-columns: auto min-content;
    justify-content: space-between;
    line-height: 1rem;
    margin: 0.65rem 1rem;
    text-transform: uppercase;
  }

  .errors {
    background-color: var(--st-primary-background-color);
    display: grid;
    grid-template-columns: 240px auto;
  }

  .rollups {
    border-right: 1px solid var(--st-gray-20, #ebecec);
  }

  .count {
    background: none;
    border: 0;
    color: var(--st-gray-60, #545f64);
    column-gap: 2px;
    cursor: pointer;
    display: flex;
    font-weight: 500;
    padding: 0.3rem 1rem;
    text-align: left;
    vertical-align: middle;
    width: 100%;
  }

  .count:hover {
    background-color: var(--st-gray-20, #ebecec);
  }

  .count.all {
    margin-top: 1rem;
  }

  .count.selected {
    background-color: var(--st-gray-15, #f1f2f3);
    color: var(--st-gray-80);
  }
</style>
