<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  let auction = $state(null);
  let lots = $state([]);
  let loading = $state(true);
  let selectedLotId = $state('');
  let selectedLot = $state(null);
  
  // Ginzey America color scheme
  const ginzeyColors = {
    antiquePaper: '#F5F1E8', // Base color - antique paper
    red: '#C41E3A', // Secondary color - red
    blue: '#1E3A8A', // Secondary color - blue
    darkText: '#2C1810', // Dark brown for text on antique paper
    lightText: '#FFFFFF' // White for text on colored backgrounds
  };

  // Banner generation settings
  let bannerSettings = $state({
    width: 1200,
    height: 630,
    title: '',
    titleHebrew: '',
    subtitle: '',
    subtitleHebrew: '',
    category: '',
    categoryHebrew: '',
    primaryImageUrl: '',
    backgroundImageUrl: '',
    textColor: ginzeyColors.darkText,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    fontSize: 48,
    fontFamily: 'Arial, sans-serif',
    hebrewFontFamily: 'David, Arial, sans-serif',
    // Text positioning and spacing
    textMarginLeft: 60,
    textMarginRight: 0,
    textMarginTop: 80,
    textMarginBottom: 60,
    textPadding: 20,
    textAreaWidth: 35, // Percentage of canvas width
    // Category sticker colors
    categoryColor: ginzeyColors.red, // Default to red, can be changed to blue
    baseBackgroundColor: ginzeyColors.antiquePaper
  });
  
  // Available fonts
  const fonts = [
    { name: 'Arial', value: 'Arial, sans-serif', supportsHebrew: true },
    { name: 'Times New Roman', value: 'Times New Roman, serif', supportsHebrew: true },
    { name: 'David (Hebrew)', value: 'David, Arial, sans-serif', supportsHebrew: true },
    { name: 'Frank Ruhl Libre (Hebrew)', value: 'Frank Ruhl Libre, serif', supportsHebrew: true },
    { name: 'Heebo (Hebrew)', value: 'Heebo, sans-serif', supportsHebrew: true },
    { name: 'Rubik (Hebrew)', value: 'Rubik, sans-serif', supportsHebrew: true },
    { name: 'Varela Round (Hebrew)', value: 'Varela Round, sans-serif', supportsHebrew: true },
    { name: 'Open Sans', value: 'Open Sans, sans-serif', supportsHebrew: true },
    { name: 'Roboto', value: 'Roboto, sans-serif', supportsHebrew: true },
    { name: 'Montserrat', value: 'Montserrat, sans-serif', supportsHebrew: false }
  ];
  
  const hebrewFonts = [
    { name: 'David', value: 'David, Arial, sans-serif' },
    { name: 'Frank Ruhl Libre', value: 'Frank Ruhl Libre, serif' },
    { name: 'Heebo', value: 'Heebo, sans-serif' },
    { name: 'Rubik', value: 'Rubik, sans-serif' },
    { name: 'Varela Round', value: 'Varela Round, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' }
  ];
  
  const presetDimensions = [
    { name: 'Social Media (Facebook/Twitter)', width: 1200, height: 630 },
    { name: 'Instagram Post', width: 1080, height: 1080 },
    { name: 'Instagram Story', width: 1080, height: 1920 },
    { name: 'Email Header', width: 600, height: 200 },
    { name: 'Custom', width: 1200, height: 630 }
  ];
  
  let selectedPreset = $state('Social Media (Facebook/Twitter)');
  
  let generatedBannerUrl = $state(null);
  let generating = $state(false);
  
  $effect(() => {
    if ($page.params.id) {
      loadData();
    }
  });
  
  async function loadData() {
    try {
      loading = true;
      const [auctionRes, lotsRes] = await Promise.all([
        fetch(`/api/auctions/${$page.params.id}`),
        fetch(`/api/lots?auctionId=${$page.params.id}`)
      ]);
      
      auction = await auctionRes.json();
      lots = await lotsRes.json();
      
      // Set default values from auction
      if (auction) {
        bannerSettings.title = auction.title;
        bannerSettings.subtitle = auction.description.substring(0, 100);
        bannerSettings.primaryImageUrl = auction.imageUrl;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  }
  
  function selectLot(lot) {
    selectedLot = lot;
    selectedLotId = lot.id;
    bannerSettings.title = lot.title || '';
    bannerSettings.subtitle = lot.description ? lot.description.substring(0, 150) : '';
    // Both primary and background default to lot's image
    bannerSettings.primaryImageUrl = lot.imageUrl || '';
    bannerSettings.backgroundImageUrl = lot.imageUrl || '';
    // Pull Hebrew fields from lot if available
    bannerSettings.titleHebrew = lot.HebrewTitle || lot.hebrewTitle || lot.titleHebrew || '';
    bannerSettings.subtitleHebrew = lot.HebrewDescription || lot.hebrewDescription || lot.descriptionHebrew || '';
    // Keep category Hebrew empty (not typically stored in lot)
    bannerSettings.categoryHebrew = '';
  }
  
  // Check if text contains Hebrew characters
  function containsHebrew(text) {
    return /[\u0590-\u05FF]/.test(text);
  }
  
  // Set text direction based on content
  function getTextDirection(text) {
    return containsHebrew(text) ? 'rtl' : 'ltr';
  }
  
  async function generateBanner() {
    generating = true;
    generatedBannerUrl = null;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = bannerSettings.width;
      canvas.height = bannerSettings.height;
      const ctx = canvas.getContext('2d');
      
      // Load background image if provided
      if (bannerSettings.backgroundImageUrl) {
        await new Promise((resolve, reject) => {
          const bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          bgImg.onload = () => {
            // Draw background image covering entire canvas
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
            // Add dark overlay for text readability
            ctx.fillStyle = bannerSettings.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            resolve();
          };
          bgImg.onerror = () => {
            // Fallback to antique paper background if image fails to load
            ctx.fillStyle = bannerSettings.baseBackgroundColor || ginzeyColors.antiquePaper;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            resolve();
          };
          bgImg.src = bannerSettings.backgroundImageUrl;
        });
      } else {
        // Solid antique paper background if no background image
        ctx.fillStyle = bannerSettings.baseBackgroundColor || ginzeyColors.antiquePaper;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Load and draw primary image (right side)
      if (bannerSettings.primaryImageUrl) {
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            // Draw image on right side (60% of width)
            const imgWidth = canvas.width * 0.6;
            const imgHeight = canvas.height;
            const imgX = canvas.width - imgWidth;
            const imgY = 0;
            
            // Draw image
            ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
            
            // Add subtle gradient overlay on left side for text readability (lighter for antique paper)
            const gradient = ctx.createLinearGradient(0, 0, imgX, 0);
            gradient.addColorStop(0, 'rgba(245, 241, 232, 0.9)'); // Antique paper with slight transparency
            gradient.addColorStop(1, 'rgba(245, 241, 232, 0.5)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, imgX, canvas.height);
            
            resolve();
          };
          img.onerror = () => {
            // If primary image fails, continue without it
            console.warn('Primary image failed to load');
            resolve();
          };
          img.src = bannerSettings.primaryImageUrl;
        });
      } else {
        // No overlay needed if no primary image - antique paper background is already set
      }
      
      // Draw text content
      ctx.fillStyle = bannerSettings.textColor;
      ctx.textBaseline = 'top';
      
      // Use settings for text positioning
      const titleX = bannerSettings.textMarginLeft;
      const textAreaWidth = (canvas.width * bannerSettings.textAreaWidth) / 100;
      const maxTitleWidth = textAreaWidth;
      const rightEdgeX = titleX + textAreaWidth;
      let currentY = bannerSettings.textMarginTop;
      
      // Draw title (English)
      if (bannerSettings.title) {
        ctx.font = `bold ${bannerSettings.fontSize}px ${bannerSettings.fontFamily}`;
        ctx.textAlign = 'left';
        const titleHeight = wrapText(ctx, bannerSettings.title, titleX, currentY, maxTitleWidth, bannerSettings.fontSize * 1.2);
        currentY += titleHeight + bannerSettings.textPadding;
      }
      
      // Draw title (Hebrew) if provided
      if (bannerSettings.titleHebrew) {
        ctx.font = `bold ${bannerSettings.fontSize}px ${bannerSettings.hebrewFontFamily}`;
        ctx.textAlign = 'right';
        const titleHebrewHeight = wrapTextRTL(ctx, bannerSettings.titleHebrew, rightEdgeX, currentY, maxTitleWidth, bannerSettings.fontSize * 1.2);
        currentY += titleHebrewHeight + bannerSettings.textPadding;
      }
      
      // Draw subtitle (English)
      if (bannerSettings.subtitle) {
        ctx.font = `${bannerSettings.fontSize * 0.5}px ${bannerSettings.fontFamily}`;
        ctx.textAlign = 'left';
        const subtitleHeight = wrapText(ctx, bannerSettings.subtitle, titleX, currentY, maxTitleWidth, bannerSettings.fontSize * 0.7);
        currentY += subtitleHeight + bannerSettings.textPadding;
      }
      
      // Draw subtitle (Hebrew) if provided
      if (bannerSettings.subtitleHebrew) {
        ctx.font = `${bannerSettings.fontSize * 0.5}px ${bannerSettings.hebrewFontFamily}`;
        ctx.textAlign = 'right';
        const subtitleHebrewHeight = wrapTextRTL(ctx, bannerSettings.subtitleHebrew, rightEdgeX, currentY, maxTitleWidth, bannerSettings.fontSize * 0.7);
        currentY += subtitleHebrewHeight + bannerSettings.textPadding;
      }
      
      // Draw category sticker badge if provided
      if (bannerSettings.category || bannerSettings.categoryHebrew) {
        ctx.font = `bold ${bannerSettings.fontSize * 0.4}px ${bannerSettings.fontFamily}`;
        ctx.textAlign = 'left';
        const categoryText = bannerSettings.category ? bannerSettings.category.toUpperCase() : '';
        const categoryHebrewText = bannerSettings.categoryHebrew || '';
        
        // Measure both texts
        let categoryWidth = 40;
        if (categoryText) {
          categoryWidth += ctx.measureText(categoryText).width;
        }
        if (categoryHebrewText) {
          ctx.font = `bold ${bannerSettings.fontSize * 0.4}px ${bannerSettings.hebrewFontFamily}`;
          categoryWidth += ctx.measureText(categoryHebrewText).width + 20;
        }
        
        const categoryX = titleX;
        const categoryY = currentY;
        const categoryHeight = 50;
        const cornerRadius = 8; // Rounded corners for sticker effect
        
        // Draw sticker shadow (offset slightly)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.roundRect(categoryX + 2, categoryY + 2, categoryWidth, categoryHeight, cornerRadius);
        ctx.fill();
        
        // Draw sticker background with rounded corners
        ctx.fillStyle = bannerSettings.categoryColor || ginzeyColors.red;
        ctx.beginPath();
        ctx.roundRect(categoryX, categoryY, categoryWidth, categoryHeight, cornerRadius);
        ctx.fill();
        
        // Draw sticker border for definition
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw category text (English)
        ctx.fillStyle = ginzeyColors.lightText;
        if (categoryText) {
          ctx.font = `bold ${bannerSettings.fontSize * 0.4}px ${bannerSettings.fontFamily}`;
          ctx.textAlign = 'left';
          ctx.fillText(categoryText, categoryX + 20, categoryY + 15);
        }
        // Draw category text (Hebrew)
        if (categoryHebrewText) {
          ctx.font = `bold ${bannerSettings.fontSize * 0.4}px ${bannerSettings.hebrewFontFamily}`;
          ctx.textAlign = 'right';
          ctx.fillText(categoryHebrewText, categoryX + categoryWidth - 20, categoryY + 15);
        }
        currentY += categoryHeight + bannerSettings.textPadding;
      }
      
      // Draw "Ginzey America" branding at bottom
      ctx.font = `bold ${bannerSettings.fontSize * 0.35}px ${bannerSettings.fontFamily}`;
      ctx.fillStyle = ginzeyColors.darkText;
      ctx.textAlign = 'left';
      ctx.fillText('Ginzey America', titleX, canvas.height - bannerSettings.textMarginBottom);
      
      // Convert canvas to image
      generatedBannerUrl = canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating banner:', error);
      alert('Error generating banner. Please check image URLs.');
    } finally {
      generating = false;
    }
  }
  
  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    let totalHeight = 0;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
        totalHeight += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, currentY);
    totalHeight += lineHeight;
    return totalHeight;
  }
  
  function wrapTextRTL(context, text, x, y, maxWidth, lineHeight) {
    // For RTL text, we need to handle it differently
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    let totalHeight = 0;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = (words[n] + ' ' + line).trim();
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
        totalHeight += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, currentY);
    totalHeight += lineHeight;
    return totalHeight;
  }
  
  function downloadBanner() {
    if (!generatedBannerUrl) return;
    
    const link = document.createElement('a');
    link.download = `banner-${selectedLot?.id || auction?.id || 'banner'}.png`;
    link.href = generatedBannerUrl;
    link.click();
  }
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
</script>

{#if loading}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
{:else if auction}
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <button
        onclick={() => goto(`/seller/auctions/${auction.id}/lots`)}
        class="text-blue-600 hover:text-blue-800 mb-6 flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Lots Management
      </button>

      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Banner Generator Tool</h1>
        <p class="text-gray-600 text-lg">Create promotional banners for your Judaica lots and auctions</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Settings Panel -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-lg p-6 sticky top-4">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Banner Settings</h2>
            
            <!-- Lot Selection -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Select Lot (Optional)
              </label>
              <select
                bind:value={selectedLotId}
                onchange={(e) => {
                  const lotId = e.target.value;
                  if (lotId) {
                    const lot = lots.find(l => l.id === lotId);
                    if (lot) {
                      selectLot(lot);
                    }
                  } else {
                    selectedLot = null;
                    selectedLotId = '';
                    // Reset to auction defaults
                    if (auction) {
                      bannerSettings.title = auction.title;
                      bannerSettings.subtitle = auction.description.substring(0, 150);
                      bannerSettings.primaryImageUrl = auction.imageUrl;
                      bannerSettings.backgroundImageUrl = auction.imageUrl;
                    }
                  }
                }}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">-- Select a lot --</option>
                {#each lots as lot}
                  <option value={lot.id}>
                    Lot #{lot.lotNumber}: {lot.title}
                  </option>
                {/each}
              </select>
              {#if selectedLot}
                <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p class="text-sm font-semibold text-blue-900">Selected: Lot #{selectedLot.lotNumber}</p>
                  <p class="text-xs text-blue-700 mt-1">{selectedLot.title}</p>
                </div>
              {/if}
            </div>

            <!-- Font Selection -->
            <div class="mb-4">
              <label for="fontFamily" class="block text-sm font-medium text-gray-700 mb-2">
                English Font
              </label>
              <select
                id="fontFamily"
                bind:value={bannerSettings.fontFamily}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {#each fonts as font}
                  <option value={font.value}>{font.name}</option>
                {/each}
              </select>
            </div>

            <div class="mb-4">
              <label for="hebrewFontFamily" class="block text-sm font-medium text-gray-700 mb-2">
                Hebrew Font
              </label>
              <select
                id="hebrewFontFamily"
                bind:value={bannerSettings.hebrewFontFamily}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {#each hebrewFonts as font}
                  <option value={font.value}>{font.name}</option>
                {/each}
              </select>
            </div>

            <!-- Title -->
            <div class="mb-4">
              <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                Title (English) *
              </label>
              <input
                id="title"
                type="text"
                bind:value={bannerSettings.title}
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Auction or Lot Title"
              />
              {#if bannerSettings.title}
                <p class="mt-1 text-xs text-gray-500">Preview: {bannerSettings.title}</p>
              {/if}
            </div>

            <!-- Title Hebrew -->
            <div class="mb-4">
              <label for="titleHebrew" class="block text-sm font-medium text-gray-700 mb-2">
                Title (Hebrew)
              </label>
              <input
                id="titleHebrew"
                type="text"
                bind:value={bannerSettings.titleHebrew}
                dir="rtl"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-right"
                placeholder="כותרת בעברית"
              />
              {#if bannerSettings.titleHebrew}
                <p class="mt-1 text-xs text-gray-500">Hebrew: {bannerSettings.titleHebrew}</p>
              {/if}
            </div>

            <!-- Subtitle -->
            <div class="mb-4">
              <label for="subtitle" class="block text-sm font-medium text-gray-700 mb-2">
                Subtitle / Description (English)
              </label>
              <textarea
                id="subtitle"
                bind:value={bannerSettings.subtitle}
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Brief description..."
              ></textarea>
              {#if bannerSettings.subtitle}
                <p class="mt-1 text-xs text-gray-500">Length: {bannerSettings.subtitle.length} characters</p>
              {/if}
            </div>

            <!-- Subtitle Hebrew -->
            <div class="mb-4">
              <label for="subtitleHebrew" class="block text-sm font-medium text-gray-700 mb-2">
                Subtitle / Description (Hebrew)
              </label>
              <textarea
                id="subtitleHebrew"
                bind:value={bannerSettings.subtitleHebrew}
                rows="3"
                dir="rtl"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-right"
                placeholder="תיאור קצר בעברית..."
              ></textarea>
              {#if bannerSettings.subtitleHebrew}
                <p class="mt-1 text-xs text-gray-500">Hebrew length: {bannerSettings.subtitleHebrew.length} characters</p>
              {/if}
            </div>

            <!-- Category -->
            <div class="mb-4">
              <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                Category (English)
              </label>
              <input
                id="category"
                type="text"
                bind:value={bannerSettings.category}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="e.g., Menorahs, Torah Scrolls"
              />
              {#if bannerSettings.category}
                <p class="mt-1 text-xs text-gray-500">Category: {bannerSettings.category}</p>
              {/if}
            </div>

            <!-- Category Hebrew -->
            <div class="mb-4">
              <label for="categoryHebrew" class="block text-sm font-medium text-gray-700 mb-2">
                Category (Hebrew)
              </label>
              <input
                id="categoryHebrew"
                type="text"
                bind:value={bannerSettings.categoryHebrew}
                dir="rtl"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-right"
                placeholder="למשל: מנורות, ספרי תורה"
              />
              {#if bannerSettings.categoryHebrew}
                <p class="mt-1 text-xs text-gray-500">Hebrew category: {bannerSettings.categoryHebrew}</p>
              {/if}
            </div>

            <!-- Primary Image URL -->
            <div class="mb-4">
              <label for="primaryImage" class="block text-sm font-medium text-gray-700 mb-2">
                Primary Image URL *
              </label>
              <input
                id="primaryImage"
                type="url"
                bind:value={bannerSettings.primaryImageUrl}
                required
                class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="https://example.com/image.jpg"
              />
              {#if bannerSettings.primaryImageUrl}
                <div class="mt-2">
                  <img
                    src={bannerSettings.primaryImageUrl}
                    alt="Primary image preview"
                    class="w-full h-32 object-cover rounded-lg border border-gray-200"
                    onerror={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              {/if}
            </div>

            <!-- Background Image URL -->
            <div class="mb-4">
              <label for="backgroundImage" class="block text-sm font-medium text-gray-700 mb-2">
                Background Image URL (Optional)
              </label>
              <input
                id="backgroundImage"
                type="url"
                bind:value={bannerSettings.backgroundImageUrl}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="https://example.com/background.jpg"
              />
              <p class="mt-1 text-xs text-gray-500">If not provided, a solid blue background will be used</p>
              {#if bannerSettings.backgroundImageUrl}
                <div class="mt-2">
                  <img
                    src={bannerSettings.backgroundImageUrl}
                    alt="Background image preview"
                    class="w-full h-32 object-cover rounded-lg border border-gray-200"
                    onerror={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              {/if}
            </div>

            <!-- Text Color -->
            <div class="mb-4">
              <label for="textColor" class="block text-sm font-medium text-gray-700 mb-2">
                Text Color
              </label>
              <input
                id="textColor"
                type="color"
                bind:value={bannerSettings.textColor}
                class="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            <!-- Banner Dimensions -->
            <div class="mb-4">
              <label for="dimensions" class="block text-sm font-medium text-gray-700 mb-2">
                Banner Size
              </label>
              <select
                id="dimensions"
                bind:value={selectedPreset}
                onchange={(e) => {
                  const preset = presetDimensions.find(p => p.name === e.target.value);
                  if (preset) {
                    bannerSettings.width = preset.width;
                    bannerSettings.height = preset.height;
                  }
                }}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {#each presetDimensions as preset}
                  <option value={preset.name}>{preset.name} ({preset.width}×{preset.height})</option>
                {/each}
              </select>
            </div>

            <!-- Custom Dimensions (if Custom selected) -->
            {#if selectedPreset === 'Custom'}
              <div class="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label for="customWidth" class="block text-sm font-medium text-gray-700 mb-2">
                    Width
                  </label>
                  <input
                    id="customWidth"
                    type="number"
                    bind:value={bannerSettings.width}
                    min="100"
                    max="4000"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label for="customHeight" class="block text-sm font-medium text-gray-700 mb-2">
                    Height
                  </label>
                  <input
                    id="customHeight"
                    type="number"
                    bind:value={bannerSettings.height}
                    min="100"
                    max="4000"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            {/if}

            <!-- Background Overlay Opacity -->
            <div class="mb-4">
              <label for="overlayOpacity" class="block text-sm font-medium text-gray-700 mb-2">
                Background Overlay Opacity
              </label>
              <input
                id="overlayOpacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value="0.5"
                oninput={(e) => {
                  const opacity = parseFloat(e.target.value);
                  bannerSettings.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
                }}
                class="w-full"
              />
              <p class="text-xs text-gray-500 mt-1">Adjusts text readability over background</p>
            </div>

            <!-- Text Positioning Section -->
            <div class="mb-6 border-t pt-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Text Positioning & Spacing</h3>
              
              <!-- Text Area Width -->
              <div class="mb-4">
                <label for="textAreaWidth" class="block text-sm font-medium text-gray-700 mb-2">
                  Text Area Width (%)
                </label>
                <input
                  id="textAreaWidth"
                  type="number"
                  bind:value={bannerSettings.textAreaWidth}
                  min="20"
                  max="60"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p class="text-xs text-gray-500 mt-1">Width of text area as percentage of banner</p>
              </div>

              <!-- Margins -->
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label for="textMarginLeft" class="block text-sm font-medium text-gray-700 mb-2">
                    Left Margin (px)
                  </label>
                  <input
                    id="textMarginLeft"
                    type="number"
                    bind:value={bannerSettings.textMarginLeft}
                    min="0"
                    max="500"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label for="textMarginTop" class="block text-sm font-medium text-gray-700 mb-2">
                    Top Margin (px)
                  </label>
                  <input
                    id="textMarginTop"
                    type="number"
                    bind:value={bannerSettings.textMarginTop}
                    min="0"
                    max="500"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label for="textMarginRight" class="block text-sm font-medium text-gray-700 mb-2">
                    Right Margin (px)
                  </label>
                  <input
                    id="textMarginRight"
                    type="number"
                    bind:value={bannerSettings.textMarginRight}
                    min="0"
                    max="500"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label for="textMarginBottom" class="block text-sm font-medium text-gray-700 mb-2">
                    Bottom Margin (px)
                  </label>
                  <input
                    id="textMarginBottom"
                    type="number"
                    bind:value={bannerSettings.textMarginBottom}
                    min="0"
                    max="500"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <!-- Text Padding (spacing between elements) -->
              <div class="mb-4">
                <label for="textPadding" class="block text-sm font-medium text-gray-700 mb-2">
                  Text Padding/Spacing (px)
                </label>
                <input
                  id="textPadding"
                  type="number"
                  bind:value={bannerSettings.textPadding}
                  min="0"
                  max="100"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p class="text-xs text-gray-500 mt-1">Spacing between text elements (title, subtitle, etc.)</p>
              </div>
            </div>

            <!-- Generate Button -->
            <button
              onclick={generateBanner}
              disabled={generating || !bannerSettings.title || !bannerSettings.primaryImageUrl}
              class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate Banner'}
            </button>
          </div>
        </div>

        <!-- Preview Panel -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Banner Preview</h2>
            
            {#if generatedBannerUrl}
              <div class="mb-6">
                <img
                  src={generatedBannerUrl}
                  alt="Generated Banner"
                  class="w-full rounded-lg shadow-lg"
                />
              </div>
              <button
                onclick={downloadBanner}
                class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Download Banner
              </button>
            {:else}
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="mt-4 text-gray-600">Configure settings and click "Generate Banner" to create your promotional banner</p>
              </div>
            {/if}
          </div>

          <!-- Quick Templates -->
          <div class="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Quick Templates</h3>
            <div class="grid grid-cols-2 gap-4">
              <button
                onclick={() => {
                  bannerSettings.category = 'Menorahs';
                  bannerSettings.textColor = '#FFFFFF';
                  bannerSettings.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                }}
                class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Menorahs Template
              </button>
              <button
                onclick={() => {
                  bannerSettings.category = 'Torah Scrolls';
                  bannerSettings.textColor = '#FFFFFF';
                  bannerSettings.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                }}
                class="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors"
              >
                Torah Scrolls Template
              </button>
              <button
                onclick={() => {
                  bannerSettings.category = 'Ceremonial Silver';
                  bannerSettings.textColor = '#FFFFFF';
                  bannerSettings.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                }}
                class="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
              >
                Ceremonial Silver Template
              </button>
              <button
                onclick={() => {
                  bannerSettings.category = 'Antique Judaica';
                  bannerSettings.textColor = '#FFFFFF';
                  bannerSettings.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                }}
                class="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                Antique Judaica Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

