<script>
  // Props
  let {
    lots = [],
    auction = null,
    auctionHouse = null,
    type = 'lot', // 'lot', 'auction', 'auctionHouse'
    onSave = null // Callback when banner is saved
  } = $props();

  // Banner tool state
  let selectedBannerLotId = $state('');
  let selectedLotImages = $state([]);
  let selectedBannerImages = $state([]);
  let bannerSettings = $state({
    // Content
    title: '',
    titleHebrew: '',
    subtitle: '',
    subtitleHebrew: '',
    yearEnglish: '',
    yearHebrew: '',
    category: '',
    categoryHebrew: '',
    
    // Images
    primaryImageUrl: '',
    backgroundImageUrl: '',
    
    // Layout
    width: 1200,
    height: 630,
    imageLayout: 'right', // 'right', 'left', 'center', 'full', 'collage', 'split'
    imagePosition: 'cover', // 'cover', 'contain', 'repeat'
    imageOpacity: 1.0,
    
    // Background
    backgroundType: 'solid', // 'solid', 'gradient', 'image', 'pattern'
    backgroundColor: '#F5F1E8',
    backgroundGradient: {
      type: 'linear', // 'linear', 'radial'
      direction: 'to right', // 'to right', 'to bottom', 'to bottom right', etc.
      colors: ['#F5F1E8', '#E8E0D0'],
      stops: [0, 100]
    },
    backgroundPattern: 'none', // 'none', 'dots', 'lines', 'grid', 'diagonal'
    
    // Text
    fontSize: 48,
    fontFamily: 'Cormorant Garamond, Times New Roman, serif',
    hebrewFontFamily: 'Frank Ruhl Libre, Cardo, serif',
    textColor: '#2C1810',
    textAlign: 'center', // 'left', 'center', 'right'
    textPosition: 'left', // 'left', 'center', 'right' (for text area)
    textBackground: 'rgba(245, 241, 232, 0.95)',
    textBackgroundOpacity: 0.95,
    
    // Spacing
    padding: 30,
    textImageRatio: 0.4, // 0.4 = 40% text, 60% image
  });
  
  let generatedBannerUrl = $state(null);
  let generatingBanner = $state(false);
  let showAdvancedSettings = $state(false);
  let presetPreviews = $state({}); // Store preview URLs for each preset
  let generatingPreviews = $state(false);
  let generatingPresetIds = $state(new Set()); // Track which presets are currently generating

  // Available fonts
  const fonts = [
    { name: 'Cormorant Garamond', value: 'Cormorant Garamond, Times New Roman, serif' },
    { name: 'Playfair Display', value: 'Playfair Display, serif' },
    { name: 'Lora', value: 'Lora, serif' },
    { name: 'Merriweather', value: 'Merriweather, serif' },
    { name: 'Georgia', value: 'Georgia, serif' }
  ];

  const hebrewFonts = [
    { name: 'Frank Ruhl Libre', value: 'Frank Ruhl Libre, Cardo, serif' },
    { name: 'David Libre', value: 'David Libre, serif' },
    { name: 'Noto Sans Hebrew', value: 'Noto Sans Hebrew, sans-serif' },
    { name: 'Rubik', value: 'Rubik, sans-serif' }
  ];

  // Convert Gregorian year to Hebrew year format
  function convertToHebrewYear(year) {
    if (!year || isNaN(year)) return '';
    const yearNum = parseInt(year);
    if (yearNum < 1000 || yearNum > 9999) return '';
    const hebrewYear = yearNum + 3760;
    // Simplified Hebrew year conversion
    const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
    const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
    const hundreds = ['', 'ק', 'ר', 'ש', 'ת'];
    let result = '';
    let remaining = hebrewYear;
    if (remaining >= 5000) {
      result += 'ה\'';
      remaining -= 5000;
    }
    const hundredsDigit = Math.floor(remaining / 100);
    if (hundredsDigit > 0 && hundredsDigit <= 4) {
      result += hundreds[hundredsDigit];
      remaining -= hundredsDigit * 100;
    }
    const tensDigit = Math.floor(remaining / 10);
    if (tensDigit > 0 && tensDigit <= 9) {
      result += tens[tensDigit];
      remaining -= tensDigit * 10;
    }
    if (remaining > 0 && remaining <= 9) {
      result += ones[remaining];
    }
    return result || '';
  }

  const imageLayouts = [
    { value: 'right', label: 'Image Right (Text Left)' },
    { value: 'left', label: 'Image Left (Text Right)' },
    { value: 'center', label: 'Image Center (Text Overlay)' },
    { value: 'full', label: 'Full Background Image' },
    { value: 'collage', label: 'Image Collage' },
    { value: 'split', label: 'Split Screen' }
  ];

  // Preset layout templates
  const layoutPresets = [
    {
      id: 'classic-right',
      name: 'Classic Right',
      description: 'Image on right, text on left',
      preview: 'right',
      settings: {
        imageLayout: 'right',
        textImageRatio: 0.4,
        backgroundType: 'solid',
        backgroundColor: '#F5F1E8',
        textAlign: 'center',
        imagePosition: 'cover',
        imageOpacity: 1.0
      }
    },
    {
      id: 'classic-left',
      name: 'Classic Left',
      description: 'Image on left, text on right',
      preview: 'left',
      settings: {
        imageLayout: 'left',
        textImageRatio: 0.4,
        backgroundType: 'solid',
        backgroundColor: '#F5F1E8',
        textAlign: 'center',
        imagePosition: 'cover',
        imageOpacity: 1.0
      }
    },
    {
      id: 'full-background',
      name: 'Full Background',
      description: 'Image as full background with text overlay',
      preview: 'full',
      settings: {
        imageLayout: 'full',
        backgroundType: 'image',
        textAlign: 'center',
        imagePosition: 'cover',
        imageOpacity: 1.0,
        textBackgroundOpacity: 0.85
      }
    },
    {
      id: 'centered-overlay',
      name: 'Centered Overlay',
      description: 'Centered image with text overlay',
      preview: 'center',
      settings: {
        imageLayout: 'center',
        backgroundType: 'gradient',
        backgroundGradient: {
          type: 'radial',
          direction: 'center',
          colors: ['#F5F1E8', '#E8E0D0'],
          stops: [0, 100]
        },
        textAlign: 'center',
        imagePosition: 'contain',
        imageOpacity: 1.0
      }
    },
    {
      id: 'collage-grid',
      name: 'Collage Grid',
      description: 'Multiple images in a grid layout',
      preview: 'collage',
      settings: {
        imageLayout: 'collage',
        textImageRatio: 0.4,
        backgroundType: 'solid',
        backgroundColor: '#F5F1E8',
        textAlign: 'center',
        imagePosition: 'cover',
        imageOpacity: 1.0
      }
    },
    {
      id: 'split-screen',
      name: 'Split Screen',
      description: 'Split screen with image and text',
      preview: 'split',
      settings: {
        imageLayout: 'split',
        backgroundType: 'solid',
        backgroundColor: '#F5F1E8',
        textAlign: 'center',
        imagePosition: 'cover',
        imageOpacity: 1.0
      }
    },
    {
      id: 'elegant-gradient',
      name: 'Elegant Gradient',
      description: 'Gradient background with image on right',
      preview: 'right',
      settings: {
        imageLayout: 'right',
        textImageRatio: 0.4,
        backgroundType: 'gradient',
        backgroundGradient: {
          type: 'linear',
          direction: 'to right',
          colors: ['#2C1810', '#4A3428'],
          stops: [0, 100]
        },
        textColor: '#FFFFFF',
        textBackground: 'rgba(0, 0, 0, 0.3)',
        textBackgroundOpacity: 0.5,
        textAlign: 'center',
        imagePosition: 'cover',
        imageOpacity: 1.0
      }
    },
    {
      id: 'minimal-pattern',
      name: 'Minimal Pattern',
      description: 'Pattern background with image on left',
      preview: 'left',
      settings: {
        imageLayout: 'left',
        textImageRatio: 0.4,
        backgroundType: 'pattern',
        backgroundColor: '#F5F1E8',
        backgroundPattern: 'dots',
        textAlign: 'center',
        imagePosition: 'cover',
        imageOpacity: 1.0
      }
    }
  ];

  // Apply a preset layout
  function applyPreset(preset) {
    bannerSettings = {
      ...bannerSettings,
      ...preset.settings
    };
  }

  // Generate preview for a specific preset (fully async, yields to browser)
  async function generatePresetPreview(preset) {
    if (presetPreviews[preset.id]) {
      return presetPreviews[preset.id]; // Return cached preview
    }

    if (generatingPresetIds.has(preset.id)) {
      return null; // Already generating
    }

    generatingPresetIds.add(preset.id);

    try {
      // Yield to browser to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));

      const canvas = document.createElement('canvas');
      // Use smaller size for previews
      canvas.width = 400;
      canvas.height = 210; // Maintain 1200:630 ratio
      const ctx = canvas.getContext('2d');
      
      // Save current settings
      const originalSettings = { ...bannerSettings };
      
      // Temporarily apply preset settings
      const tempSettings = {
        ...bannerSettings,
        ...preset.settings,
        // Use demo content for preview
        title: preset.name,
        titleHebrew: '',
        subtitle: preset.description,
        subtitleHebrew: '',
        yearEnglish: '',
        yearHebrew: '',
        primaryImageUrl: bannerSettings.primaryImageUrl || '',
        backgroundImageUrl: bannerSettings.backgroundImageUrl || ''
      };
      
      // Temporarily set bannerSettings for drawing
      const originalBannerSettings = bannerSettings;
      bannerSettings = tempSettings;
      
      // Yield to browser between operations
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Draw background
      await drawBackground(ctx, canvas.width, canvas.height);
      
      // Yield again
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Draw a simple placeholder image if no image is available
      if (!tempSettings.primaryImageUrl && tempSettings.backgroundType !== 'image') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        if (tempSettings.imageLayout === 'right') {
          ctx.fillRect(canvas.width * 0.4, 0, canvas.width * 0.6, canvas.height);
        } else if (tempSettings.imageLayout === 'left') {
          ctx.fillRect(0, 0, canvas.width * 0.6, canvas.height);
        } else if (tempSettings.imageLayout === 'split') {
          ctx.fillRect(canvas.width * 0.5, 0, canvas.width * 0.5, canvas.height);
        } else if (tempSettings.imageLayout === 'collage') {
          const cols = 2;
          const rows = 2;
          const cellWidth = canvas.width / cols;
          const cellHeight = canvas.height / rows;
          for (let i = 0; i < 4; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
          }
        } else {
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else if (tempSettings.primaryImageUrl) {
        await drawImages(ctx, canvas.width, canvas.height);
      }
      
      // Yield again
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Draw text
      drawText(ctx, canvas.width, canvas.height);
      
      // Restore original settings
      bannerSettings = originalBannerSettings;
      
      // Final yield before data URL conversion (can be expensive)
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const previewUrl = canvas.toDataURL('image/png');
      presetPreviews[preset.id] = previewUrl;
      return previewUrl;
    } catch (error) {
      console.error('Error generating preset preview:', error);
      return null;
    } finally {
      generatingPresetIds.delete(preset.id);
    }
  }

  // Generate all preset previews (lazy, one at a time to avoid blocking)
  async function generateAllPresetPreviews() {
    if (generatingPreviews) return;
    generatingPreviews = true;
    
    try {
      // Generate previews one at a time to avoid blocking the UI
      for (const preset of layoutPresets) {
        if (!presetPreviews[preset.id]) {
          await generatePresetPreview(preset);
          // Small delay to allow UI to update
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } catch (error) {
      console.error('Error generating preset previews:', error);
    } finally {
      generatingPreviews = false;
    }
  }

  // Generate preview for a single preset on demand (non-blocking)
  async function ensurePresetPreview(preset) {
    if (presetPreviews[preset.id] || generatingPresetIds.has(preset.id)) {
      return; // Already exists or generating
    }
    
    // Start generation asynchronously without blocking
    generatePresetPreview(preset).catch(err => {
      console.error('Error generating preview for preset:', preset.id, err);
    });
  }

  // Download preset preview
  function downloadPresetPreview(preset, event) {
    event.stopPropagation();
    const previewUrl = presetPreviews[preset.id];
    if (!previewUrl) {
      alert('Preview not ready yet. Please wait a moment.');
      return;
    }
    
    const link = document.createElement('a');
    link.download = `banner-template-${preset.id}-${Date.now()}.png`;
    link.href = previewUrl;
    link.click();
  }

  // Don't generate all previews on mount - only generate on hover
  // This prevents the page from hanging when the banner tool is opened

  const backgroundTypes = [
    { value: 'solid', label: 'Solid Color' },
    { value: 'gradient', label: 'Gradient' },
    { value: 'image', label: 'Background Image' },
    { value: 'pattern', label: 'Pattern' }
  ];

  // Initialize based on type
  $effect(() => {
    if (type === 'auction' && auction) {
      bannerSettings.title = auction.title || '';
      bannerSettings.subtitle = auction.description ? auction.description.substring(0, 150) : '';
      bannerSettings.primaryImageUrl = auction.imageUrl || '';
      bannerSettings.backgroundImageUrl = auction.imageUrl || '';
    } else if (type === 'auctionHouse' && auctionHouse) {
      bannerSettings.title = auctionHouse.name || '';
      bannerSettings.subtitle = auctionHouse.description ? auctionHouse.description.substring(0, 150) : '';
      bannerSettings.primaryImageUrl = auctionHouse.logoUrl || '';
      bannerSettings.backgroundImageUrl = auctionHouse.logoUrl || '';
    }
  });

  // Helper function to wrap text
  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  // Draw background pattern
  function drawBackgroundPattern(ctx, width, height, pattern) {
    ctx.save();
    switch (pattern) {
      case 'dots':
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        const dotSize = 4;
        const spacing = 20;
        for (let x = 0; x < width; x += spacing) {
          for (let y = 0; y < height; y += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      case 'lines':
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;
        for (let y = 0; y < height; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        break;
      case 'grid':
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        break;
      case 'diagonal':
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;
        for (let i = -height; i < width + height; i += 30) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + height, height);
          ctx.stroke();
        }
        break;
    }
    ctx.restore();
  }

  // Load images from selected lot
  async function loadLotImages(lotId) {
    console.log('Loading images for lot:> ', lotId);
    selectedBannerImages = [];
    selectedLotImages = [];
    
    if (!lotId) {
      // Reset to auction defaults
      if (auction) {
        bannerSettings.title = auction.title || '';
        bannerSettings.subtitle = auction.description ? auction.description.substring(0, 150) : '';
        bannerSettings.primaryImageUrl = auction.imageUrl || '';
        bannerSettings.backgroundImageUrl = auction.imageUrl || '';
        bannerSettings.titleHebrew = '';
        bannerSettings.subtitleHebrew = '';
        bannerSettings.yearEnglish = '';
        bannerSettings.yearHebrew = '';
      }
      return;
    }

    const lot = lots.find(l => l.id === lotId);
    console.log('Lot:> ', lot);
    if (!lot) return;

    bannerSettings.title = lot.title || '';
    bannerSettings.titleHebrew = lot.hebrewTitle || lot.HebrewTitle || '';
    bannerSettings.subtitle = lot.description ? lot.description.substring(0, 150) : '';
    bannerSettings.subtitleHebrew = lot.hebrewDescription || lot.HebrewDescription || '';
    console.log('Banner Settings:> ', bannerSettings);
    // Extract year from title if it contains a year
    const yearMatch = lot.title?.match(/\b(18|19|20)\d{2}\b/);
    if (yearMatch) {
      bannerSettings.yearEnglish = yearMatch[0];
      bannerSettings.yearHebrew = convertToHebrewYear(yearMatch[0]);
    }
    
    // Load all images from the lot
    const images = [];
    
    if (lot.images && Array.isArray(lot.images) && lot.images.length > 0) {
      lot.images.forEach(img => {
        const imageUrl = typeof img === 'string' ? img : (img.url || img);
        const imageId = img.id || `img-${images.length}`;
        const isPrimary = img.isPrimary || false;
        
        images.push({
          url: imageUrl,
          id: imageId,
          isPrimary: isPrimary
        });
      });
    }
    
    // Fallback to legacy imageUrls
    if (images.length === 0 && lot.imageUrls) {
      try {
        const parsed = typeof lot.imageUrls === 'string' 
          ? JSON.parse(lot.imageUrls) 
          : lot.imageUrls;
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((url, index) => {
            images.push({
              url: url,
              id: `legacy-${index}`,
              isPrimary: index === 0
            });
          });
        }
      } catch (e) {
        console.warn('Failed to parse imageUrls:', e);
      }
    }
    
    // Fallback to single imageUrl
    if (images.length === 0 && lot.imageUrl) {
      images.push({
        url: lot.imageUrl,
        id: 'legacy-single',
        isPrimary: true
      });
    }
    
    // Images from database are already presigned URLs
    const imagesWithPresigned = images.map((img) => {
      return {
        ...img,
        url: img.url,
        displayUrl: img.url
      };
    });
    
    selectedLotImages = imagesWithPresigned;
    
    // Auto-select first image (or primary image)
    const primaryImage = imagesWithPresigned.find(img => img.isPrimary) || imagesWithPresigned[0];
    if (primaryImage) {
      selectedBannerImages = [primaryImage];
      bannerSettings.primaryImageUrl = primaryImage.url;
      bannerSettings.backgroundImageUrl = primaryImage.url;
    }
  }

  // Generate banner
  async function generateQuickBanner() {
    generatingBanner = true;
    generatedBannerUrl = null;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = bannerSettings.width;
      canvas.height = bannerSettings.height;
      const ctx = canvas.getContext('2d');
      
      // Draw background
      await drawBackground(ctx, canvas.width, canvas.height);
      
      // Draw images based on layout
      await drawImages(ctx, canvas.width, canvas.height);
      
      // Draw text based on layout
      drawText(ctx, canvas.width, canvas.height);
      
      generatedBannerUrl = canvas.toDataURL('image/png');
      
      // Call onSave callback if provided
      if (onSave && generatedBannerUrl) {
        onSave(generatedBannerUrl);
      }
    } catch (error) {
      console.error('Error generating banner:', error);
      alert('Failed to generate banner. Please try again.');
    } finally {
      generatingBanner = false;
    }
  }

  async function drawBackground(ctx, width, height) {
    switch (bannerSettings.backgroundType) {
      case 'solid':
        ctx.fillStyle = bannerSettings.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        break;
      case 'gradient':
        const grad = bannerSettings.backgroundGradient.type === 'radial'
          ? ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height))
          : ctx.createLinearGradient(0, 0, width, height);
        
        const colors = bannerSettings.backgroundGradient.colors;
        const stops = bannerSettings.backgroundGradient.stops;
        colors.forEach((color, i) => {
          grad.addColorStop(stops[i] / 100, color);
        });
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      case 'image':
        // Draw background image first
        if (bannerSettings.backgroundImageUrl) {
          await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              // Draw background image to fill entire canvas
              if (bannerSettings.imagePosition === 'cover') {
                const scale = Math.max(width / img.width, height / img.height);
                const x = (width - img.width * scale) / 2;
                const y = (height - img.height * scale) / 2;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
              } else {
                const scale = Math.min(width / img.width, height / img.height);
                const x = (width - img.width * scale) / 2;
                const y = (height - img.height * scale) / 2;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
              }
              resolve();
            };
            img.onerror = () => {
              // Fallback to solid color if image fails
              ctx.fillStyle = bannerSettings.backgroundColor || '#F5F1E8';
              ctx.fillRect(0, 0, width, height);
              resolve();
            };
            // Get presigned URL if it's S3
            let imageUrl = bannerSettings.backgroundImageUrl;
            if (imageUrl.includes('.s3.') || imageUrl.includes('s3.amazonaws.com')) {
              try {
                const match = imageUrl.match(/s3[^/]*\.amazonaws\.com\/(.+?)(?:\?|$)/);
                if (match) {
                  const key = match[1];
                  fetch('/api/images/presigned', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keys: [key] })
                  }).then(async (response) => {
                    if (response.ok) {
                      const { urls } = await response.json();
                      if (urls[key]) {
                        imageUrl = urls[key];
                      }
                    }
                    img.src = imageUrl;
                  }).catch(() => {
                    img.src = imageUrl;
                  });
                } else {
                  img.src = imageUrl;
                }
              } catch (error) {
                img.src = imageUrl;
              }
            } else {
              img.src = imageUrl;
            }
          });
        } else {
          // Fallback to solid color if no background image URL
          ctx.fillStyle = bannerSettings.backgroundColor || '#F5F1E8';
          ctx.fillRect(0, 0, width, height);
        }
        break;
      case 'pattern':
        ctx.fillStyle = bannerSettings.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        drawBackgroundPattern(ctx, width, height, bannerSettings.backgroundPattern);
        break;
    }
  }

  async function drawImages(ctx, width, height) {
    console.log('drawImages called, selectedBannerImages:', selectedBannerImages);
    console.log('bannerSettings.primaryImageUrl:', bannerSettings.primaryImageUrl);
    
    const imagesToUse = selectedBannerImages.length > 0 
      ? selectedBannerImages.map(img => img.url || img.displayUrl || img)
      : (bannerSettings.primaryImageUrl ? [bannerSettings.primaryImageUrl] : []);
    
    if (imagesToUse.length === 0 && bannerSettings.backgroundImageUrl && bannerSettings.backgroundType === 'image') {
      imagesToUse.push(bannerSettings.backgroundImageUrl);
    }
    
    console.log('imagesToUse:', imagesToUse);
    
    if (imagesToUse.length === 0) {
      console.warn('No images to draw');
      return;
    }
    
    // Get presigned URLs (images from mapLot are already presigned, but check anyway)
    const imageUrls = await Promise.all(
      imagesToUse.map(async (imageUrl) => {
        if (!imageUrl) return null;
        
        // Check if already presigned (has query params)
        const isPresigned = imageUrl.includes('?X-Amz-') || imageUrl.includes('?');
        
        if (!isPresigned && (imageUrl.includes('.s3.') || imageUrl.includes('s3.amazonaws.com'))) {
          try {
            const match = imageUrl.match(/s3[^/]*\.amazonaws\.com\/(.+?)(?:\?|$)/);
            if (match) {
              const key = match[1];
              const response = await fetch('/api/images/presigned', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keys: [key] })
              });
              if (response.ok) {
                const { urls } = await response.json();
                if (urls[key]) {
                  console.log('Got presigned URL for key:', key);
                  return urls[key];
                }
              }
            }
          } catch (error) {
            console.warn('Failed to get presigned URL:', error);
          }
        }
        console.log('Using image URL (already presigned or not S3):', imageUrl);
        return imageUrl;
      })
    );
    
    // Filter out null values
    const validImageUrls = imageUrls.filter(url => url !== null);
    console.log('Valid image URLs:', validImageUrls);
    
    if (validImageUrls.length === 0) {
      console.warn('No valid image URLs after processing');
      return;
    }
    
    ctx.globalAlpha = bannerSettings.imageOpacity;
    
    switch (bannerSettings.imageLayout) {
      case 'full':
        await drawFullBackgroundImage(ctx, width, height, validImageUrls[0]);
        break;
      case 'center':
        await drawCenterImage(ctx, width, height, validImageUrls);
        break;
      case 'collage':
        await drawCollage(ctx, width, height, validImageUrls);
        break;
      case 'split':
        await drawSplitImage(ctx, width, height, validImageUrls[0]);
        break;
      case 'right':
        await drawRightImage(ctx, width, height, validImageUrls);
        break;
      case 'left':
        await drawLeftImage(ctx, width, height, validImageUrls);
        break;
    }
    
    ctx.globalAlpha = 1.0;
  }

  // Helper function to load image through proxy to avoid CORS issues
  async function loadImageForCanvas(imageUrl) {
    // If it's already a data URL, use it directly
    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    
    // For S3 URLs, use proxy to avoid CORS
    if (imageUrl.includes('.s3.') || imageUrl.includes('s3.amazonaws.com')) {
      try {
        const proxyUrl = `/api/images/proxy?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        }
      } catch (error) {
        console.warn('Failed to load image through proxy, trying direct:', error);
      }
    }
    
    // Fallback to direct URL
    return imageUrl;
  }

  async function drawFullBackgroundImage(ctx, width, height, imageUrl) {
    if (!imageUrl) {
      console.warn('No image URL provided for drawFullBackgroundImage');
      return;
    }
    return new Promise(async (resolve) => {
      const img = new Image();
      // Don't set crossOrigin when using proxy or blob URLs
      const srcUrl = await loadImageForCanvas(imageUrl);
      img.onload = () => {
        console.log('Image loaded successfully');
        if (bannerSettings.imagePosition === 'cover') {
          const scale = Math.max(width / img.width, height / img.height);
          const x = (width - img.width * scale) / 2;
          const y = (height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        } else {
          const scale = Math.min(width / img.width, height / img.height);
          const x = (width - img.width * scale) / 2;
          const y = (height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
        // Clean up blob URL if it was created
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      img.onerror = (error) => {
        console.error('Failed to load image:', imageUrl, error);
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      console.log('Loading image:', imageUrl);
      img.src = srcUrl;
    });
  }

  async function drawCenterImage(ctx, width, height, imageUrls) {
    if (imageUrls.length === 0 || !imageUrls[0]) {
      console.warn('No image URL for drawCenterImage');
      return;
    }
    return new Promise(async (resolve) => {
      const img = new Image();
      const srcUrl = await loadImageForCanvas(imageUrls[0]);
      img.onload = () => {
        console.log('Center image loaded successfully');
        const imgSize = Math.min(width, height) * 0.6;
        const x = (width - imgSize) / 2;
        const y = (height - imgSize) / 2;
        ctx.drawImage(img, x, y, imgSize, imgSize);
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      img.onerror = (error) => {
        console.error('Failed to load center image:', imageUrls[0], error);
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      console.log('Loading center image:', imageUrls[0]);
      img.src = srcUrl;
    });
  }

  async function drawRightImage(ctx, width, height, imageUrls) {
    if (imageUrls.length === 0 || !imageUrls[0]) {
      console.warn('No image URL for drawRightImage');
      return;
    }
    const textAreaWidth = width * bannerSettings.textImageRatio;
    const imgAreaWidth = width - textAreaWidth;
    const imgAreaX = textAreaWidth;
    
    return new Promise(async (resolve) => {
      const img = new Image();
      const srcUrl = await loadImageForCanvas(imageUrls[0]);
      img.onload = () => {
        console.log('Right image loaded successfully');
        if (bannerSettings.imagePosition === 'cover') {
          const scale = Math.max(imgAreaWidth / img.width, height / img.height);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const x = imgAreaX + (imgAreaWidth - drawWidth) / 2;
          const y = (height - drawHeight) / 2;
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
        } else {
          const scale = Math.min(imgAreaWidth / img.width, height / img.height);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const x = imgAreaX + (imgAreaWidth - drawWidth) / 2;
          const y = (height - drawHeight) / 2;
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
        }
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      img.onerror = (error) => {
        console.error('Failed to load right image:', imageUrls[0], error);
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      console.log('Loading right image:', imageUrls[0]);
      img.src = srcUrl;
    });
  }

  async function drawLeftImage(ctx, width, height, imageUrls) {
    if (imageUrls.length === 0 || !imageUrls[0]) {
      console.warn('No image URL for drawLeftImage');
      return;
    }
    const textAreaWidth = width * bannerSettings.textImageRatio;
    const imgAreaWidth = width - textAreaWidth;
    
    return new Promise(async (resolve) => {
      const img = new Image();
      const srcUrl = await loadImageForCanvas(imageUrls[0]);
      img.onload = () => {
        console.log('Left image loaded successfully');
        if (bannerSettings.imagePosition === 'cover') {
          const scale = Math.max(imgAreaWidth / img.width, height / img.height);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const x = (imgAreaWidth - drawWidth) / 2;
          const y = (height - drawHeight) / 2;
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
        } else {
          const scale = Math.min(imgAreaWidth / img.width, height / img.height);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const x = (imgAreaWidth - drawWidth) / 2;
          const y = (height - drawHeight) / 2;
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
        }
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      img.onerror = (error) => {
        console.error('Failed to load left image:', imageUrls[0], error);
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      console.log('Loading left image:', imageUrls[0]);
      img.src = srcUrl;
    });
  }

  async function drawSplitImage(ctx, width, height, imageUrl) {
    if (!imageUrl) {
      console.warn('No image URL for drawSplitImage');
      return;
    }
    return new Promise(async (resolve) => {
      const img = new Image();
      const srcUrl = await loadImageForCanvas(imageUrl);
      img.onload = () => {
        console.log('Split image loaded successfully');
        // Split screen: image on one side, text on other
        const splitPoint = width / 2;
        ctx.drawImage(img, splitPoint, 0, splitPoint, height);
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      img.onerror = (error) => {
        console.error('Failed to load split image:', imageUrl, error);
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      console.log('Loading split image:', imageUrl);
      img.src = srcUrl;
    });
  }

  async function drawCollage(ctx, width, height, imageUrls) {
    if (imageUrls.length === 0) {
      console.warn('No image URLs for drawCollage');
      return;
    }
    
    console.log('Loading collage images:', imageUrls);
    
    const loadedImages = await Promise.all(
      imageUrls.map(async (url) => {
        if (!url) return null;
        const srcUrl = await loadImageForCanvas(url);
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            console.log('Collage image loaded:', url);
            resolve(img);
          };
          img.onerror = (error) => {
            console.error('Failed to load collage image:', url, error);
            if (srcUrl.startsWith('blob:')) {
              URL.revokeObjectURL(srcUrl);
            }
            resolve(null);
          };
          img.src = srcUrl;
        });
      })
    );
    
    const validImages = loadedImages.filter(img => img !== null);
    if (validImages.length === 0) return;
    
    const textAreaWidth = width * bannerSettings.textImageRatio;
    const imgAreaWidth = width - textAreaWidth;
    const imgAreaX = textAreaWidth;
    const imgAreaHeight = height;
    
    if (validImages.length === 1) {
      const img = validImages[0];
      const scale = Math.min(imgAreaWidth / img.width, imgAreaHeight / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const x = imgAreaX + (imgAreaWidth - drawWidth) / 2;
      const y = (imgAreaHeight - drawHeight) / 2;
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
    } else if (validImages.length === 2) {
      // 2 images: first image bottom left, second slightly behind it on top right
      const img1 = validImages[0];
      const img2 = validImages[1];
      
      // Calculate sizes - make images about 60% of available space
      const baseSize = Math.min(imgAreaWidth, imgAreaHeight) * 0.6;
      
      // Scale each image to fit
      const scale1 = Math.min(baseSize / img1.width, baseSize / img1.height);
      const scale2 = Math.min(baseSize / img2.width, baseSize / img2.height);
      
      const drawWidth1 = img1.width * scale1;
      const drawHeight1 = img1.height * scale1;
      const drawWidth2 = img2.width * scale2;
      const drawHeight2 = img2.height * scale2;
      
      // First image: bottom left
      const x1 = imgAreaX + imgAreaWidth * 0.1; // 10% from left
      const y1 = imgAreaHeight - drawHeight1 - imgAreaHeight * 0.1; // 10% from bottom
      
      // Second image: top right, slightly behind (offset and rotated slightly)
      const offsetX = 30; // Offset to create "behind" effect
      const offsetY = -30;
      const x2 = imgAreaX + imgAreaWidth * 0.5 - offsetX; // Center-right with offset
      const y2 = imgAreaHeight * 0.1 - offsetY; // 10% from top with offset
      
      // Draw second image first (behind), with slight rotation
      ctx.save();
      ctx.translate(x2 + drawWidth2 / 2, y2 + drawHeight2 / 2);
      ctx.rotate(-0.05); // Slight rotation (about 3 degrees)
      ctx.drawImage(img2, -drawWidth2 / 2, -drawHeight2 / 2, drawWidth2, drawHeight2);
      ctx.restore();
      
      // Draw first image on top (foreground)
      ctx.drawImage(img1, x1, y1, drawWidth1, drawHeight1);
      
    } else if (validImages.length === 3) {
      // 3 images: circular arrangement with each slightly behind the next
      // Layering: 2 behind 1, 3 behind 2, 1 behind 3 (circular)
      const centerX = imgAreaX + imgAreaWidth / 2;
      const centerY = imgAreaHeight / 2;
      const radius = Math.min(imgAreaWidth, imgAreaHeight) * 0.25; // Distance from center
      
      // Calculate sizes
      const baseSize = Math.min(imgAreaWidth, imgAreaHeight) * 0.5;
      
      // Prepare image data with positions
      const imageData = validImages.map((img, index) => {
        const scale = Math.min(baseSize / img.width, baseSize / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        
        // Position in circle: 120 degrees apart (360/3)
        const angle = (index * 2 * Math.PI / 3) - Math.PI / 2; // Start from top
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        // Rotation for each image (slight tilt)
        const rotation = angle + Math.PI / 2; // Perpendicular to radius
        
        // Offset to create "behind" effect - each image is slightly offset inward
        // Image 1 is behind 3, Image 2 is behind 1, Image 3 is behind 2
        const behindIndex = (index + 2) % 3; // Which image this one is behind
        const behindAngle = (behindIndex * 2 * Math.PI / 3) - Math.PI / 2;
        const offsetX = Math.cos(behindAngle) * 25; // Offset toward the image it's behind
        const offsetY = Math.sin(behindAngle) * 25;
        
        return {
          img,
          drawWidth,
          drawHeight,
          x: x + offsetX,
          y: y + offsetY,
          rotation
        };
      });
      
      // Draw in order: 3, 2, 1 (so 1 is on top, 2 is in middle, 3 is behind)
      // This creates: 2 behind 1, 3 behind 2, 1 behind 3
      const drawOrder = [2, 1, 0]; // Draw 3rd, then 2nd, then 1st
      drawOrder.forEach((orderIndex) => {
        const data = imageData[orderIndex];
        ctx.save();
        ctx.translate(data.x, data.y);
        ctx.rotate(data.rotation);
        ctx.drawImage(data.img, -data.drawWidth / 2, -data.drawHeight / 2, data.drawWidth, data.drawHeight);
        ctx.restore();
      });
      
    } else {
      // 4+ images: Grid layout
      const cols = Math.ceil(Math.sqrt(validImages.length));
      const rows = Math.ceil(validImages.length / cols);
      const cellWidth = imgAreaWidth / cols;
      const cellHeight = imgAreaHeight / rows;
      
      validImages.forEach((img, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = imgAreaX + col * cellWidth;
        const y = row * cellHeight;
        
        const scale = Math.min(cellWidth / img.width, cellHeight / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const drawX = x + (cellWidth - drawWidth) / 2;
        const drawY = y + (cellHeight - drawHeight) / 2;
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      });
    }
  }

  function drawText(ctx, width, height) {
    let textAreaWidth, textAreaX, textAreaY;
    
    // Determine text area based on layout
    if (bannerSettings.imageLayout === 'full' || bannerSettings.imageLayout === 'center') {
      // Text overlay on full image
      textAreaWidth = width;
      textAreaX = 0;
      textAreaY = 0;
    } else if (bannerSettings.imageLayout === 'right') {
      textAreaWidth = width * bannerSettings.textImageRatio;
      textAreaX = 0;
      textAreaY = 0;
    } else if (bannerSettings.imageLayout === 'left') {
      textAreaWidth = width * bannerSettings.textImageRatio;
      textAreaX = width - textAreaWidth;
      textAreaY = 0;
    } else if (bannerSettings.imageLayout === 'split') {
      textAreaWidth = width / 2;
      textAreaX = 0;
      textAreaY = 0;
    } else {
      textAreaWidth = width * bannerSettings.textImageRatio;
      textAreaX = 0;
      textAreaY = 0;
    }
    
    // Draw text background
    if (bannerSettings.textBackground && bannerSettings.textBackgroundOpacity > 0) {
      ctx.fillStyle = bannerSettings.textBackground;
      ctx.globalAlpha = bannerSettings.textBackgroundOpacity;
      ctx.fillRect(textAreaX, textAreaY, textAreaWidth, height);
      ctx.globalAlpha = 1.0;
    }
    
    // Text settings
    ctx.fillStyle = bannerSettings.textColor;
    ctx.textAlign = bannerSettings.textAlign;
    ctx.textBaseline = 'top';
    
    const padding = bannerSettings.padding;
    let currentY = height * 0.2;
    const centerX = textAreaX + textAreaWidth / 2;
    const leftX = textAreaX + padding;
    const rightX = textAreaX + textAreaWidth - padding;
    const textX = bannerSettings.textAlign === 'center' ? centerX : 
                  bannerSettings.textAlign === 'right' ? rightX : leftX;
    const maxTextWidth = textAreaWidth - (padding * 2);
    
    // Title (English)
    if (bannerSettings.title) {
      ctx.font = `bold ${bannerSettings.fontSize * 1.2}px ${bannerSettings.fontFamily}`;
      const titleLines = wrapText(ctx, bannerSettings.title, maxTextWidth);
      titleLines.forEach((line, index) => {
        ctx.fillText(line, textX, currentY + (index * bannerSettings.fontSize * 1.5));
      });
      currentY += titleLines.length * bannerSettings.fontSize * 1.5 + 20;
    }
    
    // Decorative line between English and Hebrew
    if (bannerSettings.title && bannerSettings.titleHebrew) {
      const lineY = currentY - 10;
      const lineWidth = maxTextWidth * 0.6;
      const lineX = centerX - (lineWidth / 2);
      
      ctx.strokeStyle = bannerSettings.textColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lineX, lineY);
      ctx.lineTo(lineX + lineWidth, lineY);
      ctx.stroke();
      currentY += 20;
    }
    
    // Title (Hebrew)
    if (bannerSettings.titleHebrew) {
      ctx.font = `bold ${bannerSettings.fontSize * 1.2}px ${bannerSettings.hebrewFontFamily}`;
      const titleHebrewLines = wrapText(ctx, bannerSettings.titleHebrew, maxTextWidth);
      titleHebrewLines.forEach((line, index) => {
        ctx.fillText(line, textX, currentY + (index * bannerSettings.fontSize * 1.5));
      });
      currentY += titleHebrewLines.length * bannerSettings.fontSize * 1.5 + 20;
    }
    
    // Year (English)
    if (bannerSettings.yearEnglish) {
      ctx.font = `${bannerSettings.fontSize * 0.6}px ${bannerSettings.fontFamily}`;
      ctx.fillText(bannerSettings.yearEnglish, textX, currentY);
      currentY += bannerSettings.fontSize * 0.8;
    }
    
    // Year (Hebrew)
    if (bannerSettings.yearHebrew) {
      ctx.font = `${bannerSettings.fontSize * 0.6}px ${bannerSettings.hebrewFontFamily}`;
      ctx.fillText(bannerSettings.yearHebrew, textX, currentY);
      currentY += bannerSettings.fontSize * 0.8;
    }
    
    // Subtitle (English)
    if (bannerSettings.subtitle) {
      ctx.font = `${bannerSettings.fontSize * 0.45}px ${bannerSettings.fontFamily}`;
      const subtitleLines = wrapText(ctx, bannerSettings.subtitle, maxTextWidth);
      subtitleLines.forEach((line, index) => {
        ctx.fillText(line, textX, currentY + (index * bannerSettings.fontSize * 0.7));
      });
      currentY += subtitleLines.length * bannerSettings.fontSize * 0.7;
    }
    
    // Subtitle (Hebrew)
    if (bannerSettings.subtitleHebrew) {
      ctx.font = `${bannerSettings.fontSize * 0.45}px ${bannerSettings.hebrewFontFamily}`;
      const subtitleHebrewLines = wrapText(ctx, bannerSettings.subtitleHebrew, maxTextWidth);
      subtitleHebrewLines.forEach((line, index) => {
        ctx.fillText(line, textX, currentY + (index * bannerSettings.fontSize * 0.7));
      });
    }
  }

  function downloadBanner() {
    if (!generatedBannerUrl) return;
    
    const link = document.createElement('a');
    link.download = `banner-${type}-${Date.now()}.png`;
    link.href = generatedBannerUrl;
    link.click();
  }

  function updateGradientColor(index, color) {
    const colors = [...bannerSettings.backgroundGradient.colors];
    colors[index] = color;
    bannerSettings.backgroundGradient = {
      ...bannerSettings.backgroundGradient,
      colors
    };
  }
</script>

<div class="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-200">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-2xl font-bold text-gray-900">
      Banner Generator - {type === 'lot' ? 'Lot' : type === 'auction' ? 'Auction' : 'Auction House'}
    </h2>
    <button
      onclick={() => showAdvancedSettings = !showAdvancedSettings}
      class="text-sm text-purple-600 hover:text-purple-800"
    >
      {showAdvancedSettings ? 'Hide' : 'Show'} Advanced
    </button>
  </div>
  
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Left: Settings -->
    <div class="space-y-6">
      <!-- Lot Selection (only for lot type) -->
      {#if type === 'lot' && lots && lots.length > 0}
        <div>
          <label for="lot-select" class="block text-sm font-medium text-gray-700 mb-2">
            Select Lot (Optional)
          </label>
          <select
            id="lot-select"
            bind:value={selectedBannerLotId}
            onchange={(e) => loadLotImages(e.target.value)}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          >
            <option value="">-- Use Auction Defaults --</option>
            {#each lots as lot}
              <option value={lot.id}>
                Lot #{lot.lotNumber}: {lot.title}
              </option>
            {/each}
          </select>
        </div>
      {/if}
      
      <!-- Image Selection -->
      {#if selectedLotImages.length > 0}
        <div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">Select Images for Banner</h3>
          <div class="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {#each selectedLotImages as image}
              {@const isSelected = selectedBannerImages.some(sel => sel.id === image.id || sel.url === image.url)}
              <div
                class="relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all {isSelected ? 'border-purple-600 ring-2 ring-purple-300' : 'border-gray-300 hover:border-purple-400'}"
                role="button"
                tabindex="0"
                onclick={() => {
                  if (isSelected) {
                    selectedBannerImages = selectedBannerImages.filter(sel => sel.id !== image.id && sel.url !== image.url);
                  } else {
                    selectedBannerImages = [...selectedBannerImages, image];
                  }
                  if (selectedBannerImages.length > 0) {
                    bannerSettings.primaryImageUrl = selectedBannerImages[0].url;
                    bannerSettings.backgroundImageUrl = selectedBannerImages[0].url;
                  }
                }}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isSelected) {
                      selectedBannerImages = selectedBannerImages.filter(sel => sel.id !== image.id && sel.url !== image.url);
                    } else {
                      selectedBannerImages = [...selectedBannerImages, image];
                    }
                  }
                }}
              >
                <img
                  src={image.displayUrl || image.url}
                  alt="Lot image"
                  class="w-full h-24 object-cover"
                  onerror={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                {#if isSelected}
                  <div class="absolute top-1 right-1 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Image URL Input -->

      

      
      <!-- Layout Presets -->

      
      <!-- Layout Settings -->
      <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Layout</h3>
        
        <div class="mb-4">
          <label for="image-layout" class="block text-sm font-medium text-gray-700 mb-2">
            Image Layout
          </label>
          <select
            id="image-layout"
            bind:value={bannerSettings.imageLayout}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {#each imageLayouts as layout}
              <option value={layout.value}>{layout.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="mb-4">
          <label for="image-position" class="block text-sm font-medium text-gray-700 mb-2">
            Image Position
          </label>
          <select
            id="image-position"
            bind:value={bannerSettings.imagePosition}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="cover">Cover (Fill)</option>
            <option value="contain">Contain (Fit)</option>
          </select>
        </div>
        
        {#if bannerSettings.imageLayout !== 'full' && bannerSettings.imageLayout !== 'center'}
          <div class="mb-4">
            <label for="text-image-ratio" class="block text-sm font-medium text-gray-700 mb-2">
              Text/Image Ratio: {Math.round(bannerSettings.textImageRatio * 100)}% / {Math.round((1 - bannerSettings.textImageRatio) * 100)}%
            </label>
            <input
              id="text-image-ratio"
              type="range"
              min="0.2"
              max="0.8"
              step="0.1"
              bind:value={bannerSettings.textImageRatio}
              class="w-full"
            />
          </div>
        {/if}
        
        <div class="mb-4">
          <label for="image-opacity" class="block text-sm font-medium text-gray-700 mb-2">
            Image Opacity: {Math.round(bannerSettings.imageOpacity * 100)}%
          </label>
          <input
            id="image-opacity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            bind:value={bannerSettings.imageOpacity}
            class="w-full"
          />
        </div>
      </div>
      
      <!-- Background Settings -->
      <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Background</h3>
        
        <div class="mb-4">
          <label for="background-type" class="block text-sm font-medium text-gray-700 mb-2">
            Background Type
          </label>
          <select
            id="background-type"
            bind:value={bannerSettings.backgroundType}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {#each backgroundTypes as bgType}
              <option value={bgType.value}>{bgType.label}</option>
            {/each}
          </select>
        </div>
        
        {#if bannerSettings.backgroundType === 'solid'}
          <div class="mb-4">
            <label for="background-color" class="block text-sm font-medium text-gray-700 mb-2">
              Background Color
            </label>
            <div class="flex gap-2">
              <input
                id="background-color"
                type="color"
                bind:value={bannerSettings.backgroundColor}
                class="h-12 w-20 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                bind:value={bannerSettings.backgroundColor}
                placeholder="#F5F1E8"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        {/if}
        
        {#if bannerSettings.backgroundType === 'gradient'}
          <div class="mb-4">
            <label for="gradient-type" class="block text-sm font-medium text-gray-700 mb-2">
              Gradient Type
            </label>
            <select
              id="gradient-type"
              bind:value={bannerSettings.backgroundGradient.type}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
            >
              <option value="linear">Linear</option>
              <option value="radial">Radial</option>
            </select>
            <div class="block text-sm font-medium text-gray-700 mb-2">Gradient Colors</div>
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
          <div class="mb-4">
            <label for="background-image-url" class="block text-sm font-medium text-gray-700 mb-2">
              Background Image URL
            </label>
            <input
              id="background-image-url"
              type="text"
              bind:value={bannerSettings.backgroundImageUrl}
              placeholder="https://example.com/image.jpg"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
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
          <div class="mb-4">
            <label for="background-pattern" class="block text-sm font-medium text-gray-700 mb-2">
              Pattern Style
            </label>
            <select
              id="background-pattern"
              bind:value={bannerSettings.backgroundPattern}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
            >
              <option value="none">None</option>
              <option value="dots">Dots</option>
              <option value="lines">Lines</option>
              <option value="grid">Grid</option>
              <option value="diagonal">Diagonal</option>
            </select>
            {#if bannerSettings.backgroundPattern !== 'none'}
              <label for="pattern-background-color" class="block text-sm font-medium text-gray-700 mb-2">
                Pattern Base Color
              </label>
              <div class="flex gap-2">
                <input
                  id="pattern-background-color"
                  type="color"
                  bind:value={bannerSettings.backgroundColor}
                  class="h-12 w-20 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  bind:value={bannerSettings.backgroundColor}
                  placeholder="#F5F1E8"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            {/if}
          </div>
        {/if}
      </div>
      
      <!-- Text Content -->
      <div class="p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Text Content</h3>
        
        <div class="mb-4">
          <label for="title-en" class="block text-sm font-medium text-gray-700 mb-2">
            Title (English)
          </label>
          <input
            id="title-en"
            type="text"
            bind:value={bannerSettings.title}
            placeholder="Banner title"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <div class="mb-4">
          <label for="title-he" class="block text-sm font-medium text-gray-700 mb-2">
            Title (Hebrew)
          </label>
          <input
            id="title-he"
            type="text"
            bind:value={bannerSettings.titleHebrew}
            placeholder="כותרת בעברית"
            dir="rtl"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <div class="mb-4">
          <label for="subtitle-en" class="block text-sm font-medium text-gray-700 mb-2">
            Subtitle (English)
          </label>
          <textarea
            id="subtitle-en"
            bind:value={bannerSettings.subtitle}
            placeholder="Banner subtitle"
            rows="2"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          ></textarea>
        </div>
        
        <div class="mb-4">
          <label for="year-en" class="block text-sm font-medium text-gray-700 mb-2">
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
              }
            }}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <!-- Typography Settings -->
      {#if showAdvancedSettings}
        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Typography</h3>
          
          <div class="mb-4">
            <label for="font-size" class="block text-sm font-medium text-gray-700 mb-2">
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
          
          <div class="mb-4">
            <label for="font-family" class="block text-sm font-medium text-gray-700 mb-2">
              English Font
            </label>
            <select
              id="font-family"
              bind:value={bannerSettings.fontFamily}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {#each fonts as font}
                <option value={font.value}>{font.name}</option>
              {/each}
            </select>
          </div>
          
          <div class="mb-4">
            <label for="hebrew-font-family" class="block text-sm font-medium text-gray-700 mb-2">
              Hebrew Font
            </label>
            <select
              id="hebrew-font-family"
              bind:value={bannerSettings.hebrewFontFamily}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {#each hebrewFonts as font}
                <option value={font.value}>{font.name}</option>
              {/each}
            </select>
          </div>
          
          <div class="mb-4">
            <label for="text-color" class="block text-sm font-medium text-gray-700 mb-2">
              Text Color
            </label>
            <input
              id="text-color"
              type="color"
              bind:value={bannerSettings.textColor}
              class="w-full h-12 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div class="mb-4">
            <label for="text-align" class="block text-sm font-medium text-gray-700 mb-2">
              Text Alignment
            </label>
            <select
              id="text-align"
              bind:value={bannerSettings.textAlign}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      {/if}
      
      <!-- Actions -->
      <div class="space-y-3">
        <button
          onclick={generateQuickBanner}
          disabled={generatingBanner || !bannerSettings.title}
          class="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {generatingBanner ? 'Generating...' : 'Generate Banner'}
        </button>
        
        {#if generatedBannerUrl}
          <button
            onclick={downloadBanner}
            class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Download Banner
          </button>
        {/if}
      </div>
    </div>
    
    <!-- Right: Preview -->
    <div>
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
      {#if generatedBannerUrl}
        <img
          src={generatedBannerUrl}
          alt="Generated Banner"
          class="w-full rounded-lg shadow-lg border border-gray-200"
        />
      {:else}
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-gray-600">Configure settings and click "Generate Banner"</p>
        </div>
      {/if}
    </div>
  </div>
</div>
