<script>
  import CollapsibleSection from './CollapsibleSection.svelte';
  
  let {
    bannerSettings = $bindable({}),
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
  <div class="space-y-2">
    <div>
      <label for="title-en" class="block text-xs font-medium text-gray-700 mb-1">
        Title (English)
      </label>
      <input
        id="title-en"
        type="text"
        bind:value={bannerSettings.title}
        placeholder="Banner title"
        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>
    
    <div>
      <label for="title-he" class="block text-xs font-medium text-gray-700 mb-1">
        Title (Hebrew)
      </label>
      <input
        id="title-he"
        type="text"
        bind:value={bannerSettings.titleHebrew}
        placeholder="כותרת בעברית"
        dir="rtl"
        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>
    
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
</CollapsibleSection>

