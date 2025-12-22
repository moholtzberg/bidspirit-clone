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
    yearEnglish: '', // English year (e.g., "1890")
    yearHebrew: '', // Hebrew year (e.g., "תר\"נ")
    primaryImageUrl: '',
    backgroundImageUrl: '',
    textColor: ginzeyColors.darkText,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    fontSize: 48,
    fontFamily: 'Cormorant Garamond, Times New Roman, serif', // Serif font for English
    hebrewFontFamily: 'Frank Ruhl Libre, Cardo, serif', // Frank Ruhl or Cardo for Hebrew
    // Text positioning and spacing - centered layout
    textMarginLeft: 0, // Will be calculated for centering
    textMarginRight: 0,
    textMarginTop: 80,
    textMarginBottom: 60,
    textPadding: 20,
    textAreaWidth: 50, // 50% for text area (other 50% for image)
    // Category sticker colors
    categoryColor: ginzeyColors.red, // Default to red, can be changed to blue
    baseBackgroundColor: ginzeyColors.antiquePaper
  });
  
  // Available fonts - serif for English, vintage Hebrew fonts
  const fonts = [
    { name: 'Cormorant Garamond (Serif)', value: 'Cormorant Garamond, serif', supportsHebrew: false },
    { name: 'Playfair Display (Serif)', value: 'Playfair Display, serif', supportsHebrew: false },
    { name: 'Times New Roman (Serif)', value: 'Times New Roman, serif', supportsHebrew: true },
    { name: 'Georgia (Serif)', value: 'Georgia, serif', supportsHebrew: true },
    { name: 'Arial', value: 'Arial, sans-serif', supportsHebrew: true }
  ];
  
  const hebrewFonts = [
    { name: 'Frank Ruhl Libre (Recommended)', value: 'Frank Ruhl Libre, serif' },
    { name: 'Cardo (Recommended)', value: 'Cardo, serif' },
    { name: 'David', value: 'David, Arial, sans-serif' },
    { name: 'Heebo', value: 'Heebo, sans-serif' },
    { name: 'Rubik', value: 'Rubik, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' }
  ];
  
  // Convert Hebrew year to Hebrew numerals
  function convertToHebrewYear(year) {
    if (!year || isNaN(year)) return '';
    const hebrewNumerals = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
    const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
    const hundreds = ['', 'ק', 'ר', 'ש', 'ת'];
    
    // For years like 1890, we'd typically show תר"נ format
    // This is a simplified version - in practice you'd use a proper Hebrew calendar conversion
    let num = parseInt(year);
    if (num < 1000) num += 5000; // Add 5000 for Hebrew year
    
    let result = '';
    if (num >= 5000) {
      result += 'ה\'';
      num -= 5000;
    }
    
    // Convert remaining digits (simplified)
    if (num >= 400) {
      result += 'ת';
      num -= 400;
    }
    if (num >= 300) {
      result += 'ש';
      num -= 300;
    }
    if (num >= 200) {
      result += 'ר';
      num -= 200;
    }
    if (num >= 100) {
      result += 'ק';
      num -= 100;
    }
    if (num >= 90) {
      result += 'צ';
      num -= 90;
    }
    if (num >= 80) {
      result += 'פ';
      num -= 80;
    }
    if (num >= 70) {
      result += 'ע';
      num -= 70;
    }
    if (num >= 60) {
      result += 'ס';
      num -= 60;
    }
    if (num >= 50) {
      result += 'נ';
      num -= 50;
    }
    if (num >= 40) {
      result += 'מ';
      num -= 40;
    }
    if (num >= 30) {
      result += 'ל';
      num -= 30;
    }
    if (num >= 20) {
      result += 'כ';
      num -= 20;
    }
    if (num >= 10) {
      result += 'י';
      num -= 10;
    }
    if (num > 0) {
      result += hebrewNumerals[num];
    }
    
    return result || year.toString();
  }
  
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
    // Extract year from title if it contains a year (e.g., "c. 1890" or "1850")
    const yearMatch = lot.title?.match(/\b(18|19|20)\d{2}\b/);
    if (yearMatch) {
      bannerSettings.yearEnglish = yearMatch[0];
      // Convert to Hebrew year (simplified - you might want to use a proper Hebrew calendar library)
      bannerSettings.yearHebrew = convertToHebrewYear(yearMatch[0]);
    }
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
      
      // Load and draw primary image (right side - remaining space after text area)
      if (bannerSettings.primaryImageUrl) {
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            // Draw image on right side (remaining space after text area)
            const textAreaWidth = (canvas.width * bannerSettings.textAreaWidth) / 100;
            const imgWidth = canvas.width - textAreaWidth;
            const imgHeight = canvas.height;
            const imgX = textAreaWidth;
            const imgY = 0;
            
            // Draw image
            ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
            
            // Add subtle antique paper overlay at the edge for seamless transition
            const gradient = ctx.createLinearGradient(imgX - 20, 0, imgX, 0);
            gradient.addColorStop(0, 'rgba(245, 241, 232, 0.5)');
            gradient.addColorStop(1, 'rgba(245, 241, 232, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(imgX - 20, 0, 20, canvas.height);
            
            resolve();
          };
          img.onerror = () => {
            // If primary image fails, continue without it
            console.warn('Primary image failed to load');
            resolve();
          };
          img.src = bannerSettings.primaryImageUrl;
        });
      }
      
      // Draw text content - centered in left 50% of banner with vintage/antique theme
      ctx.fillStyle = bannerSettings.textColor;
      ctx.textBaseline = 'top'; // Use top baseline for consistent positioning
      
      // Calculate text area (left 50% of canvas)
      const textAreaWidth = canvas.width * 0.5;
      const textAreaCenterX = textAreaWidth / 2;
      const horizontalPadding = 40; // Padding from edges
      const maxTextWidth = textAreaWidth - (horizontalPadding * 2);
      
      // Start from top with margin
      let currentY = bannerSettings.textMarginTop;
      
      // Draw title (English) - centered, serif font for vintage look
      if (bannerSettings.title) {
        ctx.font = `bold ${bannerSettings.fontSize}px ${bannerSettings.fontFamily}`;
        ctx.textAlign = 'center';
        const titleHeight = wrapTextCentered(ctx, bannerSettings.title, textAreaCenterX, currentY, maxTextWidth, bannerSettings.fontSize * 1.3);
        currentY += titleHeight + bannerSettings.textPadding;
      }
      
      // Draw title (Hebrew) if provided - centered, Frank Ruhl or Cardo font
      if (bannerSettings.titleHebrew) {
        ctx.font = `bold ${bannerSettings.fontSize}px ${bannerSettings.hebrewFontFamily}`;
        ctx.textAlign = 'center';
        const titleHebrewHeight = wrapTextCentered(ctx, bannerSettings.titleHebrew, textAreaCenterX, currentY, maxTextWidth, bannerSettings.fontSize * 1.3);
        currentY += titleHebrewHeight + bannerSettings.textPadding;
      }
      
      // Draw year (English and Hebrew) - centered together with vintage styling
      if (bannerSettings.yearEnglish || bannerSettings.yearHebrew) {
        ctx.font = `italic ${bannerSettings.fontSize * 0.4}px ${bannerSettings.fontFamily}`;
        ctx.textAlign = 'center';
        let yearText = '';
        if (bannerSettings.yearEnglish) {
          yearText = bannerSettings.yearEnglish;
        }
        if (bannerSettings.yearHebrew) {
          if (yearText) yearText += ' / ';
          yearText += bannerSettings.yearHebrew;
        }
        if (yearText) {
          ctx.fillText(yearText, textAreaCenterX, currentY);
          currentY += bannerSettings.fontSize * 0.6 + bannerSettings.textPadding;
        }
      }
      
      // Draw subtitle (English) - centered
      if (bannerSettings.subtitle) {
        ctx.font = `${bannerSettings.fontSize * 0.45}px ${bannerSettings.fontFamily}`;
        ctx.textAlign = 'center';
        const subtitleHeight = wrapTextCentered(ctx, bannerSettings.subtitle, textAreaCenterX, currentY, maxTextWidth, bannerSettings.fontSize * 0.7);
        currentY += subtitleHeight + bannerSettings.textPadding;
      }
      
      // Draw subtitle (Hebrew) if provided - centered
      if (bannerSettings.subtitleHebrew) {
        ctx.font = `${bannerSettings.fontSize * 0.45}px ${bannerSettings.hebrewFontFamily}`;
        ctx.textAlign = 'center';
        const subtitleHebrewHeight = wrapTextCentered(ctx, bannerSettings.subtitleHebrew, textAreaCenterX, currentY, maxTextWidth, bannerSettings.fontSize * 0.7);
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
        
        // Center the category sticker
        const categoryX = textAreaCenterX - (categoryWidth / 2);
        const categoryY = currentY;
        const categoryHeight = 50;
        const cornerRadius = 8; // Rounded corners for sticker effect
        
        // Helper function to draw rounded rectangle
        function drawRoundedRect(x, y, width, height, radius) {
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + width - radius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
          ctx.lineTo(x + width, y + height - radius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
          ctx.lineTo(x + radius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
        }
        
        // Draw sticker shadow (offset slightly)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        drawRoundedRect(categoryX + 2, categoryY + 2, categoryWidth, categoryHeight, cornerRadius);
        ctx.fill();
        
        // Draw sticker background with rounded corners
        ctx.fillStyle = bannerSettings.categoryColor || ginzeyColors.red;
        drawRoundedRect(categoryX, categoryY, categoryWidth, categoryHeight, cornerRadius);
        ctx.fill();
        
        // Draw sticker border for definition
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        drawRoundedRect(categoryX, categoryY, categoryWidth, categoryHeight, cornerRadius);
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
      
      // Draw "Ginzey America" branding at bottom - centered
      ctx.font = `italic ${bannerSettings.fontSize * 0.35}px ${bannerSettings.fontFamily}`;
      ctx.fillStyle = ginzeyColors.darkText;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('Ginzey America', textAreaCenterX, canvas.height - bannerSettings.textMarginBottom - 20);
      
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
  
  function wrapTextCentered(context, text, centerX, startY, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = startY;
    let totalHeight = 0;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line.trim(), centerX, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
        totalHeight += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line.trim(), centerX, currentY);
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

            <!-- Year (English) -->
            <div class="mb-4">
              <label for="yearEnglish" class="block text-sm font-medium text-gray-700 mb-2">
                Year (English)
              </label>
              <input
                id="yearEnglish"
                type="text"
                bind:value={bannerSettings.yearEnglish}
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="e.g., 1890 or c. 1850"
                oninput={(e) => {
                  // Auto-convert to Hebrew year if possible
                  const yearMatch = e.target.value.match(/\b(18|19|20)\d{2}\b/);
                  if (yearMatch) {
                    bannerSettings.yearHebrew = convertToHebrewYear(yearMatch[0]);
                  }
                }}
              />
              {#if bannerSettings.yearEnglish}
                <p class="mt-1 text-xs text-gray-500">English year: {bannerSettings.yearEnglish}</p>
              {/if}
            </div>

            <!-- Year (Hebrew) -->
            <div class="mb-4">
              <label for="yearHebrew" class="block text-sm font-medium text-gray-700 mb-2">
                Year (Hebrew)
              </label>
              <input
                id="yearHebrew"
                type="text"
                bind:value={bannerSettings.yearHebrew}
                dir="rtl"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-right"
                placeholder="תר״נ"
              />
              {#if bannerSettings.yearHebrew}
                <p class="mt-1 text-xs text-gray-500">Hebrew year: {bannerSettings.yearHebrew}</p>
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
              <p class="mt-1 text-xs text-gray-500">If not provided, antique paper background will be used</p>
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

            <!-- Base Background Color -->
            <div class="mb-4">
              <label for="baseBackgroundColor" class="block text-sm font-medium text-gray-700 mb-2">
                Base Background Color (Antique Paper)
              </label>
              <input
                id="baseBackgroundColor"
                type="color"
                bind:value={bannerSettings.baseBackgroundColor}
                class="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
              <p class="text-xs text-gray-500 mt-1">Default: Antique paper (#F5F1E8)</p>
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
              <p class="text-xs text-gray-500 mt-1">Default: Dark brown (#2C1810)</p>
            </div>

            <!-- Category Sticker Color -->
            <div class="mb-4">
              <label for="categoryColor" class="block text-sm font-medium text-gray-700 mb-2">
                Category Sticker Color
              </label>
              <div class="flex gap-2 mb-2">
                <button
                  type="button"
                  onclick={() => bannerSettings.categoryColor = ginzeyColors.red}
                  class="flex-1 px-3 py-2 rounded-lg border-2 transition-colors {bannerSettings.categoryColor === ginzeyColors.red ? 'border-red-600 bg-red-50' : 'border-gray-300 bg-white'}"
                >
                  <div class="w-full h-6 rounded" style="background-color: {ginzeyColors.red};"></div>
                  <span class="text-xs mt-1">Red</span>
                </button>
                <button
                  type="button"
                  onclick={() => bannerSettings.categoryColor = ginzeyColors.blue}
                  class="flex-1 px-3 py-2 rounded-lg border-2 transition-colors {bannerSettings.categoryColor === ginzeyColors.blue ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-white'}"
                >
                  <div class="w-full h-6 rounded" style="background-color: {ginzeyColors.blue};"></div>
                  <span class="text-xs mt-1">Blue</span>
                </button>
              </div>
              <input
                id="categoryColor"
                type="color"
                bind:value={bannerSettings.categoryColor}
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
                  min="30"
                  max="70"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p class="text-xs text-gray-500 mt-1">Width of text area (default: 50% - image takes remaining space)</p>
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
            <h3 class="text-xl font-bold text-gray-900 mb-4">Ginzey America Quick Templates</h3>
            <div class="grid grid-cols-2 gap-4">
              <button
                onclick={() => {
                  bannerSettings.category = 'Menorahs';
                  bannerSettings.textColor = ginzeyColors.darkText;
                  bannerSettings.baseBackgroundColor = ginzeyColors.antiquePaper;
                  bannerSettings.categoryColor = ginzeyColors.red;
                }}
                class="px-4 py-2 bg-red-50 text-red-800 rounded-lg hover:bg-red-100 transition-colors border-2 border-red-200"
              >
                Menorahs (Red Sticker)
              </button>
              <button
                onclick={() => {
                  bannerSettings.category = 'Torah Scrolls';
                  bannerSettings.textColor = ginzeyColors.darkText;
                  bannerSettings.baseBackgroundColor = ginzeyColors.antiquePaper;
                  bannerSettings.categoryColor = ginzeyColors.blue;
                }}
                class="px-4 py-2 bg-blue-50 text-blue-800 rounded-lg hover:bg-blue-100 transition-colors border-2 border-blue-200"
              >
                Torah Scrolls (Blue Sticker)
              </button>
              <button
                onclick={() => {
                  bannerSettings.category = 'Ceremonial Silver';
                  bannerSettings.textColor = ginzeyColors.darkText;
                  bannerSettings.baseBackgroundColor = ginzeyColors.antiquePaper;
                  bannerSettings.categoryColor = ginzeyColors.red;
                }}
                class="px-4 py-2 bg-red-50 text-red-800 rounded-lg hover:bg-red-100 transition-colors border-2 border-red-200"
              >
                Ceremonial Silver (Red Sticker)
              </button>
              <button
                onclick={() => {
                  bannerSettings.category = 'Antique Judaica';
                  bannerSettings.textColor = ginzeyColors.darkText;
                  bannerSettings.baseBackgroundColor = ginzeyColors.antiquePaper;
                  bannerSettings.categoryColor = ginzeyColors.blue;
                }}
                class="px-4 py-2 bg-blue-50 text-blue-800 rounded-lg hover:bg-blue-100 transition-colors border-2 border-blue-200"
              >
                Antique Judaica (Blue Sticker)
              </button>
            </div>
            <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p class="text-sm text-amber-800">
                <strong>Ginzey America Color Scheme:</strong> Antique paper base (#F5F1E8) with red (#C41E3A) and blue (#1E3A8A) accent stickers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

