<svelte:options immutable={true} />

<script lang="ts">
  import PlanIcon from '@nasa-jpl/stellar/icons/plan.svg?component';
  import RefreshIcon from '@nasa-jpl/stellar/icons/refresh.svg?component';
  import type { ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
  import Nav from '../../components/app/Nav.svelte';
  import PageTitle from '../../components/app/PageTitle.svelte';
  import ColorPresetsPicker from '../../components/form/ColorPresetsPicker.svelte';
  import Field from '../../components/form/Field.svelte';
  import Input from '../../components/form/Input.svelte';
  import AlertError from '../../components/ui/AlertError.svelte';
  import CssGrid from '../../components/ui/CssGrid.svelte';
  import DataGridActions from '../../components/ui/DataGrid/DataGridActions.svelte';
  import SingleActionDataGrid from '../../components/ui/DataGrid/SingleActionDataGrid.svelte';
  import Panel from '../../components/ui/Panel.svelte';
  import SectionTitle from '../../components/ui/SectionTitle.svelte';
  import TagChip from '../../components/ui/Tags/Tag.svelte';
  import { field } from '../../stores/form';
  import { tags as tagsStore } from '../../stores/tags';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef, RowId } from '../../types/data-grid';
  import type { Tag } from '../../types/tags';
  import { generateRandomPastelColor } from '../../utilities/color';
  import effects from '../../utilities/effects';
  import { permissionHandler } from '../../utilities/permissionHandler';
  import { featurePermissions } from '../../utilities/permissions';
  import { getShortISOForDate } from '../../utilities/time';
  import { hex, required, unique } from '../../utilities/validators';
  import type { PageData } from './$types';

  export let data: PageData;

  type CellRendererParams = {
    deleteTag: (tag: Tag) => void;
  };
  type TagsCellRendererParams = ICellRendererParams<Tag> & CellRendererParams;
  type TagsPermissionsMap = {
    tags: Record<number, boolean>;
  };

  const baseColumnDefs: DataGridColumnDef[] = [
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
    // { field: 'name', filter: 'text', headerName: 'Name', minWidth: 80, resizable: true, sortable: true },
    {
      cellClass: 'action-cell-container',
      cellRenderer: (params: TagsCellRendererParams) => {
        if (params && params.data && params.data.name) {
          const tagDiv = document.createElement('div');
          tagDiv.className = 'tags-cell';
          new TagChip({
            props: {
              removable: false,
              tag: params.data,
            },
            target: tagDiv,
          });
          return tagDiv;
        }
      },
      field: 'name',
      headerName: 'Name',
      resizable: true,
      sortable: true,
      suppressAutoSize: true,
      suppressSizeToFit: true,
      width: 300,
      wrapText: true,
    },
    { field: 'owner', filter: 'text', headerName: 'Owner', minWidth: 80, resizable: true, sortable: true },
    {
      field: 'created_at',
      filter: 'text',
      headerName: 'Date Created',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<Tag>) => {
        if (params.data?.created_at) {
          return getShortISOForDate(new Date(params.data?.created_at));
        }
      },
    },
  ];
  const permissionError: string = 'You do not have permission to create a tag';

  let canCreate: boolean = false;
  let columnDefs: DataGridColumnDef[] = baseColumnDefs;
  let filterText: string = '';
  let tags: Tag[];
  let nameInputField: HTMLInputElement;
  let colorInputField: HTMLInputElement;
  let user: User | null = null;
  let selectedTag: Tag | null = null;
  let creatingTag: boolean = false;
  let defaultColor = generateRandomPastelColor();
  let createTagError: string | null = null;

  $: tags = $tagsStore || data.initialTags; // TODO no way to tell if tags store is still loading since an [] is a valid value so can't make use of initialTags.
  $: nameField = field<string>('', [required, unique(tags.map(tag => tag.name))]);
  $: colorField = field<string>(defaultColor, [required, hex]);
  $: {
    user = data.user;
    canCreate = user ? featurePermissions.tags.canCreate(user) : false;
    columnDefs = [
      ...baseColumnDefs,
      {
        cellClass: 'action-cell-container',
        cellRenderer: (params: TagsCellRendererParams) => {
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'actions-cell';
          new DataGridActions({
            props: {
              deleteCallback: params.deleteTag,
              deleteTooltip: {
                content: 'Delete Tag',
                placement: 'bottom',
              },
              hasDeletePermission: params.data && user ? featurePermissions.tags.canDelete(user, params.data) : false,
              rowData: params.data,
            },
            target: actionsDiv,
          });

          return actionsDiv;
        },
        cellRendererParams: {
          deleteTag,
        } as CellRendererParams,
        field: 'actions',
        headerName: '',
        resizable: false,
        sortable: false,
        suppressAutoSize: true,
        suppressSizeToFit: true,
        width: 25,
      },
    ];
  }
  $: createButtonEnabled = $nameField.dirtyAndValid && $colorField.dirtyAndValid;
  $: filteredTags = tags.filter(tag => {
    const filterTextLowerCase = filterText.toLowerCase();
    const includesId = `${tag.id}`.includes(filterTextLowerCase);
    const includesName = tag.name.toLocaleLowerCase().includes(filterTextLowerCase);
    return includesId || includesName;
  });

  async function createTag() {
    creatingTag = true;
    const tag = {
      color: $colorField.value,
      name: $nameField.value,
    };
    const newTags = (await effects.createTags([tag], user)) || [];
    if (newTags.length) {
      tags.push(newTags[0]);
      nameField.reset('');
      colorField.validateAndSet(generateRandomPastelColor());
    }
    creatingTag = false;
  }

  async function deleteTag({ id }: Pick<Tag, 'id'>): Promise<void> {
    // TODO delete the plan tag and remove any expansion rule and scheduling goal tags manually
    // const success = await effects.deleteTag(id, user);
    // if (success) {
    //   plans = plans.filter(plan => plan.id !== id);
    // }
  }

  // async function onTagsInputChange(event: TagsChangeEvent) {
  //   const {
  //     detail: { tag, type },
  //   } = event;
  //   if (type === 'remove') {
  //     planTags = planTags.filter(t => t.name !== tag.name);
  //   } else if (type === 'create' || type === 'select') {
  //     let tagsToAdd: Tag[] = [tag];
  //     if (type === 'create') {
  //       tagsToAdd = (await effects.createTags([{ color: tag.color, name: tag.name }], user)) || [];
  //     }
  //     planTags = planTags.concat(tagsToAdd);
  //   }
  // }

  function deleteTagContext(event: CustomEvent<RowId[]>) {
    deleteTag({ id: event.detail[0] as number });
  }

  function showTag(tag: Tag) {
    selectedTag = tag;
  }
</script>

<PageTitle title="Plans" />

<CssGrid rows="var(--nav-header-height) calc(100vh - var(--nav-header-height))">
  <Nav {user}>
    <span slot="title">Plans</span>
  </Nav>

  <CssGrid columns="20% auto">
    <Panel borderRight padBody={false}>
      <svelte:fragment slot="header">
        <SectionTitle>New Tag</SectionTitle>
      </svelte:fragment>

      <svelte:fragment slot="body">
        <form on:submit|preventDefault={() => createTag()}>
          <AlertError class="m-2" error={createTagError} />

          <Field field={nameField}>
            <label for="name" slot="label">Name</label>
            <input
              bind:this={nameInputField}
              autocomplete="off"
              class="st-input w-100"
              name="name"
              use:permissionHandler={{
                hasPermission: canCreate,
                permissionError,
              }}
            />
          </Field>

          <Field field={colorField}>
            <label for="color" slot="label">Color</label>
            <div class="tags-color-picker">
              <input
                bind:this={colorInputField}
                autocomplete="off"
                class="st-input w-100"
                name="color"
                use:permissionHandler={{
                  hasPermission: canCreate,
                  permissionError,
                }}
              />
              <!-- TODO add permission handler here -->
              <ColorPresetsPicker
                tooltipText="Select Color"
                presetColors={[
                  '#FAB9C7',
                  '#FBCAC9',
                  '#F7CAB5',
                  '#F0EEB9',
                  '#BAF3C8',
                  '#E0EEE4',
                  '#C1CDEE',
                  '#E2DEF5',
                  '#D4BFF7',
                  '#F0CDF5',
                  '#FAC4F1',
                  '#F1E6E4',
                  '#E7D7BE',
                  '#E3E0CD',
                  '#E8E8E8',
                ]}
                placement="bottom-start"
                value={$colorField.value}
                on:input={event => colorField.validateAndSet(event.detail.value)}
              />
              <button
                type="button"
                class="st-button icon"
                on:click={() => colorField.validateAndSet(generateRandomPastelColor())}
                use:permissionHandler={{
                  hasPermission: canCreate,
                  permissionError,
                }}
              >
                <RefreshIcon />
              </button>
            </div>
          </Field>

          <fieldset>
            <label for="preview">Tag Preview</label>
            <div class="tags-preview">
              <TagChip
                tag={{ color: $colorField.value, id: -1, name: $nameField.value || 'Tag Name' }}
                removable={false}
              />
            </div>
          </fieldset>

          <fieldset>
            <div class="tags-creator st-typography-body">
              Created by <span>@{user?.id}</span>
            </div>
          </fieldset>

          <fieldset>
            <button
              class="st-button w-100"
              disabled={!createButtonEnabled}
              type="submit"
              use:permissionHandler={{
                hasPermission: canCreate,
                permissionError,
              }}
            >
              {creatingTag ? 'Creating...' : 'Create'}
            </button>
          </fieldset>
        </form>
      </svelte:fragment>
    </Panel>

    <Panel>
      <svelte:fragment slot="header">
        <SectionTitle>
          <PlanIcon />
          Tags
        </SectionTitle>
        <Input>
          <input bind:value={filterText} class="st-input" placeholder="Filter tags" style="width: 300px" />
        </Input>
      </svelte:fragment>

      <svelte:fragment slot="body">
        {#if filteredTags.length}
          <SingleActionDataGrid
            {columnDefs}
            hasDeletePermission={featurePermissions.tags.canDelete}
            itemDisplayText="Tag"
            items={filteredTags}
            {user}
            on:deleteItem={deleteTagContext}
            on:rowClicked={({ detail }) => {
              showTag(detail.data);
            }}
          />
        {:else}
          No Tags Found
        {/if}
      </svelte:fragment>
    </Panel>
  </CssGrid>
</CssGrid>

<style>
  .tags-color-picker {
    display: flex;
    gap: 4px;
  }

  .tags-color-picker :global(.color-preset-picker) {
    flex-shrink: 0;
  }

  .tags-preview {
    margin-top: 2px;
  }

  .tags-preview :global(.st-chip) {
    max-width: 100%;
  }

  .tags-creator {
    display: flex;
    justify-content: space-between;
  }
</style>
