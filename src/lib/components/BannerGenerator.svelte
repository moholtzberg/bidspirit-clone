<script>
  import ImageSelection from './banner/ImageSelection.svelte';
  import ImageSettings from './banner/ImageSettings.svelte';
  import LayoutSettings from './banner/LayoutSettings.svelte';
  import BackgroundSettings from './banner/BackgroundSettings.svelte';
  import TextContentSettings from './banner/TextContentSettings.svelte';
  import TypographySettings from './banner/TypographySettings.svelte';
  import ImageShadowSettings from './banner/ImageShadowSettings.svelte';
  import BannerPreview from './banner/BannerPreview.svelte';
  import BannerActions from './banner/BannerActions.svelte';
  
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
    imageLayout: 'collage', // 'right', 'left', 'center', 'full', 'collage', 'split'
    imagePosition: 'cover', // 'cover', 'contain', 'repeat'
    imageOpacity: 1.0,
    imageRotation: 0, // Rotation angle in degrees
    imageFlipHorizontal: false, // Flip horizontally
    imageFlipVertical: false, // Flip vertically
    
    // Image size/zoom settings (applies to all layouts)
    imageSize: 1.0, // Size multiplier for images (0.1 to 2.0)
    
    // Collage-specific settings
    collageLayout: 'custom', // Use custom positions by default
    collageImagePositions: [], // Custom positions for each image [{x: 0-100%, y: 0-100%, rotation: 0-360}]
    
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
    fontSize: 42,
    fontFamily: 'Cormorant Garamond, Times New Roman, serif',
    hebrewFontFamily: 'Frank Ruhl Libre, Cardo, serif',
    textColor: '#2C1810',
    textAlign: 'center', // 'left', 'center', 'right'
    textPosition: 'left', // 'left', 'center', 'right' (for text area)
    textBackground: 'rgba(245, 241, 232, 0.95)',
    textBackgroundOpacity: 0.95,
    
    // Per-field text settings
    titleEnglishFontSize: 48,
    titleEnglishAlign: 'center',
    titleHebrewFontSize: 48,
    titleHebrewAlign: 'center',
    subtitleEnglishFontSize: 28,
    subtitleEnglishAlign: 'center',
    subtitleHebrewFontSize: 28,
    subtitleHebrewAlign: 'center',
    yearEnglishFontSize: 76,
    yearEnglishAlign: 'center',
    yearHebrewFontSize: 76,
    yearHebrewAlign: 'center',
    
    // Ribbon
    ribbonColor: '#DC2626', // Default red color for ribbon
    ribbonPosition: 'right', // 'left' or 'right' - position of ribbon on banner
    
    // Bottom Border
    showBottomBorder: false, // Show bottom border with auction info
    bottomBorderColor: '#2563EB', // Default blue color
    
    // Image Shadows
    imageShadowEnabled: false, // Enable shadows on images
    imageShadowColor: 'rgba(0, 0, 0, 0.3)', // Shadow color
    imageShadowBlur: 10, // Shadow blur radius
    imageShadowOffsetX: 8, // Shadow horizontal offset
    imageShadowOffsetY: 8, // Shadow vertical offset
    
    // Spacing
    padding: 30,
    textImageRatio: 0.4, // 0.4 = 40% text, 60% image
  });
  
  let generatedBannerUrl = $state(null);
  let generatingBanner = $state(false);

  let presetPreviews = $state({}); // Store preview URLs for each preset
  let generatingPreviews = $state(false);
  let generatingPresetIds = $state(new Set()); // Track which presets are currently generating
  
  // Collapsible sections state
  let collapsedSections = $state({
    lotSelection: true,
    imageSelection: true,
    imageSettings: true,
    layout: true,
    background: true,
    textContent: true,
    typography: true,
    imageShadows: true
  });

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

  // Apply preset positions for 3 images in collage layout
  function applyPresetCollagePositions() {
    if (selectedBannerImages.length === 0) return;
    
    // Preset positions for 3 images
    const presets = [
      { x: 50, y: 60, zoom: 0.8, zIndex: 3, opacity: 1.0 }, // Center image
      { x: 20, y: 40, zoom: 0.6, zIndex: 1, opacity: 1.0 }, // Image 2
      { x: 80, y: 40, zoom: 0.6, zIndex: 2, opacity: 1.0 },  // Image 3
      { x: 50, y: 20, zoom: 0.55, zIndex: 1, opacity: 1.0 }, // Image 4
    ];
    
    // Apply presets to first 3 images
    selectedBannerImages = selectedBannerImages.map((img, idx) => {
      if (idx < 3 && presets[idx]) {
        return {
          ...img,
          zoom: presets[idx].zoom,
          zIndex: presets[idx].zIndex,
          opacity: presets[idx].opacity ?? img.opacity ?? 1.0
        };
      }
      return {
        ...img,
        opacity: img.opacity ?? 1.0 // Ensure opacity is set
      };
    });
    
    // Initialize custom positions
    bannerSettings.collageImagePositions = selectedBannerImages.map((_, idx) => {
      if (idx < 3 && presets[idx]) {
        return {
          x: presets[idx].x,
          y: presets[idx].y,
          rotation: 0
        };
      }
      // Default positions for additional images
      return {
        x: 20 + (idx * 30) % 60,
        y: 20 + Math.floor(idx / 2) * 30,
        rotation: 0
      };
    });
  }

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
      // Remove the leading ה' prefix
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

  // Auto-generate preview when dependencies change
  let previewGenerationTimeout = null;
  let isInitialMount = true;
  
  $effect(() => {
    // Watch for changes in key state that should trigger preview regeneration
    const lotId = selectedBannerLotId; // Track lot selection
    const imageCount = selectedBannerImages.length; // Track image selection
    
    // Track individual image properties by accessing them directly
    // This ensures we catch changes to zoom, opacity, rotation, position, etc.
    for (const img of selectedBannerImages) {
      // Access properties to create reactive dependencies
      const _ = img.id;
      const __ = img.url;
      const ___ = img.zoom;
      const ____ = img.opacity;
      const _____ = img.rotation;
      const ______ = img.flipHorizontal;
      const _______ = img.flipVertical;
      const ________ = img.zIndex;
    }
    
    // Track banner settings - create a reactive dependency by accessing key properties
    const title = bannerSettings.title;
    const titleHebrew = bannerSettings.titleHebrew;
    const subtitle = bannerSettings.subtitle;
    const subtitleHebrew = bannerSettings.subtitleHebrew;
    const yearEnglish = bannerSettings.yearEnglish;
    const yearHebrew = bannerSettings.yearHebrew;
    const category = bannerSettings.category;
    const categoryHebrew = bannerSettings.categoryHebrew;
    const imageLayout = bannerSettings.imageLayout;
    const imagePosition = bannerSettings.imagePosition;
    const imageOpacity = bannerSettings.imageOpacity;
    const imageRotation = bannerSettings.imageRotation;
    const imageFlipHorizontal = bannerSettings.imageFlipHorizontal;
    const imageFlipVertical = bannerSettings.imageFlipVertical;
    const imageSize = bannerSettings.imageSize;
    const backgroundType = bannerSettings.backgroundType;
    const backgroundColor = bannerSettings.backgroundColor;
    const backgroundImageUrl = bannerSettings.backgroundImageUrl;
    const backgroundPattern = bannerSettings.backgroundPattern;
    const fontSize = bannerSettings.fontSize;
    const fontFamily = bannerSettings.fontFamily;
    const hebrewFontFamily = bannerSettings.hebrewFontFamily;
    const textColor = bannerSettings.textColor;
    const textAlign = bannerSettings.textAlign;
    const textImageRatio = bannerSettings.textImageRatio;
    const ribbonColor = bannerSettings.ribbonColor;
    const ribbonPosition = bannerSettings.ribbonPosition;
    const showBottomBorder = bannerSettings.showBottomBorder;
    const bottomBorderColor = bannerSettings.bottomBorderColor;
    const imageShadowEnabled = bannerSettings.imageShadowEnabled;
    const imageShadowColor = bannerSettings.imageShadowColor;
    const imageShadowBlur = bannerSettings.imageShadowBlur;
    const imageShadowOffsetX = bannerSettings.imageShadowOffsetX;
    const imageShadowOffsetY = bannerSettings.imageShadowOffsetY;
    const collageImagePositions = bannerSettings.collageImagePositions;
    
    // Track per-field text settings
    const titleEnglishFontSize = bannerSettings.titleEnglishFontSize;
    const titleEnglishAlign = bannerSettings.titleEnglishAlign;
    const titleHebrewFontSize = bannerSettings.titleHebrewFontSize;
    const titleHebrewAlign = bannerSettings.titleHebrewAlign;
    const subtitleEnglishFontSize = bannerSettings.subtitleEnglishFontSize;
    const subtitleEnglishAlign = bannerSettings.subtitleEnglishAlign;
    const subtitleHebrewFontSize = bannerSettings.subtitleHebrewFontSize;
    const subtitleHebrewAlign = bannerSettings.subtitleHebrewAlign;
    const yearEnglishFontSize = bannerSettings.yearEnglishFontSize;
    const yearEnglishAlign = bannerSettings.yearEnglishAlign;
    const yearHebrewFontSize = bannerSettings.yearHebrewFontSize;
    const yearHebrewAlign = bannerSettings.yearHebrewAlign;
    const textSpacingTitle = bannerSettings.textSpacingTitle;
    const textSpacingYear = bannerSettings.textSpacingYear;
    const textSpacingSubtitle = bannerSettings.textSpacingSubtitle;
    const textLineHeight = bannerSettings.textLineHeight;
    
    // Skip on initial mount to avoid generating empty preview
    if (isInitialMount) {
      isInitialMount = false;
      return;
    }
    
    // Clear any pending generation
    if (previewGenerationTimeout) {
      clearTimeout(previewGenerationTimeout);
    }
    
    // Debounce preview generation to avoid excessive regenerations
    // Only generate if we have at least a title or images
    const shouldGenerate = title || imageCount > 0 || backgroundImageUrl || (type === 'auction' && auction) || (type === 'auctionHouse' && auctionHouse);
    
    if (shouldGenerate) {
      previewGenerationTimeout = setTimeout(() => {
        // Don't regenerate if already generating
        if (!generatingBanner) {
          generateQuickBanner().catch(err => {
            console.error('Error auto-generating preview:', err);
          });
        }
      }, 300); // 300ms debounce
    }
    
    return () => {
      if (previewGenerationTimeout) {
        clearTimeout(previewGenerationTimeout);
      }
    };
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
    
    // Auto-select first image (or primary image) with default orientation, zoom, and z-index
    const primaryImage = imagesWithPresigned.find(img => img.isPrimary) || imagesWithPresigned[0];
    if (primaryImage) {
      selectedBannerImages = [{
        ...primaryImage,
        rotation: bannerSettings.imageRotation ?? 0,
        flipHorizontal: bannerSettings.imageFlipHorizontal ?? false,
        flipVertical: bannerSettings.imageFlipVertical ?? false,
        zoom: 0.8, // Preset zoom for first image
        zIndex: 3, // Preset z-index for first image
        opacity: 1.0, // Default opacity
        isFeatured: true // First/primary image is featured by default
      }];
      // Initialize custom positions with preset
      bannerSettings.collageImagePositions = [{
        x: 50,
        y: 60,
          rotation: 0
      }];
      updatePrimaryImage();
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
    
    // Use selectedBannerImages with their orientation, zoom, opacity, and z-index, or fallback to primaryImageUrl
    const imagesWithOrientation = selectedBannerImages.length > 0 
      ? selectedBannerImages.map((img, idx) => ({
          url: img.url || img.displayUrl || img,
          orientation: {
            rotation: img.rotation ?? bannerSettings.imageRotation ?? 0,
            flipHorizontal: img.flipHorizontal ?? bannerSettings.imageFlipHorizontal ?? false,
            flipVertical: img.flipVertical ?? bannerSettings.imageFlipVertical ?? false
          },
          zoom: img.zoom ?? bannerSettings.imageSize ?? 1.0, // Per-image zoom, fallback to global
          opacity: img.opacity ?? bannerSettings.imageOpacity ?? 1.0, // Per-image opacity, fallback to global
          zIndex: img.zIndex ?? idx, // Per-image z-index, fallback to index
          originalIndex: idx
        }))
      : (bannerSettings.primaryImageUrl ? [{
          url: bannerSettings.primaryImageUrl,
          orientation: {
            rotation: bannerSettings.imageRotation ?? 0,
            flipHorizontal: bannerSettings.imageFlipHorizontal ?? false,
            flipVertical: bannerSettings.imageFlipVertical ?? false
          },
          zoom: bannerSettings.imageSize ?? 1.0,
          opacity: bannerSettings.imageOpacity ?? 1.0,
          zIndex: 0,
          originalIndex: 0
        }] : []);
    
    if (imagesWithOrientation.length === 0 && bannerSettings.backgroundImageUrl && bannerSettings.backgroundType === 'image') {
      imagesWithOrientation.push({
        url: bannerSettings.backgroundImageUrl,
        orientation: {
          rotation: bannerSettings.imageRotation ?? 0,
          flipHorizontal: bannerSettings.imageFlipHorizontal ?? false,
          flipVertical: bannerSettings.imageFlipVertical ?? false
        }
      });
    }
    
    console.log('imagesWithOrientation:', imagesWithOrientation);
    
    if (imagesWithOrientation.length === 0) {
      console.warn('No images to draw');
      return;
    }
    
    // Get presigned URLs (images from mapLot are already presigned, but check anyway)
    const imagesWithUrls = await Promise.all(
      imagesWithOrientation.map(async (imgData) => {
        const imageUrl = imgData.url;
        if (!imageUrl) return null;
        
        // Check if already presigned (has query params)
        const isPresigned = imageUrl.includes('?X-Amz-') || imageUrl.includes('?');
        
        let finalUrl = imageUrl;
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
                  finalUrl = urls[key];
                }
              }
            }
          } catch (error) {
            console.warn('Failed to get presigned URL:', error);
          }
        }
        console.log('Using image URL (already presigned or not S3):', finalUrl);
        return {
          url: finalUrl,
          orientation: imgData.orientation,
          zoom: imgData.zoom ?? bannerSettings.imageSize ?? 1.0, // Include per-image zoom
          zIndex: imgData.zIndex ?? 0 // Include per-image z-index
        };
      })
    );
    
    // Filter out null values
    const validImages = imagesWithUrls.filter(img => img !== null);
    console.log('Valid images:', validImages);
    
    if (validImages.length === 0) {
      console.warn('No valid image URLs after processing');
      return;
    }
    
    // For collage, opacity is handled per-image, so don't set global alpha
    if (bannerSettings.imageLayout !== 'collage') {
    ctx.globalAlpha = bannerSettings.imageOpacity;
    }
    
    switch (bannerSettings.imageLayout) {
      case 'full':
        await drawFullBackgroundImage(ctx, width, height, validImages[0]?.url, validImages[0]?.orientation, validImages[0]?.zoom);
        break;
      case 'center':
        await drawCenterImage(ctx, width, height, validImages);
        break;
      case 'collage':
        await drawCollage(ctx, width, height, validImages);
        break;
      case 'split':
        await drawSplitImage(ctx, width, height, validImages[0]?.url, validImages[0]?.orientation, validImages[0]?.zoom);
        break;
      case 'right':
        await drawRightImage(ctx, width, height, validImages);
        break;
      case 'left':
        await drawLeftImage(ctx, width, height, validImages);
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

  // Helper function to apply shadow settings
  function applyImageShadow(ctx) {
    if (bannerSettings.imageShadowEnabled) {
      ctx.shadowColor = bannerSettings.imageShadowColor;
      ctx.shadowBlur = bannerSettings.imageShadowBlur;
      ctx.shadowOffsetX = bannerSettings.imageShadowOffsetX;
      ctx.shadowOffsetY = bannerSettings.imageShadowOffsetY;
    } else {
      // Clear shadow settings
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }

  // Helper function to apply image transformations (rotation, flip)
  // Accepts optional per-image orientation, falls back to global settings
  function applyImageTransform(ctx, img, x, y, drawWidth, drawHeight, imageOrientation = null) {
    ctx.save();
    
    // Apply shadow before drawing
    applyImageShadow(ctx);
    
    // Move to center of image
    const centerX = x + drawWidth / 2;
    const centerY = y + drawHeight / 2;
    ctx.translate(centerX, centerY);
    
    // Use per-image orientation if provided, otherwise use global settings
    const rotation = imageOrientation?.rotation ?? bannerSettings.imageRotation ?? 0;
    const flipHorizontal = imageOrientation?.flipHorizontal ?? bannerSettings.imageFlipHorizontal ?? false;
    const flipVertical = imageOrientation?.flipVertical ?? bannerSettings.imageFlipVertical ?? false;
    
    // Apply rotation
    if (rotation !== 0) {
      const rotationRad = (rotation * Math.PI) / 180;
      ctx.rotate(rotationRad);
    }
    
    // Apply flips
    let scaleX = 1;
    let scaleY = 1;
    if (flipHorizontal) scaleX = -1;
    if (flipVertical) scaleY = -1;
    ctx.scale(scaleX, scaleY);
    
    // Draw image centered
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    
    ctx.restore();
  }

  async function drawFullBackgroundImage(ctx, width, height, imageUrl, orientation = null, zoom = null) {
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
        let scale, x, y;
        if (bannerSettings.imagePosition === 'cover') {
          scale = Math.max(width / img.width, height / img.height);
          x = (width - img.width * scale) / 2;
          y = (height - img.height * scale) / 2;
        } else {
          scale = Math.min(width / img.width, height / img.height);
          x = (width - img.width * scale) / 2;
          y = (height - img.height * scale) / 2;
        }
        let drawWidth = img.width * scale;
        let drawHeight = img.height * scale;
        
        // Apply image size/zoom multiplier
        drawWidth *= bannerSettings.imageSize;
        drawHeight *= bannerSettings.imageSize;
        
        // Recalculate position to keep image centered after size change
        x = (width - drawWidth) / 2;
        y = (height - drawHeight) / 2;
        
        // Apply transformations with per-image orientation
        applyImageTransform(ctx, img, x, y, drawWidth, drawHeight, orientation);
        
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

  async function drawCenterImage(ctx, width, height, images) {
    if (images.length === 0 || !images[0]?.url) {
      console.warn('No image URL for drawCenterImage');
      return;
    }
    const imageData = images[0];
    return new Promise(async (resolve) => {
      const img = new Image();
      const srcUrl = await loadImageForCanvas(imageData.url);
      img.onload = () => {
        console.log('Center image loaded successfully');
        let imgSize = Math.min(width, height) * 0.6;
        
        // Apply image size/zoom multiplier (use per-image zoom if available)
        const imageZoom = imageData.zoom ?? bannerSettings.imageSize ?? 1.0;
        imgSize *= imageZoom;
        
        const x = (width - imgSize) / 2;
        const y = (height - imgSize) / 2;
        
        // Apply transformations with per-image orientation
        applyImageTransform(ctx, img, x, y, imgSize, imgSize, imageData.orientation);
        
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      img.onerror = (error) => {
        console.error('Failed to load center image:', imageData.url, error);
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      console.log('Loading center image:', imageData.url);
      img.src = srcUrl;
    });
  }

  async function drawRightImage(ctx, width, height, images) {
    if (images.length === 0 || !images[0]?.url) {
      console.warn('No image URL for drawRightImage');
      return;
    }
    const imageData = images[0];
    const textAreaWidth = width * bannerSettings.textImageRatio;
    const imgAreaWidth = width - textAreaWidth;
    const imgAreaX = textAreaWidth;
    
    return new Promise(async (resolve) => {
      const img = new Image();
      const srcUrl = await loadImageForCanvas(imageData.url);
      img.onload = () => {
        console.log('Right image loaded successfully');
        let scale, drawWidth, drawHeight, x, y;
        if (bannerSettings.imagePosition === 'cover') {
          scale = Math.max(imgAreaWidth / img.width, height / img.height);
          drawWidth = img.width * scale;
          drawHeight = img.height * scale;
          x = imgAreaX + (imgAreaWidth - drawWidth) / 2;
          y = (height - drawHeight) / 2;
        } else {
          scale = Math.min(imgAreaWidth / img.width, height / img.height);
          drawWidth = img.width * scale;
          drawHeight = img.height * scale;
          x = imgAreaX + (imgAreaWidth - drawWidth) / 2;
          y = (height - drawHeight) / 2;
        }
        
        // Apply image size/zoom multiplier (use per-image zoom if available)
        const imageZoom = imageData.zoom ?? bannerSettings.imageSize ?? 1.0;
        drawWidth *= imageZoom;
        drawHeight *= imageZoom;
        
        // Recalculate position to keep image centered after size change
        x = imgAreaX + (imgAreaWidth - drawWidth) / 2;
        y = (height - drawHeight) / 2;
        
        // Apply transformations with per-image orientation
        applyImageTransform(ctx, img, x, y, drawWidth, drawHeight, imageData.orientation);
        
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      img.onerror = (error) => {
        console.error('Failed to load right image:', imageData.url, error);
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      console.log('Loading right image:', imageData.url);
      img.src = srcUrl;
    });
  }

  async function drawLeftImage(ctx, width, height, images) {
    if (images.length === 0 || !images[0]?.url) {
      console.warn('No image URL for drawLeftImage');
      return;
    }
    const imageData = images[0];
    const textAreaWidth = width * bannerSettings.textImageRatio;
    const imgAreaWidth = width - textAreaWidth;
    
    return new Promise(async (resolve) => {
      const img = new Image();
      const srcUrl = await loadImageForCanvas(imageData.url);
      img.onload = () => {
        console.log('Left image loaded successfully');
        let scale, drawWidth, drawHeight, x, y;
        if (bannerSettings.imagePosition === 'cover') {
          scale = Math.max(imgAreaWidth / img.width, height / img.height);
          drawWidth = img.width * scale;
          drawHeight = img.height * scale;
          x = (imgAreaWidth - drawWidth) / 2;
          y = (height - drawHeight) / 2;
        } else {
          scale = Math.min(imgAreaWidth / img.width, height / img.height);
          drawWidth = img.width * scale;
          drawHeight = img.height * scale;
          x = (imgAreaWidth - drawWidth) / 2;
          y = (height - drawHeight) / 2;
        }
        
        // Apply image size/zoom multiplier (use per-image zoom if available)
        const imageZoom = imageData.zoom ?? bannerSettings.imageSize ?? 1.0;
        drawWidth *= imageZoom;
        drawHeight *= imageZoom;
        
        // Recalculate position to keep image centered after size change
        x = (imgAreaWidth - drawWidth) / 2;
        y = (height - drawHeight) / 2;
        
        // Apply transformations with per-image orientation
        applyImageTransform(ctx, img, x, y, drawWidth, drawHeight, imageData.orientation);
        
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      img.onerror = (error) => {
        console.error('Failed to load left image:', imageData.url, error);
        if (srcUrl.startsWith('blob:')) {
          URL.revokeObjectURL(srcUrl);
        }
        resolve();
      };
      console.log('Loading left image:', imageData.url);
      img.src = srcUrl;
    });
  }

  async function drawSplitImage(ctx, width, height, imageUrl, orientation = null, zoom = null) {
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
        const baseScale = Math.max(splitPoint / img.width, height / img.height);
        const imageZoom = zoom ?? bannerSettings.imageSize ?? 1.0;
        const scale = baseScale * imageZoom;
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const x = splitPoint + (splitPoint - drawWidth) / 2;
        const y = (height - drawHeight) / 2;
        
        // Apply transformations with per-image orientation
        applyImageTransform(ctx, img, x, y, drawWidth, drawHeight, orientation);
        
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

  async function drawCollage(ctx, width, height, images) {
    if (images.length === 0) {
      console.warn('No images for drawCollage');
      return;
    }
    
    console.log('Loading collage images:', images);
    
    const loadedImages = await Promise.all(
      images.map(async (imageData, originalIndex) => {
        if (!imageData?.url) return null;
        const srcUrl = await loadImageForCanvas(imageData.url);
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            console.log('Collage image loaded:', imageData.url);
            resolve({
              img,
              orientation: imageData.orientation,
              zoom: imageData.zoom ?? bannerSettings.imageSize ?? 1.0,
              zIndex: imageData.zIndex ?? originalIndex,
              originalIndex // Keep original index for reference
            });
          };
          img.onerror = (error) => {
            console.error('Failed to load collage image:', imageData.url, error);
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
    
    // Sort images by z-index (lower z-index drawn first, so higher z-index appears on top)
    validImages.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    
    const textAreaWidth = width * bannerSettings.textImageRatio;
    const imgAreaWidth = width - textAreaWidth;
    const imgAreaX = textAreaWidth;
    const imgAreaHeight = height;
    
    // Helper function to calculate alignment offset
    function getAlignmentOffset(alignment, areaWidth, areaHeight, itemWidth, itemHeight) {
      let offsetX = 0;
      let offsetY = 0;
      
      if (alignment.includes('left')) {
        offsetX = 0;
      } else if (alignment.includes('right')) {
        offsetX = areaWidth - itemWidth;
      } else {
        offsetX = (areaWidth - itemWidth) / 2; // center
      }
      
      if (alignment.includes('top')) {
        offsetY = 0;
      } else if (alignment.includes('bottom')) {
        offsetY = areaHeight - itemHeight;
      } else {
        offsetY = (areaHeight - itemHeight) / 2; // center
      }
      
      return { offsetX, offsetY };
    }
    
    // Custom layout: use user-defined positions (default to custom if positions exist)
    if ((bannerSettings.collageLayout === 'custom' || bannerSettings.collageImagePositions.length > 0) && bannerSettings.collageImagePositions.length > 0) {
      validImages.forEach((imageData, index) => {
        const { img, orientation, zoom } = imageData;
        const customPos = bannerSettings.collageImagePositions[imageData.originalIndex ?? index];
        if (!customPos) return;
        
        // Get per-image opacity (for collage, use per-image opacity)
        const imageOpacity = imageData.opacity ?? bannerSettings.imageOpacity ?? 1.0;
        
        const baseSize = Math.min(imgAreaWidth, imgAreaHeight) * zoom;
        const scale = Math.min(baseSize / img.width, baseSize / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        
        // Convert percentage to pixel coordinates
        const x = imgAreaX + (imgAreaWidth * customPos.x / 100) - (drawWidth / 2);
        const y = (imgAreaHeight * customPos.y / 100) - (drawHeight / 2);
        
        ctx.save();
        // Apply per-image opacity for collage
        ctx.globalAlpha = imageOpacity;
        
        // Apply shadow before drawing
        applyImageShadow(ctx);
        
        ctx.translate(x + drawWidth / 2, y + drawHeight / 2);
        ctx.rotate((customPos.rotation || 0) * Math.PI / 180);
        
        // Apply per-image transformations
        if (orientation) {
          const rotationRad = (orientation.rotation * Math.PI) / 180;
          ctx.rotate(rotationRad);
          let scaleX = orientation.flipHorizontal ? -1 : 1;
          let scaleY = orientation.flipVertical ? -1 : 1;
          ctx.scale(scaleX, scaleY);
        }
        
        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();
      });
      return;
    }
    
    // Grid layout
    if (bannerSettings.collageLayout === 'grid' || (bannerSettings.collageLayout === 'auto' && validImages.length >= 4)) {
      const cols = bannerSettings.collageLayout === 'grid' ? bannerSettings.collageGridColumns : Math.ceil(Math.sqrt(validImages.length));
      const rows = Math.ceil(validImages.length / cols);
      
      const spacing = bannerSettings.collageSpacing;
      const totalSpacing = spacing * (cols - 1);
      const totalSpacingV = spacing * (rows - 1);
      const cellWidth = (imgAreaWidth - totalSpacing) / cols;
      const cellHeight = (imgAreaHeight - totalSpacingV) / rows;
      
      validImages.forEach((imageData, index) => {
        const { img, orientation, zoom } = imageData;
        const originalIndex = imageData.originalIndex ?? index;
        const col = originalIndex % cols;
        const row = Math.floor(originalIndex / cols);
        const baseX = imgAreaX + col * (cellWidth + spacing);
        const baseY = row * (cellHeight + spacing);
        
        const scale = Math.min(cellWidth / img.width, cellHeight / img.height) * zoom;
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        
        // Apply alignment
        const align = getAlignmentOffset(bannerSettings.collageAlignment, cellWidth, cellHeight, drawWidth, drawHeight);
        const x = baseX + align.offsetX;
        const y = baseY + align.offsetY;
        
        ctx.save();
        applyImageShadow(ctx);
        applyImageTransform(ctx, img, x, y, drawWidth, drawHeight, orientation);
        ctx.restore();
      });
      return;
    }
    
    // Circle layout
    if (bannerSettings.collageLayout === 'circle' || (bannerSettings.collageLayout === 'auto' && validImages.length === 3)) {
      const centerX = imgAreaX + imgAreaWidth / 2;
      const centerY = imgAreaHeight / 2;
      const radius = Math.min(imgAreaWidth, imgAreaHeight) * bannerSettings.collageRadius;
      
      const imageData = validImages.map((imageData, sortedIndex) => {
        const { img, orientation, zoom, originalIndex } = imageData;
        const baseSize = Math.min(imgAreaWidth, imgAreaHeight) * zoom;
        const scale = Math.min(baseSize / img.width, baseSize / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        
        // Use original index for positioning to maintain layout
        const positionIndex = originalIndex ?? sortedIndex;
        const angle = (positionIndex * 2 * Math.PI / validImages.length) - Math.PI / 2;
        const baseX = centerX + Math.cos(angle) * radius;
        const baseY = centerY + Math.sin(angle) * radius;
        const rotation = angle + Math.PI / 2;
        
        const behindIndex = (positionIndex + validImages.length - 1) % validImages.length;
        const behindAngle = (behindIndex * 2 * Math.PI / validImages.length) - Math.PI / 2;
        const offsetX = Math.cos(behindAngle) * bannerSettings.collageSpacing;
        const offsetY = Math.sin(behindAngle) * bannerSettings.collageSpacing;
        
        return { img, drawWidth, drawHeight, x: baseX + offsetX, y: baseY + offsetY, rotation, sortedIndex, orientation, zIndex: imageData.zIndex };
      });
      
      // Draw in z-index order (already sorted, but maintain for clarity)
      imageData.forEach((data) => {
        ctx.save();
        
        // Apply configurable shadow
        applyImageShadow(ctx);
        
        ctx.translate(data.x, data.y);
        ctx.rotate(data.rotation);
        
        if (data.orientation) {
          const rotationRad = (data.orientation.rotation * Math.PI) / 180;
          ctx.rotate(rotationRad);
          let scaleX = data.orientation.flipHorizontal ? -1 : 1;
          let scaleY = data.orientation.flipVertical ? -1 : 1;
          ctx.scale(scaleX, scaleY);
        }
        
        ctx.drawImage(data.img, -data.drawWidth / 2, -data.drawHeight / 2, data.drawWidth, data.drawHeight);
        ctx.restore();
      });
      return;
    }
    
    // Stacked layout
    if (bannerSettings.collageLayout === 'stacked') {
      const spacing = bannerSettings.collageSpacing;
      
      validImages.forEach((imageData, sortedIndex) => {
        const { img, orientation, zoom, originalIndex } = imageData;
        const baseSize = Math.min(imgAreaWidth, imgAreaHeight) * zoom;
        const scale = Math.min(baseSize / img.width, baseSize / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        
        // Use original index for offset to maintain visual stacking
        const positionIndex = originalIndex ?? sortedIndex;
        const offsetX = positionIndex * spacing * 0.3;
        const offsetY = positionIndex * spacing * 0.3;
        const align = getAlignmentOffset(bannerSettings.collageAlignment, imgAreaWidth, imgAreaHeight, drawWidth, drawHeight);
        const x = imgAreaX + align.offsetX + offsetX;
        const y = align.offsetY + offsetY;
        
        ctx.save();
        ctx.shadowColor = `rgba(0, 0, 0, ${0.1 + (imageData.zIndex ?? sortedIndex) * 0.05})`;
        ctx.shadowBlur = 10 + (imageData.zIndex ?? sortedIndex) * 2;
        ctx.shadowOffsetX = 3 + (imageData.zIndex ?? sortedIndex);
        ctx.shadowOffsetY = 3 + (imageData.zIndex ?? sortedIndex);
        applyImageTransform(ctx, img, x, y, drawWidth, drawHeight, orientation);
        ctx.restore();
      });
      return;
    }
    
    // Diagonal layout
    if (bannerSettings.collageLayout === 'diagonal') {
      const spacing = bannerSettings.collageSpacing;
      
      validImages.forEach((imageData, sortedIndex) => {
        const { img, orientation, zoom, originalIndex } = imageData;
        const baseSize = Math.min(imgAreaWidth, imgAreaHeight) * zoom;
        const scale = Math.min(baseSize / img.width, baseSize / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        
        // Use original index for positioning to maintain layout
        const positionIndex = originalIndex ?? sortedIndex;
        const progress = validImages.length > 1 ? positionIndex / (validImages.length - 1) : 0.5;
        const x = imgAreaX + (imgAreaWidth - drawWidth) * progress;
        const y = (imgAreaHeight - drawHeight) * (1 - progress);
        
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        applyImageTransform(ctx, img, x, y, drawWidth, drawHeight, orientation);
        ctx.restore();
      });
      return;
    }
    
    // Scattered layout
    if (bannerSettings.collageLayout === 'scattered') {
      validImages.forEach((imageData, sortedIndex) => {
        const { img, orientation, zoom, originalIndex } = imageData;
        const baseSize = Math.min(imgAreaWidth, imgAreaHeight) * zoom;
        const scale = Math.min(baseSize / img.width, baseSize / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        
        // Use original index for positioning to maintain layout
        const positionIndex = originalIndex ?? sortedIndex;
        // Random-ish but deterministic positions based on original index
        const seed = positionIndex * 137.508; // Golden angle approximation
        const angle = seed % (Math.PI * 2);
        const distance = (imgAreaWidth * 0.3) * (0.3 + (positionIndex % 3) * 0.2);
        const centerX = imgAreaX + imgAreaWidth / 2;
        const centerY = imgAreaHeight / 2;
        const x = centerX + Math.cos(angle) * distance - drawWidth / 2;
        const y = centerY + Math.sin(angle) * distance - drawHeight / 2;
        
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.translate(x + drawWidth / 2, y + drawHeight / 2);
        ctx.rotate((angle * 180 / Math.PI) * 0.1); // Slight rotation
        applyImageTransform(ctx, img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight, orientation);
        ctx.restore();
      });
      return;
    }
    
    // Auto layout (original logic for 1, 2, 3, 4+ images)
    if (validImages.length === 1) {
      const { img, orientation, zoom } = validImages[0];
      const baseSize = Math.min(imgAreaWidth, imgAreaHeight) * zoom;
      const scale = Math.min(baseSize / img.width, baseSize / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const x = imgAreaX + (imgAreaWidth - drawWidth) / 2;
      const y = (imgAreaHeight - drawHeight) / 2;
      applyImageTransform(ctx, img, x, y, drawWidth, drawHeight, orientation);
    } else if (validImages.length === 2) {
      // 2 images: first image bottom left, second slightly behind it on top right
      const { img: img1, orientation: orientation1, zoom: zoom1 } = validImages[0];
      const { img: img2, orientation: orientation2, zoom: zoom2 } = validImages[1];
      
      // Calculate sizes - use per-image zoom
      const baseSize1 = Math.min(imgAreaWidth, imgAreaHeight) * zoom1;
      const baseSize2 = Math.min(imgAreaWidth, imgAreaHeight) * zoom2;
      
      // Scale each image to fit, maintaining aspect ratio
      const scale1 = Math.min(baseSize1 / img1.width, baseSize1 / img1.height);
      const scale2 = Math.min(baseSize2 / img2.width, baseSize2 / img2.height);
      
      const drawWidth1 = img1.width * scale1;
      const drawHeight1 = img1.height * scale1;
      const drawWidth2 = img2.width * scale2;
      const drawHeight2 = img2.height * scale2;
      
      // First image: bottom left with better positioning
      const x1 = imgAreaX + imgAreaWidth * 0.08; // 8% from left
      const y1 = imgAreaHeight - drawHeight1 - imgAreaHeight * 0.08; // 8% from bottom
      
      // Second image: top right, slightly behind (offset and rotated)
      const offsetX = bannerSettings.collageSpacing; // Configurable spacing
      const offsetY = -bannerSettings.collageSpacing;
      const x2 = imgAreaX + imgAreaWidth * 0.55 - offsetX; // More to the right
      const y2 = imgAreaHeight * 0.08 - offsetY; // 8% from top
      
      // Add subtle shadow to second image for depth
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      
      // Draw second image first (behind), with slight rotation
      ctx.translate(x2 + drawWidth2 / 2, y2 + drawHeight2 / 2);
      ctx.rotate(-0.08); // Slightly more rotation (about 4.5 degrees)
      
      // Apply per-image transformations
      const rotationRad = ((orientation2?.rotation ?? 0) * Math.PI) / 180;
      ctx.rotate(rotationRad);
      let scaleX = orientation2?.flipHorizontal ? -1 : 1;
      let scaleY = orientation2?.flipVertical ? -1 : 1;
      ctx.scale(scaleX, scaleY);
      
      ctx.drawImage(img2, -drawWidth2 / 2, -drawHeight2 / 2, drawWidth2, drawHeight2);
      ctx.restore();
      
      // Draw first image on top (foreground) with per-image transformations and shadow
      ctx.save();
      applyImageShadow(ctx);
      applyImageTransform(ctx, img1, x1, y1, drawWidth1, drawHeight1, orientation1);
      ctx.restore();
      
    } else if (validImages.length === 3) {
      // 3 images: circular arrangement with each slightly behind the next
      // Layering: 2 behind 1, 3 behind 2, 1 behind 3 (circular)
      const centerX = imgAreaX + imgAreaWidth / 2;
      const centerY = imgAreaHeight / 2;
      const radius = Math.min(imgAreaWidth, imgAreaHeight) * bannerSettings.collageRadius; // Configurable radius
      
      // Prepare image data with positions
      const imageData = validImages.map((imageData, sortedIndex) => {
        const { img, orientation, zoom, originalIndex } = imageData;
        const baseSize = Math.min(imgAreaWidth, imgAreaHeight) * zoom;
        const scale = Math.min(baseSize / img.width, baseSize / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        
        // Use original index for positioning to maintain layout
        const positionIndex = originalIndex ?? sortedIndex;
        // Position in circle: 120 degrees apart (360/3)
        const angle = (positionIndex * 2 * Math.PI / 3) - Math.PI / 2; // Start from top
        const baseX = centerX + Math.cos(angle) * radius;
        const baseY = centerY + Math.sin(angle) * radius;
        
        // Rotation for each image (more dynamic tilt)
        const rotation = angle + Math.PI / 2 + (positionIndex % 2 === 0 ? 0.1 : -0.1); // Alternating slight tilt
        
        // Offset to create "behind" effect - each image is slightly offset inward
        // Image 1 is behind 3, Image 2 is behind 1, Image 3 is behind 2
        const behindIndex = (positionIndex + 2) % 3; // Which image this one is behind
        const behindAngle = (behindIndex * 2 * Math.PI / 3) - Math.PI / 2;
        const offsetX = Math.cos(behindAngle) * bannerSettings.collageSpacing; // Configurable spacing
        const offsetY = Math.sin(behindAngle) * bannerSettings.collageSpacing;
        
        return {
          img,
          drawWidth,
          drawHeight,
          x: baseX + offsetX,
          y: baseY + offsetY,
          rotation,
          sortedIndex,
          zIndex: imageData.zIndex ?? sortedIndex,
          orientation
        };
      });
      
      // Draw in z-index order (already sorted, but maintain for clarity)
      imageData.forEach((data) => {
        ctx.save();
        
        // Apply configurable shadow
        applyImageShadow(ctx);
        
        ctx.translate(data.x, data.y);
        ctx.rotate(data.rotation);
        
        // Apply per-image transformations on top of existing rotation
        if (data.orientation) {
          const rotationRad = (data.orientation.rotation * Math.PI) / 180;
          ctx.rotate(rotationRad);
          let scaleX = data.orientation.flipHorizontal ? -1 : 1;
          let scaleY = data.orientation.flipVertical ? -1 : 1;
          ctx.scale(scaleX, scaleY);
        }
        
        ctx.drawImage(data.img, -data.drawWidth / 2, -data.drawHeight / 2, data.drawWidth, data.drawHeight);
        ctx.restore();
      });
      
    } else {
      // 4+ images: Improved grid layout with spacing and shadows
      const cols = Math.ceil(Math.sqrt(validImages.length));
      const rows = Math.ceil(validImages.length / cols);
      
      // Add padding between images
      const padding = 8;
      const totalPadding = padding * (cols - 1);
      const totalPaddingV = padding * (rows - 1);
      const cellWidth = (imgAreaWidth - totalPadding) / cols;
      const cellHeight = (imgAreaHeight - totalPaddingV) / rows;
      
      validImages.forEach((imageData, sortedIndex) => {
        const { img, orientation, zoom, originalIndex } = imageData;
        // Use original index for positioning to maintain layout
        const positionIndex = originalIndex ?? sortedIndex;
        const col = positionIndex % cols;
        const row = Math.floor(positionIndex / cols);
        const x = imgAreaX + col * (cellWidth + padding);
        const y = row * (cellHeight + padding);
        
        // Scale to fit with some margin, using per-image zoom
        const margin = 4;
        const baseScale = Math.min(
          (cellWidth - margin * 2) / img.width,
          (cellHeight - margin * 2) / img.height
        );
        const scale = baseScale * zoom;
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const drawX = x + (cellWidth - drawWidth) / 2;
        const drawY = y + (cellHeight - drawHeight) / 2;
        
        // Apply per-image transformations with shadow
        ctx.save();
        applyImageShadow(ctx);
        applyImageTransform(ctx, img, drawX, drawY, drawWidth, drawHeight, orientation);
        ctx.restore();
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
    
    // Draw background pattern on text area if pattern is enabled
    if (bannerSettings.backgroundType === 'pattern' && bannerSettings.backgroundPattern !== 'none') {
      ctx.save();
      // Clip to text area
      ctx.beginPath();
      ctx.rect(textAreaX, textAreaY, textAreaWidth, height);
      ctx.clip();
      // Translate to text area origin and draw pattern
      ctx.translate(textAreaX, textAreaY);
      drawBackgroundPattern(ctx, textAreaWidth, height, bannerSettings.backgroundPattern);
      ctx.restore();
    }
    
    // Text settings
    ctx.fillStyle = bannerSettings.textColor;
    ctx.textBaseline = 'top';
    
    const padding = bannerSettings.padding;
    let currentY = height * 0.2;
    const centerX = textAreaX + textAreaWidth / 2;
    const leftX = textAreaX + padding;
    const rightX = textAreaX + textAreaWidth - padding;
    const maxTextWidth = textAreaWidth - (padding * 2);
    
    // Title (English)
    if (bannerSettings.title) {
      const fontSize = bannerSettings.titleEnglishFontSize || bannerSettings.fontSize * 1.2;
      const textAlign = bannerSettings.titleEnglishAlign || bannerSettings.textAlign;
      const textX = textAlign === 'center' ? centerX : 
                    textAlign === 'right' ? rightX : leftX;
      
      const lineHeight = bannerSettings.textLineHeight ?? 1.2;
      ctx.font = `bold ${fontSize}px ${bannerSettings.fontFamily}`;
      ctx.textAlign = textAlign;
      const titleLines = wrapText(ctx, bannerSettings.title, maxTextWidth);
      titleLines.forEach((line, index) => {
        ctx.fillText(line, textX, currentY + (index * fontSize * lineHeight));
      });
      currentY += titleLines.length * fontSize * lineHeight + (bannerSettings.textSpacingTitle ?? 20);
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
      const fontSize = bannerSettings.titleHebrewFontSize || bannerSettings.fontSize * 1.2;
      const textAlign = bannerSettings.titleHebrewAlign || bannerSettings.textAlign;
      const textX = textAlign === 'center' ? centerX : 
                    textAlign === 'right' ? rightX : leftX;
      
      const lineHeight = bannerSettings.textLineHeight ?? 1.2;
      ctx.font = `bold ${fontSize}px ${bannerSettings.hebrewFontFamily}`;
      ctx.textAlign = textAlign;
      const titleHebrewLines = wrapText(ctx, bannerSettings.titleHebrew, maxTextWidth);
      titleHebrewLines.forEach((line, index) => {
        ctx.fillText(line, textX, currentY + (index * fontSize * lineHeight));
      });
      currentY += titleHebrewLines.length * fontSize * lineHeight + (bannerSettings.textSpacingTitle ?? 20);
    }
    
    // Year (English and Hebrew) - Larger and more prominent, on same line with separator
    if (bannerSettings.yearEnglish || bannerSettings.yearHebrew) {
      ctx.textBaseline = 'middle';
      
      const englishFontSize = bannerSettings.yearEnglishFontSize || bannerSettings.fontSize * 1.8;
      const hebrewFontSize = bannerSettings.yearHebrewFontSize || bannerSettings.fontSize * 1.8;
      const yearAlign = bannerSettings.yearEnglishAlign || bannerSettings.yearHebrewAlign || 'center';
      const yearY = currentY + Math.max(englishFontSize, hebrewFontSize) / 2;
      
      // If both years exist, draw them separately with a decorative separator
      if (bannerSettings.yearEnglish && bannerSettings.yearHebrew) {
        // Measure text widths
        ctx.font = `bold ${englishFontSize}px ${bannerSettings.fontFamily}`;
        const englishWidth = ctx.measureText(bannerSettings.yearEnglish).width;
        
        ctx.font = `bold ${hebrewFontSize}px ${bannerSettings.hebrewFontFamily}`;
        const hebrewWidth = ctx.measureText(bannerSettings.yearHebrew).width;
        
        // Even spacing on both sides of separator
        const spacing = Math.max(englishFontSize, hebrewFontSize) * 0.3;
        const separatorSize = Math.max(englishFontSize, hebrewFontSize) * 0.15;
        const totalWidth = englishWidth + spacing + separatorSize + spacing + hebrewWidth;
        
        // Calculate start position based on alignment
        let startX;
        if (yearAlign === 'center') {
          startX = centerX - totalWidth / 2;
        } else if (yearAlign === 'right') {
          startX = rightX - totalWidth;
        } else {
          startX = leftX;
        }
        
        // Draw English year
        ctx.font = `bold ${englishFontSize}px ${bannerSettings.fontFamily}`;
        ctx.textAlign = 'right';
        ctx.fillText(bannerSettings.yearEnglish, startX + englishWidth, yearY);
        
        // Draw decorative separator (diamond) - centered between the two years
        const separatorX = startX + englishWidth + spacing + separatorSize / 2;
        ctx.fillStyle = bannerSettings.textColor;
        ctx.save();
        ctx.translate(separatorX, yearY);
        ctx.rotate(Math.PI / 4); // Rotate 45 degrees for diamond
        ctx.fillRect(-separatorSize / 2, -separatorSize / 2, separatorSize, separatorSize);
        ctx.restore();
        
        // Draw Hebrew year
        ctx.font = `bold ${hebrewFontSize}px ${bannerSettings.hebrewFontFamily}`;
        ctx.textAlign = 'left';
        ctx.fillText(bannerSettings.yearHebrew, startX + englishWidth + spacing + separatorSize + spacing, yearY);
      } else {
        // Single year
        const fontSize = bannerSettings.yearEnglish ? englishFontSize : hebrewFontSize;
        const fontFamily = bannerSettings.yearEnglish ? bannerSettings.fontFamily : bannerSettings.hebrewFontFamily;
        const yearText = bannerSettings.yearEnglish || bannerSettings.yearHebrew;
        const textX = yearAlign === 'center' ? centerX : 
                      yearAlign === 'right' ? rightX : leftX;
        
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = yearAlign;
        ctx.fillText(yearText, textX, yearY);
      }
      
      currentY += Math.max(englishFontSize, hebrewFontSize) * (bannerSettings.textLineHeight ?? 1.2) + (bannerSettings.textSpacingYear ?? 20);
    }
    
    // Reset text baseline
    ctx.textBaseline = 'top';
    
    // Subtitle (English)
    if (bannerSettings.subtitle) {
      const fontSize = bannerSettings.subtitleEnglishFontSize || bannerSettings.fontSize * 0.45;
      const textAlign = bannerSettings.subtitleEnglishAlign || bannerSettings.textAlign;
      const textX = textAlign === 'center' ? centerX : 
                    textAlign === 'right' ? rightX : leftX;
      const lineHeight = bannerSettings.textLineHeight ?? 1.2;
      
      ctx.font = `${fontSize}px ${bannerSettings.fontFamily}`;
      ctx.textAlign = textAlign;
      const subtitleLines = wrapText(ctx, bannerSettings.subtitle, maxTextWidth);
      subtitleLines.forEach((line, index) => {
        ctx.fillText(line, textX, currentY + (index * fontSize * lineHeight));
      });
      currentY += subtitleLines.length * fontSize * lineHeight + (bannerSettings.textSpacingSubtitle ?? 10);
    }
    
    // Subtitle (Hebrew)
    if (bannerSettings.subtitleHebrew) {
      const fontSize = bannerSettings.subtitleHebrewFontSize || bannerSettings.fontSize * 0.45;
      const textAlign = bannerSettings.subtitleHebrewAlign || bannerSettings.textAlign;
      const textX = textAlign === 'center' ? centerX : 
                    textAlign === 'right' ? rightX : leftX;
      const lineHeight = bannerSettings.textLineHeight ?? 1.2;
      
      ctx.font = `${fontSize}px ${bannerSettings.hebrewFontFamily}`;
      ctx.textAlign = textAlign;
      const subtitleHebrewLines = wrapText(ctx, bannerSettings.subtitleHebrew, maxTextWidth);
      subtitleHebrewLines.forEach((line, index) => {
        ctx.fillText(line, textX, currentY + (index * fontSize * lineHeight));
      });
    }
    
    // Ribbon in top corner (left or right)
    if (bannerSettings.category || bannerSettings.categoryHebrew) {
      ctx.save();
      
      // Measure text first to determine ribbon size
      let categoryText = '';
      if (bannerSettings.category) {
        categoryText = bannerSettings.category.toUpperCase();
      }
      if (bannerSettings.categoryHebrew) {
        if (categoryText) categoryText += ' / ';
        categoryText += bannerSettings.categoryHebrew;
      }
      
      // Set font and measure text width
      ctx.font = `bold ${bannerSettings.fontSize * 0.7}px ${bannerSettings.fontFamily}`;
      const textMetrics = ctx.measureText(categoryText);
      const textWidth = textMetrics.width;
      
      // Ribbon dimensions - bigger with negative margin for overflow effect
      const negativeMargin = 45; // How much ribbon extends beyond canvas
      const ribbonPadding = 40; // Minimal padding for better text centering
      // Add a minimum width if textWidth is less than a threshold
      const minRibbonWidth = 150; // Minimum ribbon width
      const calculatedWidth = (textWidth * 2) + (ribbonPadding * 2);
      const ribbonWidth = Math.max(calculatedWidth, minRibbonWidth);
      const ribbonHeight = 50; // Increased height
      
      // Determine angle and position based on ribbon position setting
      const ribbonPosition = bannerSettings.ribbonPosition || 'right';
      const isRight = ribbonPosition === 'right';
      const angle = isRight ? Math.PI / 4 : -Math.PI / 4; // 45 degrees for right, -45 for left
      
      // Position ribbon so it extends beyond the top corner
      // The ribbon should overflow the canvas edges to look like it's cut off
      const ribbonHalfWidth = ribbonWidth / 2;
      const ribbonHalfHeight = ribbonHeight / 2;
      
      // Calculate where the ribbon center should be so it extends beyond the corner
      // When rotated 45 degrees, the corner offset from center is:
      const cos45 = Math.cos(Math.abs(angle));
      const sin45 = Math.sin(Math.abs(angle));
      const cornerOffsetX = ribbonHalfWidth * cos45 - ribbonHalfHeight * sin45;
      const cornerOffsetY = ribbonHalfWidth * sin45 + ribbonHalfHeight * cos45;
      
      // Position center so ribbon extends beyond top corner of canvas by negativeMargin
      const ribbonCenterX = isRight 
        ? width + negativeMargin - cornerOffsetX  // Top right
        : -negativeMargin + cornerOffsetX;        // Top left
      const ribbonCenterY = -negativeMargin + cornerOffsetY;
      
      // Clip to canvas bounds for overflow cutoff effect
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.clip();
      
      // Create ribbon path (diagonal ribbon shape)
      ctx.translate(ribbonCenterX, ribbonCenterY);
      ctx.rotate(angle);
      
      // Draw ribbon background with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      
      // Ribbon shape (folded ribbon effect)
      ctx.fillStyle = bannerSettings.ribbonColor || '#DC2626';
      ctx.beginPath();
      
      // Main ribbon body (rounded rectangle)
      const cornerRadius = 5;
      const halfWidth = ribbonWidth / 2;
      const halfHeight = ribbonHeight / 2;
      
      // Draw rounded rectangle
      ctx.moveTo(-halfWidth + cornerRadius, -halfHeight);
      ctx.lineTo(halfWidth - cornerRadius, -halfHeight);
      ctx.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + cornerRadius);
      ctx.lineTo(halfWidth, halfHeight - cornerRadius);
      ctx.quadraticCurveTo(halfWidth, halfHeight, halfWidth - cornerRadius, halfHeight);
      ctx.lineTo(-halfWidth + cornerRadius, halfHeight);
      ctx.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - cornerRadius);
      ctx.lineTo(-halfWidth, -halfHeight + cornerRadius);
      ctx.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + cornerRadius, -halfHeight);
      ctx.closePath();
      ctx.fill();
      
      // Add fold effect on top left
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.moveTo(-halfWidth, -halfHeight);
      ctx.lineTo(-halfWidth + 20, -halfHeight - 5);
      ctx.lineTo(-halfWidth + 40, -halfHeight);
      ctx.closePath();
      ctx.fill();
      
      // Add fold effect on bottom right
      ctx.beginPath();
      ctx.moveTo(halfWidth, halfHeight);
      ctx.lineTo(halfWidth - 20, halfHeight + 5);
      ctx.lineTo(halfWidth - 40, halfHeight);
      ctx.closePath();
      ctx.fill();
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Draw text on ribbon (always white for contrast)
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${bannerSettings.fontSize * 0.7}px ${bannerSettings.fontFamily}`;
      ctx.fillText(categoryText, 0, 0);
      
      ctx.restore();
    }
    
    // Bottom Border with Auction Info
    if (bannerSettings.showBottomBorder && (auction || auctionHouse)) {
      ctx.save();
      
      const borderHeight = 70; // Increased height
      const borderY = height - borderHeight;
      
      // Draw border background
      ctx.fillStyle = bannerSettings.bottomBorderColor || '#2563EB';
      ctx.fillRect(0, borderY, width, borderHeight);
      
      // Draw text (white for contrast) - increased font size
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${bannerSettings.fontSize * 0.5}px ${bannerSettings.fontFamily}`;
      
      // Build text content - ensure auction house name is included
      let borderText = '';
      if (auctionHouse && auctionHouse.name) {
        borderText += auctionHouse.name;
      }
      if (auction && auction.title) {
        if (borderText) borderText += ' • ';
        borderText += auction.title;
      }
      if (auction && auction.startDate) {
        if (borderText) borderText += ' • ';
        const date = new Date(auction.startDate);
        const formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        borderText += formattedDate;
      }
      
      if (borderText) {
        // Add padding - increased for larger text
        const padding = 20;
        ctx.fillText(borderText, padding, borderY + borderHeight / 2);
      }
      
      ctx.restore();
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
  
  // Update primary image URL based on featured image or first image
  function updatePrimaryImage() {
    if (selectedBannerImages.length > 0) {
      const featuredImage = selectedBannerImages.find(img => img.isFeatured) || selectedBannerImages[0];
      bannerSettings.primaryImageUrl = featuredImage.url || featuredImage.displayUrl || '';
      bannerSettings.backgroundImageUrl = featuredImage.url || featuredImage.displayUrl || '';
    } else {
      bannerSettings.primaryImageUrl = '';
      bannerSettings.backgroundImageUrl = '';
    }
  }
  
  // Move image up in order
  function moveImageUp(index) {
    if (index > 0) {
      const newImages = [...selectedBannerImages];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      selectedBannerImages = newImages;
      updatePrimaryImage();
    }
  }
  
  // Move image down in order
  function moveImageDown(index) {
    if (index < selectedBannerImages.length - 1) {
      const newImages = [...selectedBannerImages];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      selectedBannerImages = newImages;
      updatePrimaryImage();
    }
  }
</script>

<div class="bg-white rounded-lg shadow-lg p-4 border-2 border-purple-200">
  <div class="flex items-center justify-between mb-3">
    <h2 class="text-xl font-bold text-gray-900">
      Banner Generator - {type === 'lot' ? 'Lot' : type === 'auction' ? 'Auction' : 'Auction House'}
    </h2>
  </div>
  
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <!-- Left: Settings -->
    <div class="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
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
      <ImageSelection
        bind:selectedLotImages
        bind:selectedBannerImages
        bind:bannerSettings
        {applyPresetCollagePositions}
        {updatePrimaryImage}
        bind:isCollapsed={collapsedSections.imageSelection}
      />
      
      <!-- Image Settings -->
      <ImageSettings
        bind:selectedBannerImages
        bind:bannerSettings
        {applyPresetCollagePositions}
        {updatePrimaryImage}
        bind:isCollapsed={collapsedSections.imageSettings}
      />
      
      <!-- Layout Settings -->
      <LayoutSettings
        bind:bannerSettings
        {imageLayouts}
        bind:isCollapsed={collapsedSections.layout}
      />
      
      <!-- Background Settings -->
      <BackgroundSettings
        bind:bannerSettings
        {backgroundTypes}
        {updateGradientColor}
        bind:isCollapsed={collapsedSections.background}
      />
      
      <!-- Text Content -->
      <TextContentSettings
        bind:bannerSettings
        {convertToHebrewYear}
        bind:isCollapsed={collapsedSections.textContent}
      />
      
      <!-- Typography Settings -->
      <TypographySettings
        bind:bannerSettings
        {fonts}
        {hebrewFonts}
        {convertToHebrewYear}
        bind:isCollapsed={collapsedSections.typography}
      />
        
      <!-- Image Shadow Settings -->
      <ImageShadowSettings
        bind:bannerSettings
        bind:isCollapsed={collapsedSections.imageShadows}
      />
    
      <!-- Actions -->
      <BannerActions
        generatingBanner={generatingBanner}
        generatedBannerUrl={generatedBannerUrl}
        onGenerate={generateQuickBanner}
        onDownload={downloadBanner}
        canGenerate={!!bannerSettings.title}
      />
    </div>
    
    <!-- Right: Preview -->
    <BannerPreview {generatedBannerUrl} />
  </div>
</div>
