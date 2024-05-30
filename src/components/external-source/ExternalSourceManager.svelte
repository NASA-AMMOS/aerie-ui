<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import type { ValueGetterParams } from 'ag-grid-community';
  import Truck from 'bootstrap-icons/icons/truck.svg?component';
  import XIcon from 'bootstrap-icons/icons/x.svg?component';
  import { createExternalSourceError, creatingExternalSource, externalSources } from '../../stores/external-source';
  import { field } from '../../stores/form';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { ExternalSourceInsertInput, ExternalSourceSlim } from '../../types/external-source';
  import effects from '../../utilities/effects';
  import { tooltip } from '../../utilities/tooltip';
  import { required, timestamp } from '../../utilities/validators';
  import DatePickerField from '../form/DatePickerField.svelte';
  import Field from '../form/Field.svelte';
  import AlertError from '../ui/AlertError.svelte';
  import CssGrid from '../ui/CssGrid.svelte';
  import SingleActionDataGrid from '../ui/DataGrid/SingleActionDataGrid.svelte';
  import Panel from '../ui/Panel.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';

  let keyInputField: HTMLInputElement; // need this to set a focus on it. not related to the value

  // TODO: make these autofill???
  let keyField = field<string>('', [required]);
  let sourceTypeField = field<string>('', [required]); // need function to check if in list of allowable types...
  let startTimeDoyField = field<string>('', [required, timestamp]); // requires validation function
  let endTimeDoyField = field<string>('', [required, timestamp]); // requires validation function
  let validAtDoyField = field<string>('', [required, timestamp]); // requires validation function

  // $: createButtonDisabled = !files || key === '' ||   $creatingModel === true; TODO: do this later

  const baseColumnDefs: DataGridColumnDef[] = [
    {
      field: 'id',
      filter: 'number',
      headerName: 'ID',
      resizable: true,
      sortable: true,
    },
    {
      field: 'key',
      filter: 'text',
      headerName: 'Key',
      resizable: true,
      sortable: true,
    },
    {
      field: 'source_type',
      filter: 'text',
      headerName: 'Source Type',
      resizable: true,
      sortable: true,
    },
    {
      field: 'file_id',
      filter: 'number',
      headerName: 'File ID',
      resizable: true,
      sortable: true,
    },
    {
      field: 'start_time',
      filter: 'text',
      headerName: 'Start Time',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.start_time) {
          return new Date(params.data?.start_time).toISOString().slice(0, 19);
        }
      },
    },
    {
      field: 'end_time',
      filter: 'text',
      headerName: 'End Time',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.end_time) {
          return new Date(params.data?.end_time).toISOString().slice(0, 19);
        }
      },
    },
    {
      field: 'valid_at',
      filter: 'text',
      headerName: 'Valid At',
      resizable: true,
      sortable: true,
      valueGetter: (params: ValueGetterParams<ExternalSourceSlim>) => {
        if (params.data?.valid_at) {
          return new Date(params.data?.valid_at).toISOString().slice(0, 19);
        }
      },
    },
  ];
  let columnDefs: DataGridColumnDef[] = baseColumnDefs;
  // TODO: add actions like delete as in Models.svelte

  async function onFormSubmit(e: SubmitEvent) {
    if (files !== undefined) {
      var sourceId = await effects.createExternalSource(file, sourceInsert, user);
      // force reload the page???
      if ($createExternalSourceError === null && e.target instanceof HTMLFormElement) {
        console.log(sourceId);
        goto(`${base}/external-sources`);
      }
      // if ($createExternalSourceError === null && e.target instanceof HTMLFormElement) {
      //   goto(`${base}/external-sources/${sourceId}`);
      // }
    }
  }

  export let user: User | null;

  // We want to parse a file selected for upload.
  let files: FileList | undefined;
  let file: File | undefined;
  let parsed: object | undefined;

  // TODO: this doesn't let people modify the form properties.
  // We need to figure out if things like the start, end, and valid_at
  // time *should* be editable. I don't think any of them should be, but we
  // need to talk about it.
  $: if (files) {
    file = files[0];
    const fileText = file.text();
    fileText.then(async text => {
      parsed = JSON.parse(await text);
      $keyField.value = parsed.source.key;
      $sourceTypeField.value = parsed.source.source_type;
      $startTimeDoyField.value = parsed.source.period.start_time;
      $endTimeDoyField.value = parsed.source.period.end_time;
      $validAtDoyField.value = parsed.source.valid_at;
    });
  }

  // We want to build the GraphQL input object for the external
  // source and child events. The only thing that is missing at
  // this point is the uploaded file ID.
  // TODO: Define types.
  let sourceInsert: ExternalSourceInsertInput;
  $: {
    if (parsed) {
      sourceInsert = {
        end_time: $endTimeDoyField.value,
        key: $keyField.value,
        source_type: $sourceTypeField.value,
        start_time: $startTimeDoyField.value,
        valid_at: $validAtDoyField.value,
        external_events: {
          data: parsed?.events?.map(transformer),
        },
      };
    }
  }

  /** Transforms the event in the source to one compatible with the db schema */
  function transformer(event: any): any {
    // TODO: do some sanitization/checking to convert this to a duration, or to keep the duration
    //   if provided so we can push it into the database :)
    return {
      key: event.key,
      event_type: event.event_type,
      start_time: event.time,
      duration: event.duration,
      properties: event.properties,
    };
  }

  let selectedSource: ExternalSourceSlim | null = null;

  function selectSource(detail: ExternalSourceSlim) {
    selectedSource = detail;
  }

  function deselectSource() {
    selectedSource = null;
  }
</script>

<CssGrid>
  <CssGrid columns="20% auto">
    <Panel borderRight padBody={true}>
      <svelte:fragment slot="header">
        <SectionTitle
          >{selectedSource
            ? `#${selectedSource.id} – ${selectedSource.source_type}`
            : 'Upload a Source File'}</SectionTitle
        >
        {#if selectedSource}
          <button
            class="st-button icon fs-6"
            on:click={deselectSource}
            use:tooltip={{ content: 'Deselect source', placement: 'top' }}
          >
            <XIcon />
          </button>
        {/if}
      </svelte:fragment>

      <svelte:fragment slot="body">
        {#if selectedSource}
          <div title={selectedSource.key}>{selectedSource.key}</div>
          <div class="tbd">
            <ul>
              <li>Summarize the events?</li>
              <li>What plans should refer to this source?</li>
              <li>What plans do refer to this source?</li>
              <li>Is this newest source of this type?</li>
            </ul>
          </div>
        {:else}
          <form on:submit|preventDefault={onFormSubmit}>
            <AlertError class="m-2" error={$createExternalSourceError} />

            <fieldset>
              <label for="file">Source File</label>
              <input class="w-100" name="file" required type="file" bind:files />
            </fieldset>

            {#if parsed}
              <fieldset>
                <button class="st-button w-100" type="submit"
                  >{$creatingExternalSource ? 'Uploading...' : 'Upload'}</button
                >
              </fieldset>
              <Field field={keyField}>
                <label for="key" slot="label">Key</label>
                <input bind:value={keyInputField} autocomplete="off" class="st-input w-100" name="key" required />
              </Field>

              <Field field={sourceTypeField}>
                <label for="source-type" slot="label">Source Type</label>
                <input autocomplete="off" class="st-input w-100" name="source-type" required />
              </Field>

              <fieldset>
                <DatePickerField field={startTimeDoyField} label="Start Time - YYYY-DDDThh:mm:ss" name="start-time" />
              </fieldset>

              <fieldset>
                <DatePickerField field={endTimeDoyField} label="End Time - YYYY-DDDThh:mm:ss" name="end_time" />
              </fieldset>

              <fieldset>
                <DatePickerField field={validAtDoyField} label="Valid At Time - YYYY-DDDThh:mm:ss" name="valid_at" />
              </fieldset>
            {/if}
          </form>
        {/if}
      </svelte:fragment>
    </Panel>

    <Panel>
      <svelte:fragment slot="header">
        <SectionTitle><Truck />External Sources</SectionTitle>
      </svelte:fragment>

      <svelte:fragment slot="body">
        <div class="filter">TBD: Filter by type and time? Show me unused sources?</div>
        {#if $externalSources.length}
          <SingleActionDataGrid
            {columnDefs}
            itemDisplayText="External Source"
            items={$externalSources}
            {user}
            on:rowClicked={({ detail }) => selectSource(detail.data)}
          />
        {:else}
          <p>No External Sources present.</p>
        {/if}
      </svelte:fragment>
    </Panel>
  </CssGrid>
</CssGrid>

<style>
  .filter {
    margin: 0.8rem 0;
  }
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tbd ul,
  .tbd li {
    list-style: none;
    margin: 0.2rem 0;
    padding: 0;
  }
</style>
