<script>
  let {
    lotId = '',
    lot = null, // { title, description, images, notes }
    onGenerated = () => {}
  } = $props();

  const lotHasImages = (lot?.images?.length || 0) > 0;
  let includeImages = $state(lotHasImages);
  let generating = $state(false);
  let error = $state(null);
  let result = $state(null);
  let generateType = $state('title'); // 'title', 'description', or 'both'

  async function generate() {
    generating = true;
    error = null;
    result = null;

    try {
      const response = await fetch(`/api/lots/${lotId}/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: generateType,
          includeImages: includeImages && lotHasImages,
          context: {
            currentTitle: lot?.title || '',
            currentDescription: lot?.description || '',
            notes: lot?.notes || [],
            hasImages: (lot?.images?.length || 0) > 0
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate' }));
        throw new Error(errorData.error || 'Failed to generate');
      }

      result = await response.json();
    } catch (err) {
      console.error('Error generating:', err);
      error = err.message || 'Failed to generate. Please try again.';
    } finally {
      generating = false;
    }
  }

  function applyResult(field) {
    if (!result) return;
    
    const value = result[field];
    if (value && onGenerated) {
      onGenerated({ [field]: value });
    }
  }
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <h4 class="text-sm font-semibold text-gray-900">AI Generator</h4>
  </div>

  <div class="space-y-2">
    <div>
      <label class="block text-xs font-medium text-gray-700 mb-1">Generate:</label>
      <select
        bind:value={generateType}
        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="title">Title Only</option>
        <option value="description">Description Only</option>
        <option value="both">Title & Description</option>
      </select>
    </div>

    <div class="flex items-start gap-2 text-xs text-gray-700">
      <input
        id="include-images"
        type="checkbox"
        bind:checked={includeImages}
        disabled={!lotHasImages || generating}
        class="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <label for="include-images" class="space-y-0.5">
        <div class="font-medium">Let AI analyze lot images</div>
        <div class="text-gray-500">
          {lotHasImages
            ? 'Sends images for vision + OCR to improve empty listings.'
            : 'No images available for this lot yet.'}
        </div>
      </label>
    </div>

    <button
      type="button"
      onclick={generate}
      disabled={generating}
      class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {generating ? 'Generating...' : 'Generate with AI'}
    </button>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
      {error}
    </div>
  {/if}

  {#if result}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
      {#if result.title}
        <div>
          <div class="text-xs font-medium text-gray-700 mb-1">Generated Title:</div>
          <div class="bg-white p-2 rounded border border-gray-200 text-sm text-gray-900 mb-2">
            {result.title}
          </div>
          <button
            type="button"
            onclick={() => applyResult('title')}
            class="w-full px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
          >
            Use This Title
          </button>
        </div>
      {/if}

      {#if result.description}
        <div>
          <div class="text-xs font-medium text-gray-700 mb-1">Generated Description:</div>
          <div class="bg-white p-2 rounded border border-gray-200 text-sm text-gray-900 mb-2 max-h-32 overflow-y-auto">
            {result.description}
          </div>
          <button
            type="button"
            onclick={() => applyResult('description')}
            class="w-full px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
          >
            Use This Description
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

