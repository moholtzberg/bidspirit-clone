<script>
  import CollapsibleSection from './CollapsibleSection.svelte';
  
  let {
    bannerSettings = $bindable({}),
    convertToHebrewYear = () => '',
    isCollapsed = $bindable(true)
  } = $props();
</script>

<CollapsibleSection
  title="Text Content"
  bind:isCollapsed
  bgColor="bg-green-50"
  borderColor="border-green-200"
  hoverColor="hover:bg-green-100"
>
  <div class="space-y-4">
    <!-- Title English -->
    <div class="space-y-2">
      <label for="title-en" class="block text-xs font-medium text-gray-700 mb-1">
        Title (English)
      </label>
      <div class="grid grid-cols-3 gap-2">
        <input
          id="title-en"
          type="text"
          bind:value={bannerSettings.title}
          placeholder="Banner title"
          class="col-span-2 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <div class="flex gap-1">
          <input
            type="number"
            bind:value={bannerSettings.titleEnglishFontSize}
            min="12"
            max="120"
            step="1"
            class="w-16 px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Font Size"
          />
          <select
            bind:value={bannerSettings.titleEnglishAlign}
            class="flex-1 px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Text Alignment"
          >
            <option value="left">L</option>
            <option value="center">C</option>
            <option value="right">R</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Title Hebrew -->
    <div class="space-y-2">
      <label for="title-he" class="block text-xs font-medium text-gray-700 mb-1">
        Title (Hebrew)
      </label>
      <div class="grid grid-cols-3 gap-2">
        <input
          id="title-he"
          type="text"
          bind:value={bannerSettings.titleHebrew}
          placeholder="כותרת בעברית"
          dir="rtl"
          class="col-span-2 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <div class="flex gap-1">
          <input
            type="number"
            bind:value={bannerSettings.titleHebrewFontSize}
            min="12"
            max="120"
            step="1"
            class="w-16 px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Font Size"
          />
          <select
            bind:value={bannerSettings.titleHebrewAlign}
            class="flex-1 px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Text Alignment"
          >
            <option value="left">L</option>
            <option value="center">C</option>
            <option value="right">R</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Subtitle English -->
    <div class="space-y-2">
      <label for="subtitle-en" class="block text-xs font-medium text-gray-700 mb-1">
        Subtitle (English)
      </label>
      <div class="grid grid-cols-3 gap-2">
        <textarea
          id="subtitle-en"
          bind:value={bannerSettings.subtitle}
          placeholder="Banner subtitle"
          rows="2"
          class="col-span-2 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        ></textarea>
        <div class="flex gap-1">
          <input
            type="number"
            bind:value={bannerSettings.subtitleEnglishFontSize}
            min="12"
            max="120"
            step="1"
            class="w-16 px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Font Size"
          />
          <select
            bind:value={bannerSettings.subtitleEnglishAlign}
            class="flex-1 px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Text Alignment"
          >
            <option value="left">L</option>
            <option value="center">C</option>
            <option value="right">R</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Subtitle Hebrew -->
    <div class="space-y-2">
      <label for="subtitle-he" class="block text-xs font-medium text-gray-700 mb-1">
        Subtitle (Hebrew)
      </label>
      <div class="grid grid-cols-3 gap-2">
        <textarea
          id="subtitle-he"
          bind:value={bannerSettings.subtitleHebrew}
          placeholder="תת-כותרת בעברית"
          rows="2"
          dir="rtl"
          class="col-span-2 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        ></textarea>
        <div class="flex gap-1">
          <input
            type="number"
            bind:value={bannerSettings.subtitleHebrewFontSize}
            min="12"
            max="120"
            step="1"
            class="w-16 px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Font Size"
          />
          <select
            bind:value={bannerSettings.subtitleHebrewAlign}
            class="flex-1 px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Text Alignment"
          >
            <option value="left">L</option>
            <option value="center">C</option>
            <option value="right">R</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Year English -->
    <div class="space-y-2">
      <label for="year-en" class="block text-xs font-medium text-gray-700 mb-1">
        Year (English)
      </label>
      <div class="grid grid-cols-3 gap-2">
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
          class="col-span-2 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <div class="flex gap-1">
          <input
            type="number"
            bind:value={bannerSettings.yearEnglishFontSize}
            min="12"
            max="120"
            step="1"
            class="w-16 px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Font Size"
          />
          <select
            bind:value={bannerSettings.yearEnglishAlign}
            class="flex-1 px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Text Alignment"
          >
            <option value="left">L</option>
            <option value="center">C</option>
            <option value="right">R</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Year Hebrew -->
    <div class="space-y-2">
      <label for="year-he" class="block text-xs font-medium text-gray-700 mb-1">
        Year (Hebrew)
      </label>
      <div class="grid grid-cols-3 gap-2">
        <input
          id="year-he"
          type="text"
          bind:value={bannerSettings.yearHebrew}
          placeholder="Auto-filled from English year, or enter manually"
          dir="rtl"
          class="col-span-2 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <div class="flex gap-1">
          <input
            type="number"
            bind:value={bannerSettings.yearHebrewFontSize}
            min="12"
            max="120"
            step="1"
            class="w-16 px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Font Size"
          />
          <select
            bind:value={bannerSettings.yearHebrewAlign}
            class="flex-1 px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Text Alignment"
          >
            <option value="left">L</option>
            <option value="center">C</option>
            <option value="right">R</option>
          </select>
        </div>
      </div>
      <p class="text-xs text-gray-500">Auto-converts from English year, or enter manually</p>
    </div>
    
    <div class="pt-2 border-t border-gray-200">
      <div class="space-y-2">
        <div>
          <label for="category-en" class="block text-xs font-medium text-gray-700 mb-1">
            Category (English)
          </label>
          <input
            id="category-en"
            type="text"
            bind:value={bannerSettings.category}
            placeholder="e.g., Paintings, Sculpture, etc."
            class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label for="category-he" class="block text-xs font-medium text-gray-700 mb-1">
            Category (Hebrew)
          </label>
          <input
            id="category-he"
            type="text"
            bind:value={bannerSettings.categoryHebrew}
            placeholder="קטגוריה בעברית"
            dir="rtl"
            class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label for="ribbon-color" class="block text-xs font-medium text-gray-700 mb-1">
            Ribbon Color
          </label>
          <div class="flex gap-2">
            <input
              id="ribbon-color"
              type="color"
              bind:value={bannerSettings.ribbonColor}
              class="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              bind:value={bannerSettings.ribbonColor}
              placeholder="#DC2626"
              class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <p class="text-xs text-gray-500 mt-1">Color of the category ribbon (text will be white)</p>
        </div>
        
        <div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={bannerSettings.showBottomBorder}
              class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span class="text-xs font-medium text-gray-700">Show Bottom Border</span>
          </label>
          <p class="text-xs text-gray-500 mt-1 ml-6">Display auction house name, auction name, and date at the bottom</p>
        </div>

        {#if bannerSettings.showBottomBorder}
          <div>
            <label for="bottom-border-color" class="block text-xs font-medium text-gray-700 mb-1">
              Bottom Border Color
            </label>
            <div class="flex gap-2">
              <input
                id="bottom-border-color"
                type="color"
                bind:value={bannerSettings.bottomBorderColor}
                class="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                bind:value={bannerSettings.bottomBorderColor}
                placeholder="#2563EB"
                class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</CollapsibleSection>
