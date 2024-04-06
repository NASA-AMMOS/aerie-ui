<svelte:options immutable={true} />

<script lang="ts">
  import type { EditorState } from '@codemirror/state';
  import type { SyntaxNode } from '@lezer/common';
  import type { CommandDictionary, FswCommandArgument, FswCommandArgumentRepeat } from '@nasa-jpl/aerie-ampcs';
  import type { EditorView } from 'codemirror';
  import { debounce } from 'lodash-es';
  import { fswCommandArgDefault } from '../../../utilities/new-sequence-editor/command-dictionary';
  import {
    TOKEN_COMMAND,
    TOKEN_ERROR,
    TOKEN_REPEAT_ARG,
  } from '../../../utilities/new-sequence-editor/sequencer-grammar-constants';
  import { getAncestorNode } from '../../../utilities/new-sequence-editor/tree-utils';
  import AddMissingArgsButton from './add-missing-args-button.svelte';
  import ArgEditor from './arg-editor.svelte';
  import { getMissingArgDefs, isFswCommandArgumentRepeat, type ArgTextDef } from './utils';

  export let editorSequenceView: EditorView;
  export let commandDictionary: CommandDictionary;
  export let node: SyntaxNode | null;

  const ID_COMMAND_DETAIL_PANE = 'ID_COMMAND_DETAIL_PANE';

  $: commandNode = getAncestorNode(node, TOKEN_COMMAND);
  $: commandDef = getCommandDef(commandDictionary, editorSequenceView.state, commandNode);
  $: argInfoArray = getArgumentInfo(commandNode?.getChild('Args') ?? null, commandDef?.arguments);
  $: editorArgInfoArray = argInfoArray.filter(argInfo => !!argInfo.node);
  $: missingArgDefArray = getMissingArgDefs(argInfoArray);
  $: timeTagNode = getTimeTagInfo(node);

  function getTimeTagInfo(commandNode: SyntaxNode | null) {
    const node = commandNode?.getChild('TimeTag');
    return (
      node && {
        node,
        text: editorSequenceView.state.sliceDoc(node.from, node.to) ?? '',
      }
    );
  }

  function getArgumentInfo(
    args: SyntaxNode | null,
    argumentDefs: FswCommandArgument[] | undefined,
    parentArgDef?: FswCommandArgumentRepeat,
  ) {
    const argArray: ArgTextDef[] = [];
    let node = args?.firstChild;

    // loop through nodes in editor and pair with definitions
    while (node) {
      // TODO - Consider early out on grammar error as higher chance of argument mismatch
      // skip error tokens in grammar and try to give best guess at what argument we're on
      if (node.name !== TOKEN_ERROR) {
        const argDef =
          argumentDefs &&
          argumentDefs[
            parentArgDef?.repeat?.arguments.length !== undefined
              ? argArray.length % parentArgDef?.repeat?.arguments.length
              : argArray.length
          ];
        let children: ArgTextDef[] | undefined = undefined;
        if (!!argDef && isFswCommandArgumentRepeat(argDef)) {
          children = getArgumentInfo(node, argDef.repeat?.arguments, argDef);
        }
        argArray.push({
          argDef,
          children,
          node,
          parentArgDef,
          text: editorSequenceView.state.sliceDoc(node.from, node.to),
        });
      }
      node = node.nextSibling;
    }

    // add entries for defined arguments missing from editor
    if (argumentDefs) {
      if (!parentArgDef) {
        argArray.push(...argumentDefs.slice(argArray.length).map(argDef => ({ argDef })));
      } else {
        const repeatArgs = parentArgDef?.repeat?.arguments;
        if (repeatArgs) {
          if (argArray.length % repeatArgs.length !== 0) {
            argArray.push(...argumentDefs.slice(argArray.length % repeatArgs.length).map(argDef => ({ argDef })));
          }
        }
      }
    }

    return argArray;
  }

  function getCommandDef(
    commandDictionary: CommandDictionary | null,
    state: EditorState | undefined,
    commandNode: SyntaxNode | null,
  ) {
    if (!commandDictionary || !state || !node) {
      return null;
    }

    const stemNode = commandNode?.getChild('Stem');

    if (stemNode) {
      const stemName = state.sliceDoc(stemNode.from, stemNode.to);
      return commandDictionary.fswCommandMap[stemName];
    }

    return null;
  }

  function setInEditor(token: SyntaxNode, val: string) {
    // checking that we are not in the code mirror editor
    // this breaks cycle of form edits triggering document updates and vice versa
    if (editorSequenceView && hasAncestorWithId(document.activeElement, ID_COMMAND_DETAIL_PANE)) {
      const currentVal = editorSequenceView.state.sliceDoc(token.node.from, token.node.to);
      if (currentVal !== val) {
        editorSequenceView.dispatch(
          editorSequenceView.state.update({
            changes: { from: token.node.from, insert: val, to: token.node.to },
            userEvent: 'formView',
          }),
        );
      }
    }
  }

  function hasAncestorWithId(element: Element | null, id: string) {
    if (element === null) {
      return false;
    } else if (element.id === id) {
      return true;
    }
    return hasAncestorWithId(element.parentElement, id);
  }

  function addDefaultArgs(commandNode: SyntaxNode, argDefs: FswCommandArgument[]) {
    let insertPosition: undefined | number = undefined;
    if (editorSequenceView) {
      const str = ' ' + argDefs.map(argDef => fswCommandArgDefault(argDef, commandDictionary.enumMap)).join(' ');
      const argsNode = commandNode.getChild('Args');
      const stemNode = commandNode.getChild('Stem');
      if (stemNode) {
        insertPosition = argsNode?.to ?? stemNode.to;
        if (insertPosition !== undefined) {
          const stemAndMaybeArgs = editorSequenceView.state.sliceDoc(stemNode.from, insertPosition);
          const numEndingSpaces = stemAndMaybeArgs.length - stemAndMaybeArgs.trimEnd().length;
          let transaction = editorSequenceView.state.update({
            changes: {
              from: insertPosition - numEndingSpaces,
              insert: str,
              to: insertPosition,
            },
          });
          editorSequenceView.dispatch(transaction);
        }
      } else if (commandNode.name === TOKEN_REPEAT_ARG) {
        insertPosition = commandNode.to - 1;
        if (insertPosition !== undefined) {
          let transaction = editorSequenceView.state.update({
            changes: { from: insertPosition, insert: str, to: insertPosition },
          });
          editorSequenceView.dispatch(transaction);
        }
      }
    }
  }

  // When the type in the argument value is compatible with the argument definition,
  // provide a more restrictive editor to keep argument valid. Otherwise fall back on a string editor.

  // TODO
  // better handling of unclosed strings

  // {'integer_arg', 'float_arg', 'unsigned_arg', 'enum_arg', 'var_string_arg', 'repeat_arg'}
  // {'unsigned_arg', 'enum_arg', 'var_string_arg', 'float_arg'}
</script>

<div class="select-command-detail" id={ID_COMMAND_DETAIL_PANE}>
  {#if !!commandNode}
    <div>Selected Command</div>
    {#if !!commandDef}
      {#if !!timeTagNode}
        <div>Time Tag: {timeTagNode.text.trim()}</div>
      {/if}
      <div>{commandDef.stem}</div>
      <hr />
      <div class="select-command-argument-detail">
        {#each editorArgInfoArray as argInfo}
          <ArgEditor {argInfo} {commandDictionary} setInEditor={debounce(setInEditor, 2500)} {addDefaultArgs} />
        {/each}
        {#if missingArgDefArray.length}
          <AddMissingArgsButton
            setInEditor={() => {
              if (commandNode) {
                addDefaultArgs(commandNode, missingArgDefArray);
              }
            }}
          />
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .select-command-detail {
    padding: 10px;
    width: 100%;
  }
</style>
