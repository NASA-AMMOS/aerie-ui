<svelte:options immutable={true} />

<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import type { ValueGetterParams } from 'ag-grid-community';
  import Truck from 'bootstrap-icons/icons/truck.svg?component';
  import Nav from '../../components/app/Nav.svelte';
  import PageTitle from '../../components/app/PageTitle.svelte';
  import ExternalSource from '../../components/external-source/ExternalSource.svelte';
  import DatePickerField from '../../components/form/DatePickerField.svelte';
  import Field from '../../components/form/Field.svelte';
  import AlertError from '../../components/ui/AlertError.svelte';
  import CssGrid from '../../components/ui/CssGrid.svelte';
  import SingleActionDataGrid from '../../components/ui/DataGrid/SingleActionDataGrid.svelte';
  import Panel from '../../components/ui/Panel.svelte';
  import SectionTitle from '../../components/ui/SectionTitle.svelte';
  import { createExternalSourceError, creatingExternalSource, externalSources } from '../../stores/external-source';
  import { field } from '../../stores/form';
  import type { User } from '../../types/app';
  import type { DataGridColumnDef } from '../../types/data-grid';
  import type { ExternalSourceInsertInput, ExternalSourceSlim } from '../../types/external-source';
  import effects from '../../utilities/effects';
  import { required, timestamp } from '../../utilities/validators';
  import type { PageData } from './$types';

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

  export let data: PageData;

  let user: User | null = data.user;

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
        file_id: 2, // can't hard code this of course. Link somehow to onFormSubmit vi
        external_events: {
          data: parsed?.events?.map(e => {
            return {
              key: e.key,
              event_type: e.event_type,
              start_time: e.time,
              end_time: e.end_time, // do some sanitization/checking to convert this to a duration, or to keep the duration if provided so we can push it into the database :)
            };
          }),
        },
      };
    }
  }
</script>

<PageTitle title="External Sources" />

<CssGrid rows="var(--nav-header-height) calc(100vh - var(--nav-header-height))">
  <Nav {user}>
    <span slot="title">External Sources</span>
  </Nav>

  <CssGrid columns="20% auto">
    <Panel borderRight padBody={false}>
      <svelte:fragment slot="header">
        <SectionTitle>New External Source</SectionTitle>
      </svelte:fragment>

      <svelte:fragment slot="body">
        <form on:submit|preventDefault={onFormSubmit}>
          <AlertError class="m-2" error={$createExternalSourceError} />

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

          <fieldset>
            <label for="file">Source File</label>
            <input class="w-100" name="file" required type="file" bind:files />
          </fieldset>
          <fieldset>
            <button class="st-button w-100" type="submit">{$creatingExternalSource ? 'Uploading...' : 'Upload'}</button>
          </fieldset>
        </form>
      </svelte:fragment>
    </Panel>

    <!-- svelte-ignore missing-declaration -->
    <Panel>
      <svelte:fragment slot="header">
        <SectionTitle><Truck />External Sources</SectionTitle>
      </svelte:fragment>

      <svelte:fragment slot="body">
        {#if parsed}
          <ExternalSource {parsed}></ExternalSource>
          <pre>{JSON.stringify({ source: sourceInsert }, null, 2)}</pre>
        {:else}
          <p>There is no file selected.</p>
        {/if}
        {#if $externalSources.length}
          <SingleActionDataGrid {columnDefs} itemDisplayText="External Source" items={$externalSources} {user} />
        {:else}
          No Models Found
        {/if}
      </svelte:fragment>
    </Panel>
  </CssGrid>
</CssGrid>

<style>
</style>
