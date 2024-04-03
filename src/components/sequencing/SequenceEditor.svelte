<svelte:options immutable={true} />

<script lang="ts">
  import { json } from '@codemirror/lang-json';
  import { syntaxTree } from '@codemirror/language';
  import { lintGutter } from '@codemirror/lint';
  import { Compartment, EditorState } from '@codemirror/state';
  import type { ViewUpdate } from '@codemirror/view';
  import type { CommandDictionary } from '@nasa-jpl/aerie-ampcs';
  import { EditorView, basicSetup } from 'codemirror';
  import { seq } from 'codemirror-lang-sequence';
  import { debounce } from 'lodash-es';
  import { createEventDispatcher, onMount } from 'svelte';
  import { commandDictionaries, userSequencesRows } from '../../stores/sequencing';
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

  $: {
    if (editorSequenceView) {
      editorSequenceView.dispatch({
        changes: { from: 0, insert: sequenceDefinition, to: editorSequenceView.state.doc.length },
      });
    }
  }

  $: {
    const commandDictionary = $commandDictionaries.find(cd => cd.id === sequenceCommandDictionaryId);

    if (commandDictionary) {
      effects.getParsedAmpcsCommandDictionary(commandDictionary.id, user).then(parsedDictionary => {
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
    const seqJson = sequenceToSeqJson(tree, sequence, commandDictionary);
    const seqJsonStr = JSON.stringify(seqJson, null, 2);
    editorSeqJsonView.dispatch({ changes: { from: 0, insert: seqJsonStr, to: editorSeqJsonView.state.doc.length } });

    dispatch('sequence', sequence);
  }

  function downloadSeqJson() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([sequenceDefinition], { type: 'application/json' }));
    a.download = sequenceName;
    a.click();
  }
</script>

<CssGrid bind:rows={$userSequencesRows}>
  <Panel overflowYBody="hidden">
    <svelte:fragment slot="header">
      <SectionTitle>{title}</SectionTitle>

      <div class="right">
        <slot />
      </div>
    </svelte:fragment>

    <svelte:fragment slot="body">
      <div bind:clientHeight={clientHeightGridRightTop}>
        <div bind:this={editorSequenceDiv} />
      </div>
    </svelte:fragment>
  </Panel>

  <CssGridGutter track={1} type="row" />

  <Panel>
    <svelte:fragment slot="header">
      <SectionTitle>Seq JSON (Read-only)</SectionTitle>

      <div class="right">
        <button class="st-button secondary ellipsis" on:click={downloadSeqJson}>Download</button>
      </div>
    </svelte:fragment>

    <svelte:fragment slot="body">
      <div bind:clientHeight={clientHeightGridRightBottom}>
        <div bind:this={editorSeqJsonDiv} />
      </div>
    </svelte:fragment>
  </Panel>
</CssGrid>
