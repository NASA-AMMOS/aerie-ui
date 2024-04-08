<svelte:options immutable={true} />

<script lang="ts">
  import { json } from '@codemirror/lang-json';
  import { syntaxTree } from '@codemirror/language';
  import { lintGutter } from '@codemirror/lint';
  import { Compartment, EditorState } from '@codemirror/state';
  import type { ViewUpdate } from '@codemirror/view';
  import type { SyntaxNode } from '@lezer/common';
  import type { CommandDictionary } from '@nasa-jpl/aerie-ampcs';
  import { EditorView, basicSetup } from 'codemirror';
  import { seq } from 'codemirror-lang-sequence';
  import { debounce } from 'lodash-es';
  import { createEventDispatcher, onMount } from 'svelte';
  import { commandDictionaries, userSequenceEditorColumns, userSequencesRows } from '../../stores/sequencing';
  import type { User } from '../../types/app';
  import effects from '../../utilities/effects';
  import { seqJsonLinter } from '../../utilities/new-sequence-editor/seq-json-linter';
  import { sequenceCompletion } from '../../utilities/new-sequence-editor/sequence-completion';
  import { sequenceLinter } from '../../utilities/new-sequence-editor/sequence-linter';
  import { sequenceTooltip } from '../../utilities/new-sequence-editor/sequence-tooltip';
  import { sequenceToSeqJson } from '../../utilities/new-sequence-editor/to-seq-json';
  import CssGrid from '../ui/CssGrid.svelte';
  import CssGridGutter from '../ui/CssGridGutter.svelte';
  import Panel from '../ui/Panel.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';
  import SelectedCommand from './form/selected-command.svelte';

  export let readOnly: boolean = false;
  export let sequenceCommandDictionaryId: number | null = null;
  export let sequenceName: string = '';
  export let sequenceDefinition: string = '';
  export let sequenceSeqJson: string = '';
  export let title: string = 'Sequence - Definition Editor';
  export let user: User | null;

  const dispatch = createEventDispatcher<{
    generate: void;
    sequence: string;
  }>();

  let clientHeightGridRightBottom: number;
  let clientHeightGridRightTop: number;
  let compartmentSeqJsonLinter: Compartment;
  let compartmentSeqLanguage: Compartment;
  let compartmentSeqLinter: Compartment;
  let compartmentSeqTooltip: Compartment;
  let commandDictionary: CommandDictionary | null;
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
    const unparsedCommandDictionary = $commandDictionaries.find(cd => cd.id === sequenceCommandDictionaryId);

    if (unparsedCommandDictionary) {
      effects.getParsedAmpcsCommandDictionary(unparsedCommandDictionary.id, user).then(parsedDictionary => {
        commandDictionary = parsedDictionary;
        // Reconfigure sequence editor.
        const newSeqLanguage = seq(sequenceCompletion(parsedDictionary));
        editorSequenceView.dispatch({ effects: compartmentSeqLanguage.reconfigure(newSeqLanguage) });
        editorSequenceView.dispatch({ effects: compartmentSeqLinter.reconfigure(sequenceLinter(parsedDictionary)) });
        editorSequenceView.dispatch({ effects: compartmentSeqTooltip.reconfigure(sequenceTooltip(parsedDictionary)) });

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
    const seqJson = sequenceToSeqJson(tree, sequence, commandDictionary, sequenceName);
    const seqJsonStr = JSON.stringify(seqJson, null, 2);
    editorSeqJsonView.dispatch({ changes: { from: 0, insert: seqJsonStr, to: editorSeqJsonView.state.doc.length } });

    dispatch('sequence', sequence);
  }

  function selectedCommandUpdateListener(viewUpdate: ViewUpdate) {
    const tree = syntaxTree(viewUpdate.state);
    const updatedSelectionNode = tree.resolveInner(viewUpdate.state.selection.asSingle().main.from, -1);
    // minimize triggering selected command view
    if (selectedNode !== updatedSelectionNode) {
      selectedNode = updatedSelectionNode;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function downloadSeqJson() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([sequenceDefinition], { type: 'application/json' }));
    a.download = sequenceName;
    a.click();
  }
</script>

<CssGrid bind:columns={$userSequenceEditorColumns} minHeight={'0'}>
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

        <!-- <div class="right">
          <button class="st-button secondary ellipsis" on:click={downloadSeqJson}>Download</button>
        </div> -->
      </svelte:fragment>

      <svelte:fragment slot="body">
        <div bind:this={editorSeqJsonDiv} />
      </svelte:fragment>
    </Panel>
  </CssGrid>

  <CssGridGutter track={1} type="column" />

  {#if !!commandDictionary && !!selectedNode}
    <SelectedCommand node={selectedNode} {commandDictionary} {editorSequenceView} />
  {:else}
    <div>Selected Command</div>
  {/if}
</CssGrid>
