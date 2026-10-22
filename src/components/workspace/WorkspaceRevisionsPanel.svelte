<svelte:options immutable={true} />

<script lang="ts">
  import { Button } from '@nasa-jpl/stellar-svelte';
  import { LoaderCircle } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';
  import { activeDocument, activeDocumentIsDirty } from '../../stores/activeDocument';
  import { catchError } from '../../stores/console';
  import { getUserStore } from '../../stores/user';
  import { workspaceId } from '../../stores/workspaces';
  import type { UserStore } from '../../types/app';
  import type { WorkspaceFileRevision } from '../../types/workspace';
  import { downloadBlob } from '../../utilities/generic';
  import { showWorkspaceRevisionPreviewModal } from '../../utilities/modal';
  import { CompoundError, WorkspaceSaveConflictError } from '../../utilities/requests';
  import { showFailureToast, showSuccessToast } from '../../utilities/toast';
  import { WorkspaceApi, getDownloadOptionsForFile, separateFilenameFromPath } from '../../utilities/workspaces';
  import DownloadMenu from '../ui/DownloadMenu.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';
  import * as Sidebar from '../ui/Sidebar/index.js';
  import PanelHeader from './PanelHeader.svelte';

  export let doesWorkingCopyMatchRevision: boolean = false;
  export let filePath: string | null = null;
  /** Write permission. Not the same as read-only: a read-only file can still get a revision. */
  export let hasEditPermission: boolean = false;
  export let isReadOnly: boolean = false;
  export let isRevisionsLoading: boolean = false;
  export let revisionList: WorkspaceFileRevision[] = [];
  /** Reload the editor from the server after a restore changed (or failed to change) the working copy. */
  export let reloadWorkingCopy: () => Promise<void>;

  const dispatch = createEventDispatcher<{
    createdFileRevision: null;
  }>();
  const user: UserStore = getUserStore();

  let baseEtag: string | null = null;
  let commitMessage: string = '';
  let createDisabledReason: string | null = null;
  let isCreating: boolean = false;
  let latest: WorkspaceFileRevision | null = null;
  let notice: string | null = null;
  let restoreDisabledReason: string | null = null;
  let revisionStart: string = 'a';

  $: latest = revisionList[0] ?? null;

  $: baseFilename = filePath ? separateFilenameFromPath(filePath).filename : '';

  // Matching an older revision still allows a new one: returning to it is worth recording.
  $: createDisabledReason = !hasEditPermission
    ? "You don't have permission to create revisions."
    : $activeDocumentIsDirty
      ? 'Save your changes before creating a revision.'
      : doesWorkingCopyMatchRevision
        ? 'The saved copy already matches the latest revision.'
        : null;
  $: restoreDisabledReason = !hasEditPermission
    ? "You don't have permission to restore revisions."
    : isReadOnly
      ? 'This file is read-only, so revisions can be previewed but not restored.'
      : $activeDocumentIsDirty
        ? 'Save or discard your unsaved changes before restoring a revision.'
        : null;

  // The saved copy moves on open, save and restore (baseEtag). User-metadata edits happen in the Metadata tab, and
  // switching back remounts this panel. readOnly is runtime state, not part of a revision, so it never reloads.
  // baseEtag is pulled out so keystrokes (which change $activeDocument) don't refetch.
  $: baseEtag = $activeDocument.baseEtag;

  async function onCreate() {
    if (!filePath || createDisabledReason) {
      return;
    }
    isCreating = true;
    notice = null;
    try {
      // TODO: add `revisionStart` parameter to `createFileRevision`
      const revision = await WorkspaceApi.createFileRevision($workspaceId, filePath, baseEtag, commitMessage, $user);
      commitMessage = '';
      showSuccessToast(`Created revision ${revision}`);
    } catch (e) {
      // The revision exists but the list can't show it yet; a retry would create the next one.
      if (
        e instanceof CompoundError &&
        e.errors.some(({ type }) => (type as string) === 'WORKSPACE_REVISION_NOT_INDEXED')
      ) {
        notice = "Revision created, but it isn't available in the list yet.";
      } else {
        catchError('log', 'Failed to create revision', e as Error);
        showFailureToast('Failed to create revision');
      }
    } finally {
      isCreating = false;
      dispatch('createdFileRevision');
    }
  }

  async function onPreview(revision: WorkspaceFileRevision) {
    if (!filePath || !revisionList) {
      return;
    }
    const path = filePath;
    const workingCopyETag = $activeDocument.baseEtag;
    if (workingCopyETag) {
      await showWorkspaceRevisionPreviewModal({
        currentContent: $activeDocument.currentContent,
        currentLabel: $activeDocumentIsDirty ? 'Current editor (unsaved)' : 'Working copy',
        filePath: path,
        restore: revisionToRestore => restore(path, revisionToRestore, workingCopyETag),
        restoreDisabledReason,
        revision,
        type: $activeDocument.type,
        unrevisionedWarning:
          latest && !doesWorkingCopyMatchRevision
            ? 'The saved copy is not in any revision, so it will be replaced and lost.'
            : null,
        user: $user,
        workspaceId: $workspaceId,
      });
    }
  }

  /** Fetches a past revision's content and downloads it under the chosen name. */
  async function onDownloadRevision(revision: WorkspaceFileRevision, name: string) {
    if (!filePath) {
      return;
    }
    try {
      const content = await WorkspaceApi.getFileRevisionContent($workspaceId, filePath, revision.name, $user);
      downloadBlob(new Blob([content], { type: 'text/plain' }), name);
    } catch (e) {
      catchError('log', 'Failed to download revision', e as Error);
      showFailureToast('Failed to download revision');
    }
  }

  /** Runs inside the preview modal, which blocks the editor until this (including the reload) settles. */
  async function restore(path: string, revision: WorkspaceFileRevision, workingCopyETag: string) {
    if ($activeDocumentIsDirty || path !== filePath) {
      return;
    }
    notice = null;
    try {
      await WorkspaceApi.restoreFileRevision($workspaceId, path, revision.name, workingCopyETag, $user);
      showSuccessToast(`Restored revision ${revision.name}`);
    } catch (e) {
      if (e instanceof WorkspaceSaveConflictError) {
        notice = `The working copy changed since this list loaded, so revision ${revision.name} was not restored. Review the refreshed state and try again.`;
      } else {
        catchError('log', 'Failed to restore revision', e as Error);
        showFailureToast('Failed to restore revision');
        return;
      }
    }
    // Success or 412: the server state differs from what we showed, so reload the (clean) editor and this list.
    await reloadWorkingCopy();
  }

  /** Grows a textarea's height to fit its content as the user types. */
  function autosize(node: HTMLTextAreaElement) {
    function resize() {
      node.style.height = 'auto';
      node.style.height = `${node.scrollHeight}px`;
    }
    resize();
    node.addEventListener('input', resize);
    return {
      destroy() {
        node.removeEventListener('input', resize);
      },
    };
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
    });
  }
</script>

<div class="grid h-full grid-rows-[min-content_auto]">
  <Sidebar.Header className="p-0">
    <PanelHeader>
      <SectionTitle>Revisions</SectionTitle>
      {#if isRevisionsLoading}<LoaderCircle class="animate-spin text-muted-foreground" size={14} />{/if}
    </PanelHeader>
  </Sidebar.Header>
  <Sidebar.Content className="h-full overflow-auto">
    <Sidebar.Group className="h-full p-0">
      <Sidebar.GroupContent className="h-full">
        <Sidebar.Menu className="h-full text-xs">
          {#if !filePath}
            <div class="p-3 text-muted-foreground">Open a file to see its revisions.</div>
          {:else}
            <div class="flex flex-col gap-4 p-3">
              <section class="flex flex-col gap-1" aria-label="Working copy">
                <span class="font-medium uppercase tracking-wide text-muted-foreground">Working copy</span>
                <label class="flex flex-col gap-1" for="revision-commit-message">
                  <span>Revision description <span class="text-muted-foreground">(optional)</span></span>
                  <textarea
                    id="revision-commit-message"
                    bind:value={commitMessage}
                    use:autosize
                    class="w-full resize-none overflow-hidden rounded border border-border bg-background p-2 text-xs"
                    placeholder="Describe this revision"
                    rows={1}
                  />
                </label>
                {#if $activeDocumentIsDirty}
                  <div class="text-amber-700 dark:text-amber-400">
                    <span class="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
                    Unsaved editor changes
                  </div>
                {/if}
                <div class="flex min-h-[26px] items-center gap-2">
                  <Button class="w-fit" disabled={!!createDisabledReason || isCreating} on:click={onCreate}>
                    {isCreating ? 'Creating…' : 'Create revision'}
                  </Button>
                  {#if !latest}
                    <div class="grid h-full grid-cols-[auto_1fr] items-center gap-2">
                      <span>starting with revision</span>
                      <input
                        id="revision-start"
                        type="text"
                        bind:value={revisionStart}
                        size={Math.max(1, revisionStart.length)}
                        class="rounded border border-border bg-background p-1 text-xs"
                      />
                    </div>
                  {/if}
                </div>
                {#if createDisabledReason}
                  <div class="text-muted-foreground">{createDisabledReason}</div>
                {/if}
                {#if notice}
                  <div class="rounded border border-border bg-muted p-2" role="status">{notice}</div>
                {/if}
              </section>
              <div class="flex flex-col gap-1">
                <span class="font-medium text-muted-foreground">History</span>
                {#if latest}
                  <ul class="flex flex-col overflow-hidden rounded border border-border" aria-label="Revisions">
                    {#each revisionList as revision, i (revision.name)}
                      <li class={i > 0 ? 'border-t border-border' : ''}>
                        <div class="flex items-stretch">
                          <button
                            class="flex w-full items-baseline gap-3 px-2 py-1.5 text-left hover:bg-muted"
                            title="Preview revision {revision.name}"
                            on:click={() => onPreview(revision)}
                          >
                            <span class="w-6 flex-none text-sm font-semibold">{revision.name}</span>
                            <span class="flex min-w-0 flex-col text-muted-foreground">
                              <span class="truncate">{revision.createdBy ?? 'Unknown'}</span>
                              <span>{formatDate(revision.createdAt)}</span>
                            </span>
                          </button>
                          <DownloadMenu
                            align="end"
                            variant="ghost"
                            className="flex-none px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                            label="Download revision {revision.name}"
                            options={getDownloadOptionsForFile(baseFilename, true, revision.name)}
                            onDownload={name => onDownloadRevision(revision, name)}
                          />
                        </div>
                      </li>
                    {/each}
                  </ul>
                {:else}
                  <div class="text-muted-foreground">No revisions yet.</div>
                {/if}
              </div>
            </div>
          {/if}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
</div>
