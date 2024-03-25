<svelte:options immutable={true} />

<script lang="ts">
  import { json } from '@codemirror/lang-json';
  import { syntaxTree } from '@codemirror/language';
  import { lintGutter } from '@codemirror/lint';
  import { Compartment } from '@codemirror/state';
  import type { ViewUpdate } from '@codemirror/view';
  import type { CommandDictionary } from '@nasa-jpl/aerie-ampcs';
  import { basicSetup, EditorView } from 'codemirror';
  import { seq } from 'codemirror-lang-sequence';
  import { debounce } from 'lodash-es';
  import { onMount } from 'svelte';
  import { parseCommandDictionaryFromFile } from '../../../utilities/new-sequence-editor/command-dictionary';
  import { parseSeqJsonFromFile, seqJsonToSequence } from '../../../utilities/new-sequence-editor/from-seq-json';
  import { seqJsonLinter } from '../../../utilities/new-sequence-editor/seq-json-linter';
  import { sequenceCompletion } from '../../../utilities/new-sequence-editor/sequence-completion';
  import { sequenceLinter } from '../../../utilities/new-sequence-editor/sequence-linter';
  import { sequenceTooltip } from '../../../utilities/new-sequence-editor/sequence-tooltip';
  import { seqJsonDefault, sequenceToSeqJson } from '../../../utilities/new-sequence-editor/to-seq-json';

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

  onMount(() => {
    compartmentSeqJsonLinter = new Compartment();
    compartmentSeqLanguage = new Compartment();
    compartmentSeqLinter = new Compartment();
    compartmentSeqTooltip = new Compartment();

    editorSequenceView = new EditorView({
      doc: '',
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        EditorView.theme({ '.cm-gutter': { 'min-height': `${clientHeightGridRightTop}px` } }),
        lintGutter(),
        compartmentSeqLanguage.of(seq(sequenceCompletion())),
        compartmentSeqLinter.of(sequenceLinter()),
        compartmentSeqTooltip.of(sequenceTooltip()),
        EditorView.updateListener.of(debounce(sequenceUpdateListener, 250)),
      ],
      parent: editorSequenceDiv,
    });

    editorSeqJsonView = new EditorView({
      doc: JSON.stringify(seqJsonDefault(), null, 2),
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        EditorView.theme({ '.cm-gutter': { 'min-height': `${clientHeightGridRightBottom}px` } }),
        EditorView.editable.of(false),
        lintGutter(),
        json(),
        compartmentSeqJsonLinter.of(seqJsonLinter()),
      ],
      parent: editorSeqJsonDiv,
    });
  });

  async function onCommandDictionaryInput(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    commandDictionary = await parseCommandDictionaryFromFile(e.currentTarget.files);

    // Reconfigure sequence editor.
    const newSeqLanguage = seq(sequenceCompletion(commandDictionary));
    editorSequenceView.dispatch({ effects: compartmentSeqLanguage.reconfigure(newSeqLanguage) });
    editorSequenceView.dispatch({ effects: compartmentSeqLinter.reconfigure(sequenceLinter(commandDictionary)) });
    editorSequenceView.dispatch({ effects: compartmentSeqTooltip.reconfigure(sequenceTooltip(commandDictionary)) });

    // Reconfigure seq JSON editor.
    editorSeqJsonView.dispatch({ effects: compartmentSeqJsonLinter.reconfigure(seqJsonLinter(commandDictionary)) });
  }

  async function onSeqJsonInput(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    const seqJson = await parseSeqJsonFromFile(e.currentTarget.files);
    const sequence = seqJsonToSequence(seqJson);
    editorSequenceView.dispatch({ changes: { from: 0, to: editorSequenceView.state.doc.length, insert: sequence } });
  }

  function sequenceUpdateListener(viewUpdate: ViewUpdate) {
    const tree = syntaxTree(viewUpdate.state);
    const seqJson = sequenceToSeqJson(tree, viewUpdate.state.doc.toString(), commandDictionary);
    const seqJsonStr = JSON.stringify(seqJson, null, 2);
    editorSeqJsonView.dispatch({ changes: { from: 0, to: editorSeqJsonView.state.doc.length, insert: seqJsonStr } });
  }
</script>

<div class="grid">
  <div class="grid-left">
    <div class="p-2">
      <label for="commandDictionaryFileList"> AMPCS Command Dictionary XML File </label>
      <input
        on:change={onCommandDictionaryInput}
        class="st-typography-body w-100"
        id="commandDictionaryFileList"
        name="commandDictionaryFileList"
        required
        type="file"
      />
    </div>
    <div class="p-2">
      <label for="seqJsonInput"> Import from Seq JSON </label>
      <input
        on:change={onSeqJsonInput}
        class="st-typography-body w-100"
        id="seqJsonInput"
        name="seqJsonInput"
        required
        type="file"
      />
    </div>
  </div>
  <div class="grid-right">
    <div class="grid-right-top" bind:clientHeight={clientHeightGridRightTop}>
      <div bind:this={editorSequenceDiv} />
    </div>
    <div class="grid-right-bottom" bind:clientHeight={clientHeightGridRightBottom}>
      <div bind:this={editorSeqJsonDiv} />
    </div>
  </div>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 4fr;
    height: 100%;
  }

  .grid-left,
  .grid-right,
  .grid-right-bottom,
  .grid-right-top {
    overflow: scroll;
  }

  .grid-right {
    display: grid;
    grid-template-rows: 1fr 1fr;
  }
</style>
