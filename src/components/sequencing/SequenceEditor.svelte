<svelte:options immutable={true} />

<script lang="ts">
  import { json } from '@codemirror/lang-json';
  import { syntaxTree } from '@codemirror/language';
  import { lintGutter } from '@codemirror/lint';
  import { Compartment, EditorState } from '@codemirror/state';
  import type { ViewUpdate } from '@codemirror/view';
  import type { SyntaxNode } from '@lezer/common';
  import type { CommandDictionary, ParameterDictionary } from '@nasa-jpl/aerie-ampcs';
  import ClipboardIcon from 'bootstrap-icons/icons/clipboard.svg?component';
  import { EditorView, basicSetup } from 'codemirror';
  import { seq } from 'codemirror-lang-sequence';
  import { debounce } from 'lodash-es';
  import { createEventDispatcher, onMount } from 'svelte';
  import {
    commandDictionaries,
    parameterDictionaries as parameterDictionariesStore,
    userSequenceEditorColumns,
    userSequenceEditorColumnsWithFormBuilder,
    userSequencesRows,
  } from '../../stores/sequencing';
  import type { User } from '../../types/app';
  import type { Parcel } from '../../types/sequencing';
  import effects from '../../utilities/effects';
  import { seqJsonLinter } from '../../utilities/new-sequence-editor/seq-json-linter';
  import { sequenceCompletion } from '../../utilities/new-sequence-editor/sequence-completion';
  import { sequenceLinter } from '../../utilities/new-sequence-editor/sequence-linter';
  import { sequenceTooltip } from '../../utilities/new-sequence-editor/sequence-tooltip';
  import { sequenceToSeqJson } from '../../utilities/new-sequence-editor/to-seq-json';
  import { showFailureToast, showSuccessToast } from '../../utilities/toast';
  import { tooltip } from '../../utilities/tooltip';
  import CssGrid from '../ui/CssGrid.svelte';
  import CssGridGutter from '../ui/CssGridGutter.svelte';
  import Panel from '../ui/Panel.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';
  import SelectedCommand from './form/selected-command.svelte';

  export let parcel: Parcel | null = null;
  export let showCommandFormBuilder: boolean = false;
  export let readOnly: boolean = false;
  export let sequenceName: string = '';
  export let sequenceDefinition: string = '';
  export let sequenceSeqJson: string = '';
  export let title: string = 'Sequence - Definition Editor';
  export let user: User | null;

  const dispatch = createEventDispatcher<{
    sequence: string;
  }>();

  let clientHeightGridRightBottom: number;
  let clientHeightGridRightTop: number;
  let compartmentSeqJsonLinter: Compartment;
  let compartmentSeqLanguage: Compartment;
  let compartmentSeqLinter: Compartment;
  let compartmentSeqTooltip: Compartment;
  let commandDictionary: CommandDictionary | null;
  let parameterDictionaries: ParameterDictionary[];
  let commandFormBuilderGrid: string;
  let editorSeqJsonDiv: HTMLDivElement;
  let editorSeqJsonView: EditorView;
  let editorSequenceDiv: HTMLDivElement;
  let editorSequenceView: EditorView;
  let selectedNode: SyntaxNode | null;

  $: {
    if (editorSequenceView) {
      editorSequenceView.dispatch({
        changes: { from: 0, insert: sequenceDefinition, to: editorSequenceView.state.doc.length },
      });
    }
  }

  $: {
    commandFormBuilderGrid = showCommandFormBuilder
      ? $userSequenceEditorColumnsWithFormBuilder
      : $userSequenceEditorColumns;
  }

  $: {
    const unparsedCommandDictionary = $commandDictionaries.find(cd => cd.id === parcel?.command_dictionary_id);

    // TODO --- once parcel is updated to store an array this needs an update
    const parameterDictionaryIds = parcel?.parameter_dictionary_id ? [parcel.parameter_dictionary_id] : [];
    const unparsedParameterDictionaries = $parameterDictionariesStore.filter(pd =>
      parameterDictionaryIds.includes(pd.id),
    );

    if (unparsedCommandDictionary) {
      Promise.all([
        effects.getParsedAmpcsCommandDictionary(unparsedCommandDictionary.id, user),
        ...unparsedParameterDictionaries.map(unparsedParameterDictionary => {
          return effects.getParsedAmpcsParameterDictionary(unparsedParameterDictionary.id, user);
        }),
      ]).then(([parsedDictionary, ...parsedParameterDictionaries]) => {
        const nonNullParsedParameterDictionaries = parsedParameterDictionaries.filter(
          (pd): pd is ParameterDictionary => !!pd,
        );

        commandDictionary = parsedDictionary;
        parameterDictionaries = nonNullParsedParameterDictionaries;
        // Reconfigure sequence editor.
        editorSequenceView.dispatch({
          effects: compartmentSeqLanguage.reconfigure(seq(sequenceCompletion(parsedDictionary))),
        });
        editorSequenceView.dispatch({
          effects: compartmentSeqLinter.reconfigure(
            sequenceLinter(parsedDictionary, nonNullParsedParameterDictionaries),
          ),
        });
        editorSequenceView.dispatch({
          effects: compartmentSeqTooltip.reconfigure(
            sequenceTooltip(parsedDictionary, nonNullParsedParameterDictionaries),
          ),
        });

        // Reconfigure seq JSON editor.
        editorSeqJsonView.dispatch({ effects: compartmentSeqJsonLinter.reconfigure(seqJsonLinter(parsedDictionary)) });
      });
    }
  }

  onMount(() => {
    compartmentSeqJsonLinter = new Compartment();
    compartmentSeqLanguage = new Compartment();
    compartmentSeqLinter = new Compartment();
    compartmentSeqTooltip = new Compartment();

    editorSequenceView = new EditorView({
      doc: sequenceDefinition,
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        EditorView.theme({ '.cm-gutter': { 'min-height': `${clientHeightGridRightTop}px` } }),
        lintGutter(),
        compartmentSeqLanguage.of(seq(sequenceCompletion())),
        compartmentSeqLinter.of(sequenceLinter()),
        compartmentSeqTooltip.of(sequenceTooltip()),
        EditorView.updateListener.of(debounce(sequenceUpdateListener, 250)),
        EditorView.updateListener.of(selectedCommandUpdateListener),
        EditorState.readOnly.of(readOnly),
      ],
      parent: editorSequenceDiv,
    });

    editorSeqJsonView = new EditorView({
      doc: sequenceSeqJson,
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        EditorView.theme({ '.cm-gutter': { 'min-height': `${clientHeightGridRightBottom}px` } }),
        EditorView.editable.of(false),
        lintGutter(),
        json(),
        compartmentSeqJsonLinter.of(seqJsonLinter()),
        EditorState.readOnly.of(readOnly),
      ],
      parent: editorSeqJsonDiv,
    });
  });

  function sequenceUpdateListener(viewUpdate: ViewUpdate) {
    const sequence = viewUpdate.state.doc.toString();

    const tree = syntaxTree(viewUpdate.state);
    const seqJson = sequenceToSeqJson(tree, sequence, commandDictionary, parameterDictionaries, sequenceName);
    const seqJsonStr = JSON.stringify(seqJson, null, 2);
    editorSeqJsonView.dispatch({ changes: { from: 0, insert: seqJsonStr, to: editorSeqJsonView.state.doc.length } });

    dispatch('sequence', sequence);
  }

  function selectedCommandUpdateListener(viewUpdate: ViewUpdate) {
    // This is broken out into a different listener as debouncing this can cause cursor to move around
    const tree = syntaxTree(viewUpdate.state);
    const updatedSelectionNode = tree.resolveInner(viewUpdate.state.selection.asSingle().main.from, -1);
    // minimize triggering selected command view
    if (selectedNode !== updatedSelectionNode) {
      selectedNode = updatedSelectionNode;
    }
  }

  function downloadSeqJson() {
    const a = document.createElement('a');
    // TODO -- we should write to Hasura in save action
    a.href = URL.createObjectURL(new Blob([editorSeqJsonView.state.doc.toString()], { type: 'application/json' }));
    a.download = sequenceName;
    a.click();
  }

  async function copySeqJsonToClipboard() {
    try {
      await navigator.clipboard.writeText(editorSeqJsonView.state.doc.toString());
      showSuccessToast('Sequence.json copied to clipboard');
    } catch {
      showFailureToast('Error copying sequence.json to clipboard');
    }
  }
</script>

<CssGrid bind:columns={commandFormBuilderGrid} minHeight={'0'}>
  <CssGrid bind:rows={$userSequencesRows} minHeight={'0'}>
    <Panel>
      <svelte:fragment slot="header">
        <SectionTitle>{title}</SectionTitle>

        <div class="right">
          <slot />
        </div>
      </svelte:fragment>

      <svelte:fragment slot="body">
        <div bind:this={editorSequenceDiv} />
      </svelte:fragment>
    </Panel>

    <CssGridGutter track={1} type="row" />

    <Panel>
      <svelte:fragment slot="header">
        <SectionTitle>Seq JSON (Read-only)</SectionTitle>

        <div class="right">
          <button
            use:tooltip={{ content: `Copy to clipboard`, placement: 'top' }}
            class="st-button icon"
            on:click={copySeqJsonToClipboard}><ClipboardIcon /></button
          >
          <button
            use:tooltip={{ content: `Download Seq.json`, placement: 'top' }}
            class="st-button secondary ellipsis"
            on:click={downloadSeqJson}>Download</button
          >
        </div>
      </svelte:fragment>

      <svelte:fragment slot="body">
        <div bind:this={editorSeqJsonDiv} />
      </svelte:fragment>
    </Panel>
  </CssGrid>

  <CssGridGutter track={1} type="column" />

  {#if !!commandDictionary && !!selectedNode && showCommandFormBuilder}
    <SelectedCommand node={selectedNode} {commandDictionary} {editorSequenceView} {parameterDictionaries} />
  {/if}
</CssGrid>

<style>
  .right {
    align-items: center;
    display: flex;
    justify-content: space-around;
  }
</style>
