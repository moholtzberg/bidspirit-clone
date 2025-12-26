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
      <label for="font-size" class="block text-xs font-medium text-gray-700 mb-1">
        Font Size: {bannerSettings.fontSize}px
      </label>
      <input
        id="font-size"
        type="range"
        min="24"
        max="72"
        bind:value={bannerSettings.fontSize}
        class="w-full"
      />
    </div>
    
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
    
    <div>
      <label for="text-align" class="block text-xs font-medium text-gray-700 mb-1">
        Text Alignment
      </label>
      <select
        id="text-align"
        bind:value={bannerSettings.textAlign}
        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="left">Left</option>
        <option value="center">Center</option>
        <option value="right">Right</option>
      </select>
    </div>
    
    <div>
      <label for="subtitle-en" class="block text-xs font-medium text-gray-700 mb-1">
        Subtitle (English)
      </label>
      <textarea
        id="subtitle-en"
        bind:value={bannerSettings.subtitle}
        placeholder="Banner subtitle"
        rows="2"
        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      ></textarea>
    </div>
    
    <div>
      <label for="subtitle-he" class="block text-xs font-medium text-gray-700 mb-1">
        Subtitle (Hebrew)
      </label>
      <textarea
        id="subtitle-he"
        bind:value={bannerSettings.subtitleHebrew}
        placeholder="תת-כותרת בעברית"
        rows="2"
        dir="rtl"
        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      ></textarea>
    </div>
    
    <div>
      <label for="year-en" class="block text-xs font-medium text-gray-700 mb-1">
        Year (English)
      </label>
      <input
        id="year-en"
        type="text"
        bind:value={bannerSettings.yearEnglish}
        placeholder="e.g., 1890"
        oninput={(e) => {
          bannerSettings.yearEnglish = e.target.value;
          if (bannerSettings.yearEnglish) {
            bannerSettings.yearHebrew = convertToHebrewYear(bannerSettings.yearEnglish);
          } else {
            bannerSettings.yearHebrew = '';
          }
        }}
        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>
    
    <div>
      <label for="year-he" class="block text-xs font-medium text-gray-700 mb-1">
        Year (Hebrew)
      </label>
      <input
        id="year-he"
        type="text"
        bind:value={bannerSettings.yearHebrew}
        placeholder="Auto-filled from English year, or enter manually"
        dir="rtl"
        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
      <p class="text-xs text-gray-500 mt-1">Auto-converts from English year, or enter manually</p>
    </div>

  </div>
</CollapsibleSection>

