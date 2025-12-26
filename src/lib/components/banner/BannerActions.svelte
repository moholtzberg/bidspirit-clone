<script>
  let {
    generatingBanner = false,
    generatedBannerUrl = null,
    onGenerate = () => {},
    onDownload = () => {},
    canGenerate = true
  } = $props();
</script>

<div class="space-y-2 mt-3">
  <button
    onclick={onGenerate}
    disabled={generatingBanner || !canGenerate}
    class="w-full bg-purple-600 text-white py-2 text-sm rounded hover:bg-purple-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
  >
    {generatingBanner ? 'Generating...' : 'Generate Banner'}
  </button>
  
  {#if generatedBannerUrl}
    <button
      onclick={onDownload}
      class="w-full bg-green-600 text-white py-2 text-sm rounded hover:bg-green-700 transition-colors font-semibold"
    >
      Download Banner
    </button>
  {/if}
</div>

