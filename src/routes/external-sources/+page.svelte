<svelte:options immutable={true} />

<script lang="ts">
  import Nav from '../../components/app/Nav.svelte';
  import PageTitle from '../../components/app/PageTitle.svelte';
  import DatePickerField from '../../components/form/DatePickerField.svelte';
  import Field from '../../components/form/Field.svelte';
  import CssGrid from '../../components/ui/CssGrid.svelte';
  import Panel from '../../components/ui/Panel.svelte';
  import SectionTitle from '../../components/ui/SectionTitle.svelte';
  import { field } from '../../stores/form';
  import type { User } from '../../types/app';
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

  async function onFormSubmit() {
    if (files !== undefined) {
      // break input into an object
      sourceId = await effects.createExternalSource(
        $keyField.value, 
        $sourceTypeField.value,
        $startTimeDoyField.value,
        $endTimeDoyField.value,
        $endTimeDoyField.value,
        files, 
        user
      );
      // if ($createModelError === null && e.target instanceof HTMLFormElement) { // create model error in stores
      //   goto(`${base}/external-sources/${sourceId}`); // base in types
      // TODO: make external-source specific pages
      // }
    }
  }

  export let data: PageData;

  let user: User | null = data.user;

  let files: FileList | undefined;

  let sourceId: any;
</script>

<PageTitle title="External Sources" />

<CssGrid rows="var(--nav-header-height) calc(100vh - var(--nav-header-height))">
  <Nav {user}>
    <span slot="title">External Sources</span>
  </Nav>

  <CssGrid columns="20% auto">
    <Panel borderRight padBody={false}>
      <svelte:fragment slot="header">
        <SectionTitle>Hello!</SectionTitle>
      </svelte:fragment>

      <svelte:fragment slot="body">
        <form on:submit|preventDefault={onFormSubmit}>
          <Field field={keyField}>
            <label for="key" slot="label">Key</label>
            <input
              bind:value={keyInputField}
              autocomplete="off"
              class="st-input w-100"
              name="key"
              required
            />
          </Field>

          <Field field={sourceTypeField}>
            <label for="source-type" slot="label">Source Type</label>
            <input
              autocomplete="off"
              class="st-input w-100"
              name="source-type"
              required
            />
          </Field>

          <fieldset>
            <DatePickerField
              field={startTimeDoyField}
              label="Start Time - YYYY-DDDThh:mm:ss"
              name="start-time"
            />
          </fieldset>

          <fieldset>
            <DatePickerField
              field={endTimeDoyField}
              label="End Time - YYYY-DDDThh:mm:ss"
              name="end_time"
            />
          </fieldset>

          <fieldset>
            <DatePickerField
              field={validAtDoyField}
              label="Valid At Time - YYYY-DDDThh:mm:ss"
              name="valid_at"
            />
          </fieldset>


          <fieldset>
            <label for="file">Source File</label>
            <input class="w-100" name="file" required type="file" bind:files />
          </fieldset>
          <fieldset>
            <button class="st-button w-100" type="submit">Upload!</button>
          </fieldset>
        </form>
      </svelte:fragment>
    </Panel>

    <!-- svelte-ignore missing-declaration -->
    <Panel>
      <svelte:fragment slot="header">
        <SectionTitle>Header Hello</SectionTitle>
      </svelte:fragment>

      <svelte:fragment slot="body"
        >Body Hello
        {sourceId}
      </svelte:fragment>
    </Panel>
  </CssGrid>
</CssGrid>

<style>
</style>
