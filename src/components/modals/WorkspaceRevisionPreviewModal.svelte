<svelte:options immutable={true} />

<script lang="ts">
  import { Button } from '@nasa-jpl/stellar-svelte';
  import { LoaderCircle, TriangleAlert } from 'lucide-svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import type { WorkspaceContentType } from '../../enums/workspace';
  import type { User } from '../../types/app';
  import type { WorkspaceFileRevision } from '../../types/workspace';
  import { downloadBlob } from '../../utilities/generic';
  import {
    getDownloadOptionsForFile,
    getVersionedFileName,
    separateFilenameFromPath,
    WorkspaceApi,
  } from '../../utilities/workspaces';
  import DownloadMenu from '../ui/DownloadMenu.svelte';
  import WorkspaceDiffViewer from '../workspace/WorkspaceDiffViewer.svelte';
  import Modal from './Modal.svelte';
  import ModalContent from './ModalContent.svelte';
  import ModalHeader from './ModalHeader.svelte';

  /** One side of the comparison: either a specific revision, or the (not-yet-revisioned) working copy. */
  type Side = { kind: 'workingCopy' } | { kind: 'revision'; revision: WorkspaceFileRevision };

  interface SideState {
    content: string;
    error: boolean;
    loading: boolean;
    metadata: Record<string, unknown> | null;
  }

  export let currentContent: string;
  /** "Working copy", or "Current editor (unsaved)" when comparing against unsaved edits. */
  export let currentLabel: string;
  export let filePath: string;
  /** Restores the given revision into the working copy. The modal stays open, blocking the editor, until it settles. */
  export let restore: (revision: WorkspaceFileRevision) => Promise<void>;
  /** Why Restore is unavailable regardless of which sides are selected; null when permission/dirty state allow it. */
  export let restoreDisabledReason: string | null = null;
  /** The revision that was clicked to open this modal; preselected on the right. */
  export let revision: WorkspaceFileRevision;
  export let type: WorkspaceContentType | null = null;
  /** Extra confirm-step warning, e.g. saved changes that no revision holds. */
  export let unrevisionedWarning: string | null = null;
  export let user: User | null = null;
  export let workspaceId: number;

  const dispatch = createEventDispatcher<{ close: void }>();
  // Runtime/derived fields: not part of a revision, so not a difference.
  const unversionedKeys = ['lastEditedAt', 'lastEditedBy', 'readOnly'];
  const emptySideState: SideState = { content: '', error: false, loading: true, metadata: null };

  let changedLines: number = 0;
  let confirming: boolean = false;
  let effectiveRestoreDisabledReason: string | null;
  let filename: string = '';
  let isLoading: boolean;
  let isRestoring: boolean = false;
  let leftDownloadOptions: ReturnType<typeof getDownloadOptionsForFile>;
  let leftLabel: string;
  let leftSide: Side = { kind: 'workingCopy' };
  let leftState: SideState = { ...emptySideState };
  let loadError: boolean;
  let metadataDiffers: boolean;
  let revisions: WorkspaceFileRevision[] = [];
  let revisionToRestore: WorkspaceFileRevision | null;
  let rightDownloadOptions: ReturnType<typeof getDownloadOptionsForFile>;
  let rightLabel: string;
  let rightRevision: WorkspaceFileRevision = revision;
  let rightState: SideState = { ...emptySideState };

  $: ({ filename } = separateFilenameFromPath(filePath));
  $: isLoading = leftState.loading || rightState.loading;
  $: loadError = leftState.error || rightState.error;
  $: metadataDiffers =
    !isLoading && !loadError && canonical(leftState.metadata) !== canonical(rightState.metadata ?? {});
  $: revisionToRestore = leftSide.kind === 'workingCopy' ? rightRevision : null;
  $: effectiveRestoreDisabledReason =
    restoreDisabledReason ??
    (!revisionToRestore ? 'Restoring is only available when comparing against the working copy.' : null);
  $: leftLabel = sideLabel(leftSide);
  $: rightRevision = revision;
  $: rightLabel = getVersionedFileName(filename, rightRevision.name);
  $: leftDownloadOptions = getDownloadOptionsForFile(
    filename,
    leftSide.kind === 'revision',
    leftSide.kind === 'revision' ? leftSide.revision.name : null,
  );
  $: rightDownloadOptions = getDownloadOptionsForFile(filename, true, rightRevision.name);

  function sideLabel(side: Side): string {
    return side.kind === 'workingCopy'
      ? `${filename} (${currentLabel})`
      : getVersionedFileName(filename, side.revision.name);
  }

  async function loadRevisionsFor(filePath: string): Promise<WorkspaceFileRevision[]> {
    try {
      const { revisions } = await WorkspaceApi.getFileRevisionList(workspaceId, filePath, user);
      return revisions;
    } catch {
      return [];
    }
  }

  function sideKey(side: Side): string {
    return side.kind === 'workingCopy' ? 'workingCopy' : side.revision.name;
  }

  function sideFromKey(key: string): Side {
    if (key === 'workingCopy') {
      return { kind: 'workingCopy' };
    }
    const found = revisions.find(r => r.name === key);
    return found ? { kind: 'revision', revision: found } : { kind: 'workingCopy' };
  }

  async function loadRevisionState(rev: WorkspaceFileRevision): Promise<SideState> {
    try {
      const [content, { metadata }] = await Promise.all([
        WorkspaceApi.getFileRevisionContent(workspaceId, filePath, rev.name, user),
        WorkspaceApi.getFileRevision(workspaceId, filePath, rev.name, user),
      ]);
      return { content, error: false, loading: false, metadata };
    } catch {
      return { content: '', error: true, loading: false, metadata: null };
    }
  }

  async function loadSide(side: Side): Promise<SideState> {
    if (side.kind === 'workingCopy') {
      try {
        const metadata = await WorkspaceApi.getFileMetadata(workspaceId, filePath, user);
        return { content: currentContent, error: false, loading: false, metadata };
      } catch {
        return { content: '', error: true, loading: false, metadata: null };
      }
    }
    return loadRevisionState(side.revision);
  }

  async function selectLeft(side: Side) {
    leftSide = side;
    leftState = { ...emptySideState };
    leftState = await loadSide(side);
  }

  function canonical(value: unknown, top = true): string {
    if (Array.isArray(value)) {
      return `[${value.map(v => canonical(v, false)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      const entries = Object.entries(value)
        .filter(([key]) => !top || !unversionedKeys.includes(key))
        .sort(([a], [b]) => a.localeCompare(b));
      return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v, false)}`).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
    });
  }

  function close() {
    if (!isRestoring) {
      dispatch('close');
    }
  }

  async function onRestore() {
    if (isRestoring || !revisionToRestore) {
      return;
    }
    isRestoring = true;
    try {
      await restore(revisionToRestore);
    } finally {
      isRestoring = false;
      dispatch('close');
    }
  }

  /** Downloads a side's already-loaded content under the given name (plain, or with its revision letter). */
  function onDownloadSide(state: SideState, name: string) {
    if (state.loading || state.error) {
      return;
    }
    downloadBlob(new Blob([state.content], { type: 'text/plain' }), name);
  }

  onMount(async () => {
    revisions = await loadRevisionsFor(filePath);
    selectLeft(leftSide);
    rightState = await loadRevisionState(rightRevision);
  });
</script>

<Modal height="min(680px, 85vh)" width="min(1200px, 92vw)" on:close={close}>
  <ModalHeader on:close={close}>Comparing {leftLabel} with {rightLabel}</ModalHeader>
  <ModalContent style="display: flex; flex-direction: column; gap: 8px; overflow: hidden;">
    <div class="flex flex-none flex-wrap items-center gap-2 text-sm">
      <span class="text-muted-foreground">Compare</span>
      <select
        class="st-select"
        value={sideKey(leftSide)}
        on:change={e => selectLeft(sideFromKey(e.currentTarget.value))}
      >
        <option value="workingCopy">{currentLabel}</option>
        {#each revisions as rev (rev.name)}
          <option value={rev.name}>Revision {rev.name} · {formatDate(rev.createdAt)}</option>
        {/each}
      </select>
      <DownloadMenu
        align="start"
        className="px-2"
        size="icon"
        disabled={leftState.loading || leftState.error}
        label="Download {leftLabel}"
        options={leftDownloadOptions}
        onDownload={name => onDownloadSide(leftState, name)}
      />
      <span class="text-muted-foreground">with</span>
      <span class="font-medium">{rightLabel}</span>
      <DownloadMenu
        align="start"
        className="px-2"
        size="icon"
        disabled={rightState.loading || rightState.error}
        label="Download {rightLabel}"
        options={rightDownloadOptions}
        onDownload={name => onDownloadSide(rightState, name)}
      />
    </div>
    <div class="st-typography-body flex-none text-muted-foreground">
      {#if !isLoading && !loadError}
        {changedLines === 0
          ? `${metadataDiffers ? 'Content is' : 'No'} differences`
          : `${changedLines} changed ${changedLines === 1 ? 'line' : 'lines'}`}
        {#if metadataDiffers}· File metadata also differs.{/if}
      {/if}
    </div>
    <div class="flex min-h-0 flex-auto overflow-hidden rounded border">
      {#if isLoading}
        <div class="flex w-full items-center justify-center gap-2 text-muted-foreground">
          <LoaderCircle class="animate-spin" size={16} /> Loading…
        </div>
      {:else if loadError}
        <div class="flex w-full items-center justify-center gap-2 text-muted-foreground">
          <TriangleAlert size={16} /> Couldn't load one of these revisions.
        </div>
      {:else}
        <WorkspaceDiffViewer
          theirs={leftState.content}
          theirsLabel={leftLabel}
          mine={rightState.content}
          mineLabel={rightLabel}
          {type}
          on:stats={e => (changedLines = e.detail.changedLines)}
        />
      {/if}
    </div>
  </ModalContent>
  <div class="flex flex-none items-center justify-end gap-3 rounded-b border-t bg-muted px-4 py-3">
    {#if confirming && revisionToRestore}
      <div class="mr-auto flex flex-col text-sm">
        <span class="font-semibold">Restore revision {revisionToRestore.name}?</span>
        <span class="text-muted-foreground">
          The working copy will be replaced with revision {revisionToRestore.name}. Existing revisions will not be
          changed.
        </span>
        {#if unrevisionedWarning}
          <span class="text-destructive">{unrevisionedWarning}</span>
        {/if}
      </div>
      <Button variant="outline" disabled={isRestoring} on:click={() => (confirming = false)}>Cancel</Button>
      <Button variant="destructive" disabled={isRestoring} on:click={onRestore}>
        {isRestoring ? 'Restoring…' : 'Restore'}
      </Button>
    {:else}
      {#if effectiveRestoreDisabledReason}
        <span class="mr-auto text-sm text-muted-foreground">{effectiveRestoreDisabledReason}</span>
      {/if}
      <Button variant="outline" on:click={close}>Close</Button>
      <Button
        disabled={!!effectiveRestoreDisabledReason || isLoading || loadError}
        on:click={() => (confirming = true)}
      >
        Restore…
      </Button>
    {/if}
  </div>
</Modal>
