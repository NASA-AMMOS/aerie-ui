<svelte:options immutable={true} />

<script lang="ts">
  import type { SyntaxNode } from '@lezer/common';
  import type { CommandDictionary, FswCommandArgument } from '@nasa-jpl/aerie-ampcs';
  import EnumEditor from './enum-editor.svelte';
  import ExtraArgumentEditor from './extra-argument-editor.svelte';
  import StringEditor from './string-editor.svelte';
  import NumEditor from './num-editor.svelte';
  import { isNumberArg, type ArgTextDef, isFswCommandArgumentRepeat, isFswCommandArgumentVarString, getMissingArgDefs } from './utils';
  import AddMissingArgsButton from './add-missing-args-button.svelte';
  import ArgTitle from './arg-title.svelte';

  export let argInfo: ArgTextDef;
  export let commandDictionary: CommandDictionary;
  export let setInEditor: (token: SyntaxNode, val: string) => void;
  export let addDefaultArgs: (commandNode: SyntaxNode, argDefs: FswCommandArgument[]) => void;
</script>

{#if !argInfo.argDef}
  {#if argInfo.text}
    <div title="Unknown Argument">Unknown Argument</div>
    <ExtraArgumentEditor
      initVal={argInfo.text}
      setInEditor={() => {
        if (argInfo.node) {
          setInEditor(argInfo.node, '');
        }
      }}
    />
  {/if}
{:else}
  <ArgTitle argDef={argInfo.argDef} />
  {#if argInfo.argDef.arg_type === 'enum' && argInfo.node?.name === 'String'}
    <EnumEditor
      {commandDictionary}
      argDef={argInfo.argDef}
      initVal={argInfo.text ?? ''}
      setInEditor={(val) => {
        if (argInfo.node) {
          setInEditor(argInfo.node, val);
        }
      }}
    />
  {:else if isNumberArg(argInfo.argDef) && argInfo.node?.name === 'Number'}
    <NumEditor
      argDef={argInfo.argDef}
      initVal={argInfo.text ?? (argInfo.argDef.default_value ?? 0).toString()}
      setInEditor={(val) => {
        if (argInfo.node) {
          setInEditor(argInfo.node, val);
        }
      }}
    />
  {:else if isFswCommandArgumentVarString(argInfo.argDef)}
    <StringEditor
      argDef={argInfo.argDef}
      initVal={argInfo.text ?? ''}
      setInEditor={(val) => {
        if (argInfo.node) {
          setInEditor(argInfo.node, val);
        }
      }}
    />
  {:else if isFswCommandArgumentRepeat(argInfo.argDef) && !!argInfo.children}
    {#each argInfo.children as childArgInfo }
      {#if childArgInfo.node}
        <svelte:self
          argInfo={childArgInfo}
          {commandDictionary}
          {setInEditor}
          {addDefaultArgs}
        />
      {/if}
    {/each}
    {#if argInfo.children.find(childArgInfo => !childArgInfo.node)}
      <AddMissingArgsButton
        setInEditor={() => {
          if (argInfo.node && argInfo.children) {
            addDefaultArgs(argInfo.node, getMissingArgDefs(argInfo.children));
          }
        }}
      />
    {/if}
  {:else}
    <div>Unexpected value for definition</div>
  {/if}
{/if}
