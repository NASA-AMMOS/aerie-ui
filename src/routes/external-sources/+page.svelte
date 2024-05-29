<svelte:options immutable={true} />

<script lang="ts">
  import Nav from '../../components/app/Nav.svelte';
  import PageTitle from '../../components/app/PageTitle.svelte';
  import CssGrid from '../../components/ui/CssGrid.svelte';
  import Panel from '../../components/ui/Panel.svelte';
  import SectionTitle from '../../components/ui/SectionTitle.svelte';
  import type { User } from '../../types/app';
  import effects from '../../utilities/effects';
  import type { PageData } from './$types';

  async function onFormSubmit() {
    if (files !== undefined) {
      sourceId = await effects.createExternalSource(files, user);
    }
    // step 1: upload the file.
    // step 2: create the external source.
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
