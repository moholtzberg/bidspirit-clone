<script>
  import VoiceNoteRecorder from './VoiceNoteRecorder.svelte';

  let {
    lotId = '',
    notes = $bindable([]),
    onRefresh = () => {}
  } = $props();

  let loading = $state(false);
  let error = $state(null);
  let expandedNoteId = $state(null);

  async function loadNotes() {
    loading = true;
    error = null;
    try {
      const response = await fetch(`/api/lots/${lotId}/notes`);
      if (!response.ok) {
        throw new Error('Failed to load notes');
      }
      notes = await response.json();
    } catch (err) {
      console.error('Error loading notes:', err);
      error = err.message || 'Failed to load notes';
    } finally {
      loading = false;
    }
  }

  async function handleNoteSaved(newNote) {
    await loadNotes();
    onRefresh();
  }

  async function deleteNote(noteId) {
    if (!confirm('Delete this note?')) return;

    try {
      const response = await fetch(`/api/lots/${lotId}/notes/${noteId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      await loadNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note');
    }
  }

  async function summarizeNote(noteId) {
    try {
      const response = await fetch(`/api/lots/${lotId}/notes/${noteId}/summarize`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to summarize note');
      }

      const result = await response.json();
      await loadNotes();
      onRefresh();
    } catch (err) {
      console.error('Error summarizing note:', err);
      alert('Failed to summarize note');
    }
  }

  $effect(() => {
    if (lotId) {
      loadNotes();
    }
  });
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <h4 class="text-sm font-semibold text-gray-900">Notes</h4>
    <button
      type="button"
      onclick={loadNotes}
      disabled={loading}
      class="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
    >
      {loading ? 'Loading...' : 'Refresh'}
    </button>
  </div>

  <VoiceNoteRecorder {lotId} onNoteSaved={handleNoteSaved} />

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
      {error}
    </div>
  {/if}

  {#if loading && notes.length === 0}
    <div class="text-center py-4 text-sm text-gray-500">Loading notes...</div>
  {:else if notes.length === 0}
    <div class="text-center py-4 text-sm text-gray-500">No notes yet. Record or upload a voice note to get started.</div>
  {:else}
    <div class="space-y-2 max-h-64 overflow-y-auto">
      {#each notes as note}
        <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <div class="text-xs text-gray-500 mb-1">
                {new Date(note.createdAt).toLocaleString()}
              </div>
              {#if note.audioUrl}
                <audio src={note.audioUrl} controls class="w-full mb-2" style="height: 32px;"></audio>
              {/if}
            </div>
            <div class="flex items-center gap-1">
              {#if note.transcription && !note.summary}
                <button
                  type="button"
                  onclick={() => summarizeNote(note.id)}
                  class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  title="Summarize"
                >
                  Summarize
                </button>
              {/if}
              <button
                type="button"
                onclick={() => deleteNote(note.id)}
                class="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>

          {#if note.transcription}
            <div class="text-sm text-gray-700 mb-2">
              <div class="font-medium mb-1">Transcription:</div>
              <div class="bg-white p-2 rounded border border-gray-200">
                {note.transcription}
              </div>
            </div>
          {/if}

          {#if note.summary}
            <div class="text-sm text-gray-700">
              <div class="font-medium mb-1">Summary:</div>
              <div class="bg-white p-2 rounded border border-gray-200">
                {note.summary}
              </div>
            </div>
          {/if}

          {#if note.content && !note.transcription && !note.summary}
            <div class="text-sm text-gray-700">
              <div class="bg-white p-2 rounded border border-gray-200">
                {note.content}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

