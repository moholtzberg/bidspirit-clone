<script>
  import CollapsibleSection from './CollapsibleSection.svelte';
  
  let {
    bannerSettings = $bindable({}),
    fonts = [],
    hebrewFonts = [],
    convertToHebrewYear = () => '',
    isCollapsed = $bindable(true)
  } = $props();
</script>

<CollapsibleSection
  title="Typography"
  bind:isCollapsed
  bgColor="bg-gray-50"
  borderColor="border-gray-200"
  hoverColor="hover:bg-gray-100"
>
  <div class="space-y-3">
    <div>
      <label for="font-family" class="block text-xs font-medium text-gray-700 mb-1">
        English Font
      </label>
      <select
        id="font-family"
        bind:value={bannerSettings.fontFamily}
        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        {#each fonts as font}
          <option value={font.value}>{font.name}</option>
        {/each}
      </select>
    </div>
    
    <div>
      <label for="hebrew-font-family" class="block text-xs font-medium text-gray-700 mb-1">
        Hebrew Font
      </label>
      <select
        id="hebrew-font-family"
        bind:value={bannerSettings.hebrewFontFamily}
        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        {#each hebrewFonts as font}
          <option value={font.value}>{font.name}</option>
        {/each}
      </select>
    </div>
    
    <div>
      <label for="text-color" class="block text-xs font-medium text-gray-700 mb-1">
        Text Color
      </label>
      <input
        id="text-color"
        type="color"
        bind:value={bannerSettings.textColor}
        class="w-full h-12 border border-gray-300 rounded-lg"
      />
    </div>
  </div>
</CollapsibleSection>

