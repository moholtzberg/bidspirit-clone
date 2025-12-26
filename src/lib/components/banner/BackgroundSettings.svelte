<script>
  import CollapsibleSection from './CollapsibleSection.svelte';
  
  let {
    bannerSettings = $bindable({}),
    backgroundTypes = [],
    updateGradientColor = () => {},
    isCollapsed = $bindable(true)
  } = $props();
</script>

<CollapsibleSection
  title="Background"
  bind:isCollapsed
  bgColor="bg-blue-50"
  borderColor="border-blue-200"
  hoverColor="hover:bg-blue-100"
>
  <div class="space-y-3">
    <div>
      <label for="background-type" class="block text-xs font-medium text-gray-700 mb-1">
        Background Type
      </label>
      <select
        id="background-type"
        bind:value={bannerSettings.backgroundType}
        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        {#each backgroundTypes as bgType}
          <option value={bgType.value}>{bgType.label}</option>
        {/each}
      </select>
    </div>
    
    {#if bannerSettings.backgroundType === 'solid'}
      <div>
        <label for="background-color" class="block text-xs font-medium text-gray-700 mb-1">
          Background Color
        </label>
        <div class="flex gap-2">
          <input
            id="background-color"
            type="color"
            bind:value={bannerSettings.backgroundColor}
            class="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
          />
          <input
            type="text"
            bind:value={bannerSettings.backgroundColor}
            placeholder="#F5F1E8"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>
    {/if}
    
    {#if bannerSettings.backgroundType === 'gradient'}
      <div>
        <label for="gradient-type" class="block text-xs font-medium text-gray-700 mb-1">
          Gradient Type
        </label>
        <select
          id="gradient-type"
          bind:value={bannerSettings.backgroundGradient.type}
          class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
        >
          <option value="linear">Linear</option>
          <option value="radial">Radial</option>
        </select>
        <div class="block text-xs font-medium text-gray-700 mb-2">Gradient Colors</div>
        <div class="grid grid-cols-2 gap-2">
          {#each bannerSettings.backgroundGradient.colors as color, index}
            <div>
              <label for="gradient-color-{index}" class="block text-xs text-gray-600 mb-1">Color {index + 1}</label>
              <div class="flex gap-2">
                <input
                  id="gradient-color-{index}"
                  type="color"
                  value={color}
                  oninput={(e) => updateGradientColor(index, e.target.value)}
                  class="h-10 w-16 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  oninput={(e) => updateGradientColor(index, e.target.value)}
                  class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    {#if bannerSettings.backgroundType === 'image'}
      <div>
        <label for="background-image-url" class="block text-xs font-medium text-gray-700 mb-1">
          Background Image URL
        </label>
        <input
          id="background-image-url"
          type="text"
          bind:value={bannerSettings.backgroundImageUrl}
          placeholder="https://example.com/image.jpg"
          class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
        />
        <p class="text-xs text-gray-500 mb-2">This image will be used as the full background</p>
        {#if bannerSettings.backgroundImageUrl}
          <div class="mt-2 p-2 bg-white rounded border border-gray-200">
            <img
              src={bannerSettings.backgroundImageUrl}
              alt="Background preview"
              class="w-full h-24 object-cover rounded"
              onerror={(e) => {
                e.target.style.display = 'none';
                const errorDiv = e.target.nextElementSibling;
                if (errorDiv) errorDiv.style.display = 'block';
              }}
            />
            <div class="hidden text-xs text-red-500 text-center py-2">Failed to load image</div>
          </div>
        {/if}
      </div>
    {/if}
    
    {#if bannerSettings.backgroundType === 'pattern'}
      <div>
        <label for="background-pattern" class="block text-xs font-medium text-gray-700 mb-1">
          Pattern Style
        </label>
        <select
          id="background-pattern"
          bind:value={bannerSettings.backgroundPattern}
          class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
        >
          <option value="none">None</option>
          <option value="dots">Dots</option>
          <option value="lines">Lines</option>
          <option value="grid">Grid</option>
          <option value="diagonal">Diagonal</option>
        </select>
        {#if bannerSettings.backgroundPattern !== 'none'}
          <label for="pattern-background-color" class="block text-xs font-medium text-gray-700 mb-1">
            Pattern Base Color
          </label>
          <div class="flex gap-2">
            <input
              id="pattern-background-color"
              type="color"
              bind:value={bannerSettings.backgroundColor}
              class="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              bind:value={bannerSettings.backgroundColor}
              placeholder="#F5F1E8"
              class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        {/if}
      </div>
    {/if}
  </div>
</CollapsibleSection>

