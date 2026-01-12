(function () {
    if (window.__bidspiritToolbar) return;
    window.__bidspiritToolbar = true;
  
  function isCatalogPage() {
    return location.href.includes('adminConsole') && location.hash.includes('catalog');
  }

  function isExtensionValid() {
    try {
      return chrome.runtime && chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  function safeSendMessage(message, callback) {
    if (!isExtensionValid()) {
      const error = new Error('Extension context invalidated. Please reload the page.');
      if (callback) callback({ ok: false, error: error.message });
      throw error;
    }

    try {
      chrome.runtime.sendMessage(message, (res) => {
        if (chrome.runtime.lastError) {
          if (callback) callback({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        if (callback) callback(res);
      });
    } catch (error) {
      if (callback) callback({ ok: false, error: error.message });
      throw error;
    }
  }

  function extractLotNumberFromRow(row) {
    // Try various selectors for lot number in AG Grid or similar tables
      const lotCell =
      row.querySelector('[col-id="lotNumber"], [data-col-id="lotNumber"]') ||
      row.querySelector('[col-id="lot"], [data-col-id="lot"]') ||
      row.querySelector('[col-id="number"], [data-col-id="number"]') ||
      row.querySelector('.lot-number, .lotNumber') ||
      row.querySelector('[data-lot-number]') ||
      row.querySelector('.ag-cell[col-id*="lot" i]') ||
      row.querySelector('.ag-cell:first-child'); // fallback to first cell

      if (lotCell) {
        const text = (lotCell.dataset?.lotNumber || lotCell.textContent || '').trim();
      const numMatch = text.match(/(\d+)/);
      if (numMatch) return numMatch[1];
    }

    // Try data attributes on the row itself
    if (row.dataset?.lotNumber) return row.dataset.lotNumber;
    if (row.dataset?.lot) return row.dataset.lot;

    return null;
  }
  
  function transformImageUrl(url) {
    if (!url) return url;
    // Replace h_100 with w_1000
    return url.replace(/h_100/g, 'w_1000');
  }

  async function extractImagesFromRow(row, lotNumber) {
    const images = new Set();
    const thumbnailUrls = new Set();
    
    // Extract lot number from row if not provided
    if (!lotNumber) {
      lotNumber = extractLotNumberFromRow(row);
    }
    
    console.log('[BidSpirit] Extracting images for lot', lotNumber);
    
    // Scroll row into view first to ensure it's visible
    try {
      row.scrollIntoView({ behavior: 'instant', block: 'nearest' });
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (e) {
      // Ignore scroll errors
    }
    
    // Find the div with onmouseover that triggers the lightbox
    const lightboxTrigger = row.querySelector('[onmouseover*="displayLotLightbox"], [onmouseover*="LotLightbox"]');
    
    if (lightboxTrigger) {
      console.log('[BidSpirit] Found lightbox trigger div for lot', lotNumber);
      
      // Trigger mouseover on the specific div that has the displayLotLightbox handler
      try {
        const mouseoverEvent = new MouseEvent('mouseover', { 
          bubbles: true, 
          cancelable: true, 
          view: window 
        });
        lightboxTrigger.dispatchEvent(mouseoverEvent);
        
        // Also try calling the function directly if available
        const onmouseoverAttr = lightboxTrigger.getAttribute('onmouseover');
        if (onmouseoverAttr && typeof window.Admin !== 'undefined' && 
            typeof window.Admin.Catalog !== 'undefined' && 
            typeof window.Admin.Catalog.displayLotLightbox === 'function') {
          // Extract lot ID from the onmouseover attribute
          const lotIdMatch = onmouseoverAttr.match(/displayLotLightbox\((\d+)/);
          if (lotIdMatch) {
            const lotId = parseInt(lotIdMatch[1], 10);
            console.log('[BidSpirit] Calling displayLotLightbox directly with lot ID:', lotId);
            try {
              window.Admin.Catalog.displayLotLightbox(lotId, lightboxTrigger, true);
            } catch (e) {
              console.warn('[BidSpirit] Error calling displayLotLightbox directly:', e);
            }
          }
        }
      } catch (e) {
        console.warn('[BidSpirit] Error triggering mouseover on lightbox trigger:', e);
      }
    } else {
      // Fallback: trigger hover on the row and cells
      console.log('[BidSpirit] No lightbox trigger div found, trying row hover');
      try {
        const rowMouseenter = new MouseEvent('mouseenter', { bubbles: true, cancelable: true, view: window });
        const rowMouseover = new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window });
        row.dispatchEvent(rowMouseenter);
        row.dispatchEvent(rowMouseover);
        
        // Also trigger on image cells/containers in the row
        const imageCells = row.querySelectorAll('.ag-cell, [class*="image"], [class*="thumbnail"]');
        imageCells.forEach(cell => {
          cell.dispatchEvent(rowMouseenter);
          cell.dispatchEvent(rowMouseover);
        });
      } catch (e) {
        console.warn('[BidSpirit] Error triggering hover events:', e);
      }
    }
    
    // Wait for lightbox to appear - try multiple times with increasing delays
    let lightbox = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 300 + (attempt * 200)));
      
      // Look for the lotLightbox that appears on hover
      const allLightboxes = document.querySelectorAll('.lotLightbox');
      console.log(`[BidSpirit] Attempt ${attempt + 1}: Found ${allLightboxes.length} lightbox elements`);
      
      for (const lb of allLightboxes) {
        const style = lb.getAttribute('style') || '';
        const computedStyle = window.getComputedStyle(lb);
        const isVisible = (style.includes('visibility: visible') || computedStyle.visibility === 'visible') && 
                         computedStyle.display !== 'none';
        
        if (isVisible) {
          // Check if lightbox matches this lot number
          const lightboxHeading = lb.querySelector('.panel-heading');
          if (lightboxHeading && lotNumber) {
            const headingText = lightboxHeading.textContent || '';
            const lotMatch = headingText.match(/LOT\s+(\d+)/i);
            if (lotMatch && lotMatch[1] === String(lotNumber)) {
              lightbox = lb;
              console.log(`[BidSpirit] Found matching lightbox for lot ${lotNumber} on attempt ${attempt + 1}`);
              break;
            } else {
              console.log(`[BidSpirit] Lightbox shows LOT ${lotMatch?.[1]}, looking for LOT ${lotNumber}`);
            }
          } else if (!lotNumber) {
            // If we don't have a lot number, use the first visible lightbox
            lightbox = lb;
            console.log(`[BidSpirit] Using visible lightbox (no lot number to match) on attempt ${attempt + 1}`);
            break;
    } else {
            // No heading but we have a lot number - skip this one
            console.log('[BidSpirit] Lightbox has no heading, skipping');
          }
        }
      }
      
      if (lightbox) break;
    }
    
    if (lightbox) {
      // Verify the lightbox matches this lot
      const lightboxHeading = lightbox.querySelector('.panel-heading');
      if (lightboxHeading && lotNumber) {
        const headingText = lightboxHeading.textContent || '';
        const lotMatch = headingText.match(/LOT\s+(\d+)/i);
        if (lotMatch && lotMatch[1] !== String(lotNumber)) {
          console.warn('[BidSpirit] Lightbox lot number mismatch. Expected:', lotNumber, 'Found:', lotMatch[1]);
          lightbox = null;
        }
      }
      
      if (lightbox) {
        console.log('[BidSpirit] Using lightbox for lot', lotNumber);
      
      // Extract main image from lightbox
      const mainImage = lightbox.querySelector('.mainImage');
      if (mainImage && mainImage.src) {
        const mainUrl = transformImageUrl(mainImage.src);
        if (mainUrl && /^https?:\/\//i.test(mainUrl)) {
          images.add(mainUrl);
          console.log('[BidSpirit] Added main image from lightbox:', mainUrl);
        }
      }
      
      // Extract all thumbnail images from lightbox
      const thumbnailImages = lightbox.querySelectorAll('.images.row img.left, .images img, .images.row img');
      console.log(`[BidSpirit] Found ${thumbnailImages.length} thumbnail images in lightbox`);
      thumbnailImages.forEach((img, idx) => {
        if (img.src && !img.src.includes('placeholder') && !img.src.includes('spacer')) {
          // Transform thumbnail URL to full-size (replace h_100 with w_1000, remove size limits)
          let thumbUrl = img.src;
          // Remove size constraints from thumbnail URLs
          console.log('[BidSpirit] Thumbnail URL:', thumbUrl);
          thumbUrl = thumbUrl.replace(/h_100/g, 'w_1000');
          // thumbUrl = thumbUrl.replace(/_c_limit/g, '');
          // thumbUrl = thumbUrl.replace(/_c_fit/g, '');
          thumbUrl = transformImageUrl(thumbUrl);
          console.log('[BidSpirit] Transformed thumbnail URL:', thumbUrl);
          if (thumbUrl && /^https?:\/\//i.test(thumbUrl)) {
            images.add(thumbUrl);
            console.log(`[BidSpirit] Added thumbnail ${idx + 1} from lightbox:`, thumbUrl);
          }
        }
      });
      
        console.log(`[BidSpirit] Extracted ${images.size} total images from lightbox for lot ${lotNumber}`);
        
        // Close lightbox by triggering mouseleave
        try {
          const mouseleaveEvent = new MouseEvent('mouseleave', { bubbles: true, cancelable: true, view: window });
          row.dispatchEvent(mouseleaveEvent);
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
          // Ignore
        }
      }
    } else {
      console.log('[BidSpirit] No lightbox found for lot', lotNumber, '- trying alternative methods');
    }
    
    // Method 0: Try to get data directly from AG Grid API if available
    try {
      // AG Grid stores row data in the row element or in a data attribute
      const agGridRow = row.__agComponent || row;
      if (agGridRow.data || agGridRow.rowData) {
        const rowData = agGridRow.data || agGridRow.rowData;
        // Common field names for images in AG Grid
        const imageFields = ['image', 'images', 'imageUrl', 'imageUrls', 'photo', 'photos', 'thumbnail', 'thumbnails', 'imageFull', 'imageLarge'];
        imageFields.forEach(field => {
          if (rowData[field]) {
            const imageData = rowData[field];
            if (Array.isArray(imageData)) {
              imageData.forEach(item => {
                const url = typeof item === 'string' ? item : (item.url || item.src || item.full || item.original);
                if (url && /^https?:\/\//i.test(url)) {
                  images.add(transformImageUrl(url));
                }
              });
            } else if (typeof imageData === 'string' && /^https?:\/\//i.test(imageData)) {
              images.add(transformImageUrl(imageData));
            }
          }
        });
      }
    } catch (e) {
      // AG Grid API not available, continue with other methods
    }
    
    // Method 1: Find all img tags and prioritize full-size URLs
    // Re-query after hover to get newly revealed images
    const allImgs = row.querySelectorAll('img');
    allImgs.forEach(img => {
      // PRIORITY ORDER: full-size attributes first, then thumbnails
      const fullSizeSources = [
        img.dataset.full,
        img.dataset.zoom,
        img.dataset.original,
        img.dataset.large,
        img.dataset.hires,
        img.dataset.highres,
        img.dataset.fullsize,
        img.dataset.fullSize,
        // Check parent elements for full-size URLs
        img.closest('[data-full]')?.dataset.full,
        img.closest('[data-zoom]')?.dataset.zoom,
        img.closest('[data-original]')?.dataset.original,
        img.closest('a[href*="image"], a[href*="photo"]')?.href,
      ].filter(Boolean);

      // Add full-size URLs first, but still transform to ensure w=1000+
      fullSizeSources.forEach(url => {
        if (!url || url.startsWith('data:') || url.includes('placeholder') || url.includes('icon') || url.includes('spacer')) return;
        
        // Normalize URL
        if (url.startsWith('//')) url = 'https:' + url;
        if (url.startsWith('/')) url = location.origin + url;
        
        if (/^https?:\/\//i.test(url) && !url.includes('1x1') && !url.includes('blank')) {
          images.add(transformImageUrl(url));
        }
      });

      // Also collect all image URLs (including thumbnails) to transform to high-res
      const allImageSources = [
        img.dataset.src,
        img.src,
        img.currentSrc,
        img.getAttribute('srcset')?.split(',').map(s => s.trim().split(' ')[0]).filter(Boolean)
      ].flat().filter(Boolean);

      allImageSources.forEach(url => {
        if (!url || url.startsWith('data:') || url.includes('placeholder') || url.includes('icon') || url.includes('spacer')) return;
        
        // Normalize URL
        if (url.startsWith('//')) url = 'https:' + url;
        if (url.startsWith('/')) url = location.origin + url;
        
        if (/^https?:\/\//i.test(url) && !url.includes('1x1') && !url.includes('blank')) {
          images.add(transformImageUrl(url));
        }
      });
    });

    // Method 2: Check background-image CSS
    const elementsWithBg = row.querySelectorAll('[style*="background-image"], [style*="backgroundImage"]');
    elementsWithBg.forEach(el => {
      const style = el.getAttribute('style') || '';
      const bgMatch = style.match(/url\(['"]?([^'")]+)['"]?\)/i);
        if (bgMatch) {
        let url = bgMatch[1];
        if (url.startsWith('//')) url = 'https:' + url;
        if (url.startsWith('/')) url = location.origin + url;
        if (/^https?:\/\//i.test(url) && !url.includes('placeholder')) {
          images.add(transformImageUrl(url));
        }
      }
    });

    // Method 3: Check computed background-image
    const cells = row.querySelectorAll('.ag-cell, [class*="cell"], [class*="image"]');
    cells.forEach(cell => {
      const computed = window.getComputedStyle(cell);
      const bgImage = computed.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        const urlMatch = bgImage.match(/url\(['"]?([^'")]+)['"]?\)/i);
        if (urlMatch) {
          let url = urlMatch[1];
          if (url.startsWith('//')) url = 'https:' + url;
          if (url.startsWith('/')) url = location.origin + url;
          if (/^https?:\/\//i.test(url) && !url.includes('placeholder')) {
            images.add(transformImageUrl(url));
          }
        }
      }
    });

    // Method 4: Check data attributes on the row itself
    Object.keys(row.dataset).forEach(key => {
      if (key.toLowerCase().includes('image') || key.toLowerCase().includes('img')) {
        const val = row.dataset[key];
        if (val && /^https?:\/\//i.test(val)) {
          images.add(transformImageUrl(val));
        }
      }
    });

    // Method 5: Check clickable links and buttons that might reveal full-size images
    const clickableImages = row.querySelectorAll('a[href*="image"], a[href*="photo"], a[href*=".jpg"], a[href*=".jpeg"], a[href*=".png"], [onclick*="image"], [onclick*="zoom"]');
    clickableImages.forEach(el => {
      const href = el.href || el.getAttribute('href');
      const onclick = el.getAttribute('onclick') || '';
      
      // Extract URL from href and transform to high-res
      if (href && /\.(jpg|jpeg|png|webp|gif)/i.test(href)) {
        let url = href;
        if (url.startsWith('//')) url = 'https:' + url;
        if (url.startsWith('/')) url = location.origin + url;
        if (/^https?:\/\//i.test(url)) {
          images.add(transformImageUrl(url));
        }
      }
      
      // Try to extract URL from onclick handler
      const urlMatch = onclick.match(/['"](https?:\/\/[^'"]+\.(jpg|jpeg|png|webp|gif)[^'"]*)['"]/i);
      if (urlMatch) {
        images.add(transformImageUrl(urlMatch[1]));
      }
    });

    // Method 6: Check for gallery/lightbox data
    const galleryElements = row.querySelectorAll('[data-gallery], [data-lightbox], [data-fancybox], [data-swipebox]');
    galleryElements.forEach(el => {
      const galleryData = el.dataset.gallery || el.dataset.lightbox || el.dataset.fancybox || el.dataset.swipebox;
      if (galleryData) {
        try {
          const parsed = JSON.parse(galleryData);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              const url = typeof item === 'string' ? item : (item.url || item.src || item.full);
              if (url && /^https?:\/\//i.test(url)) {
                images.add(transformImageUrl(url));
              }
            });
          } else if (typeof parsed === 'string' && /^https?:\/\//i.test(parsed)) {
            images.add(transformImageUrl(parsed));
          }
        } catch {
          if (/^https?:\/\//i.test(galleryData)) {
            images.add(transformImageUrl(galleryData));
          }
        }
      }
    });

    // Method 7: Try to find image URLs in JSON data attributes (prioritize full-size)
    const dataAttrs = row.querySelectorAll('[data-image], [data-images], [data-image-url], [data-imageurl], [data-image-full], [data-images-full]');
    dataAttrs.forEach(el => {
      // Prioritize full-size data attributes
      const imageData = el.dataset.imageFull || el.dataset.imagesFull || 
                       el.dataset.image || el.dataset.images || 
                       el.dataset.imageUrl || el.dataset.imageurl;
      if (imageData) {
        try {
          const parsed = JSON.parse(imageData);
          if (Array.isArray(parsed)) {
                parsed.forEach(item => {
                  const url = typeof item === 'string' ? item : (item.full || item.original || item.url || item.src);
                  if (url && /^https?:\/\//i.test(url)) {
                    images.add(transformImageUrl(url));
                  }
                });
              } else if (typeof parsed === 'string' && /^https?:\/\//i.test(parsed)) {
                images.add(transformImageUrl(parsed));
              } else if (typeof parsed === 'object' && parsed.full) {
                images.add(transformImageUrl(parsed.full));
              }
            } catch {
              // Not JSON, treat as direct URL
              if (/^https?:\/\//i.test(imageData)) {
                images.add(transformImageUrl(imageData));
              }
            }
      }
    });

    // Method 8: Check row's data attributes for image arrays (common in AG Grid)
    if (row.dataset) {
      Object.keys(row.dataset).forEach(key => {
        if (key.toLowerCase().includes('image') || key.toLowerCase().includes('photo')) {
          const val = row.dataset[key];
          if (val) {
            try {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed)) {
                parsed.forEach(item => {
                  const url = typeof item === 'string' ? item : (item.full || item.original || item.url || item.src);
                  if (url && /^https?:\/\//i.test(url)) {
                    images.add(transformImageUrl(url));
                  }
                });
              }
            } catch {
              if (/^https?:\/\//i.test(val)) images.add(transformImageUrl(val));
            }
          }
        }
      });
    }

    // Method 9: Check AG Grid cell value getters (AG Grid stores data in cell renderers)
    const agCells = row.querySelectorAll('.ag-cell');
    agCells.forEach(cell => {
      // AG Grid might store image data in the cell's value or in data attributes
      const cellValue = cell.textContent || '';
      const cellData = cell.dataset || {};
      
      // Check if cell contains image-related data
      Object.keys(cellData).forEach(key => {
        const val = cellData[key];
        if (val && typeof val === 'string' && /^https?:\/\//i.test(val)) {
          // Check if it looks like an image URL
          if (!val.includes('1x1') && !val.includes('blank') && !val.includes('placeholder')) {
            images.add(transformImageUrl(val));
          }
        }
      });
      
      // Check for JSON data in cell attributes
      const jsonAttrs = ['data-value', 'data-row-data', 'data-cell-data'];
      jsonAttrs.forEach(attr => {
        const jsonData = cell.getAttribute(attr);
        if (jsonData) {
          try {
            const parsed = JSON.parse(jsonData);
            if (typeof parsed === 'object') {
              // Recursively search for image URLs in the object
              const findUrls = (obj) => {
                if (typeof obj === 'string' && /^https?:\/\//i.test(obj)) {
                  if (!obj.includes('1x1') && !obj.includes('blank')) {
                    images.add(transformImageUrl(obj));
                  }
                } else if (Array.isArray(obj)) {
                  obj.forEach(findUrls);
                } else if (typeof obj === 'object' && obj !== null) {
                  Object.values(obj).forEach(findUrls);
                }
              };
              findUrls(parsed);
            }
          } catch {
            // Not JSON, ignore
          }
        }
      });
    });

    // Method 10: Trigger lazy loading and wait a bit for full-size images to load
    allImgs.forEach(img => {
      if (img.dataset.src || img.dataset.lazy || img.dataset.full) {
        const rect = img.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) {
          img.scrollIntoView({ behavior: 'instant', block: 'nearest' });
        }
      }
    });

    // Just deduplicate URLs
    const finalImages = Array.from(images);
    const uniqueImages = [];
    const seen = new Set();
    
    finalImages.forEach(url => {
      // Skip invalid URLs
      if (!url || typeof url !== 'string' || !url.trim()) {
        return;
      }
      
      // Deduplicate
        if (!seen.has(url)) {
          seen.add(url);
          uniqueImages.push(url);
      }
    });
    
    console.log('[BidSpirit] Final images for lot', lotNumber, ':', uniqueImages.length, 'unique URLs');
    if (uniqueImages.length > 0) {
      console.log('[BidSpirit] Sample URLs:', uniqueImages.slice(0, 2));
    } else {
      console.warn('[BidSpirit] No images found for lot', lotNumber, '- raw images set had', images.size, 'entries');
    }
    
    return uniqueImages;
  }

  async function getAllLotsFromCatalog() {
    const lots = [];
    const debug = [];
    
    // AG Grid rows (BidSpirit admin uses AG Grid)
    const agRows = document.querySelectorAll('.ag-row:not(.ag-header-row)');
    console.log('[BidSpirit] Found', agRows.length, 'AG Grid rows');
    
    for (const [idx, row] of agRows.entries()) {
      const lotNumber = extractLotNumberFromRow(row);
      console.log(`[BidSpirit] Processing row ${idx + 1}/${agRows.length}, lot: ${lotNumber || 'unknown'}`);
      
      const images = await extractImagesFromRow(row, lotNumber);
      
      debug.push({
        rowIndex: idx,
        lotNumber,
        imageCount: images.length,
        images: images.slice(0, 2) // first 2 for debugging
      });
      
      if (lotNumber) {
        lots.push({ lotNumber, images });
      } else if (images.length > 0) {
        // Found images but no lot number - try to infer from context
        const inferredLot = idx + 1;
        lots.push({ lotNumber: String(inferredLot), images });
      }
      
      // Small delay between rows to ensure lightboxes don't interfere
      if (idx < agRows.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Fallback: try generic table rows
    if (lots.length === 0) {
      const tableRows = document.querySelectorAll('table tr:not(:first-child), .table-row, [role="row"]:not([role="columnheader"])');
      console.log('[BidSpirit] Trying fallback rows:', tableRows.length);
      
      for (const [idx, row] of tableRows.entries()) {
        const lotNumber = extractLotNumberFromRow(row);
        const images = await extractImagesFromRow(row, lotNumber);
        
        if (lotNumber) {
          lots.push({ lotNumber, images });
        } else if (images.length > 0) {
          lots.push({ lotNumber: String(idx + 1), images });
        }
      }
    }

    console.log('[BidSpirit] Debug info:', debug);
    console.log('[BidSpirit] Total lots found:', lots.length);
    
    return lots;
  }
  
  function createToolbar() {
      const bar = document.createElement("div");
      bar.style.position = "fixed";
      bar.style.top = "12px";
      bar.style.right = "12px";
      bar.style.zIndex = "99999";
      bar.style.background = "#111827";
      bar.style.color = "#fff";
      bar.style.padding = "10px 12px";
      bar.style.borderRadius = "8px";
      bar.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
      bar.style.fontSize = "13px";
      bar.style.fontFamily = "sans-serif";
      bar.style.display = "flex";
    bar.style.flexDirection = "column";
      bar.style.gap = "8px";
    bar.style.minWidth = "200px";
  
      const btn = document.createElement("button");
    btn.textContent = isCatalogPage() ? "Download all lot images" : "Download lot images";
      btn.style.background = "#2563eb";
      btn.style.color = "#fff";
      btn.style.border = "none";
      btn.style.padding = "6px 10px";
      btn.style.borderRadius = "6px";
      btn.style.cursor = "pointer";
    btn.style.width = "100%";
  
    const status = document.createElement("div");
    status.style.fontSize = "11px";
      status.style.color = "#cbd5f5";
    status.style.lineHeight = "1.4";

    // Debug button
    const debugBtn = document.createElement("button");
    debugBtn.textContent = "Debug";
    debugBtn.style.background = "#6b7280";
    debugBtn.style.color = "#fff";
    debugBtn.style.border = "none";
    debugBtn.style.padding = "4px 8px";
    debugBtn.style.borderRadius = "4px";
    debugBtn.style.cursor = "pointer";
    debugBtn.style.fontSize = "10px";
    debugBtn.style.width = "100%";

    debugBtn.onclick = async () => {
      const lots = await getAllLotsFromCatalog();
      const totalImages = lots.reduce((sum, lot) => sum + lot.images.length, 0);
      
      console.log('=== BidSpirit Image Downloader Debug ===');
      console.log('Page URL:', location.href);
      console.log('Is Catalog Page:', isCatalogPage());
      console.log('Total lots found:', lots.length);
      console.log('Total images found:', totalImages);
      
      // Show sample URLs
      if (lots.length > 0 && lots[0].images.length > 0) {
        console.log('Sample image URLs:');
        lots[0].images.slice(0, 3).forEach((url, idx) => {
          console.log(`  ${idx + 1}. ${url}`);
        });
      }
      
      console.log('All lots detail:', lots);
      
      // Show first row HTML structure
      const firstRow = document.querySelector('.ag-row:not(.ag-header-row)');
      if (firstRow) {
        console.log('First row HTML:', firstRow.outerHTML.substring(0, 500));
        const imgs = firstRow.querySelectorAll('img');
        console.log('First row images found:', imgs.length);
        imgs.forEach((img, idx) => {
          console.log(`  Image ${idx + 1}:`, {
            src: img.src,
            dataset: Object.keys(img.dataset).reduce((acc, key) => {
              if (key.toLowerCase().includes('image') || key.toLowerCase().includes('src') || key.toLowerCase().includes('full') || key.toLowerCase().includes('zoom')) {
                acc[key] = img.dataset[key];
              }
              return acc;
            }, {})
          });
        });
      }
      
      status.textContent = `Debug: ${lots.length} lots, ${totalImages} images (see console)`; 
    };
  
      btn.onclick = async () => {
      // Check if extension is still valid
      if (!isExtensionValid()) {
        status.textContent = "Extension reloaded. Please refresh the page.";
        console.error('[BidSpirit] Extension context invalidated. Page refresh required.');
        return;
      }

      if (isCatalogPage()) {
        // Catalog mode: download images for all visible lots
        status.textContent = "Scanning page...";
        const lots = await getAllLotsFromCatalog();
        
        const totalImages = lots.reduce((sum, lot) => sum + lot.images.length, 0);
        console.log('[BidSpirit] Lots:', lots);
        console.log('[BidSpirit] Total images found:', totalImages);
        
        if (lots.length === 0) {
          status.textContent = "No lots found. Click Debug for details.";
          return;
        }
        
        if (totalImages === 0) {
          status.textContent = `Found ${lots.length} lots but no images. Click Debug.`;
          return;
        }

        status.textContent = `Found ${lots.length} lots, ${totalImages} images. Downloading...`;
        let downloadedCount = 0;

        // Show all URLs that will be downloaded
        console.log('[BidSpirit] ===== URLs TO BE DOWNLOADED =====');
        lots.forEach((lot, idx) => {
          if (lot.images.length > 0) {
            console.log(`\n[BidSpirit] Lot ${lot.lotNumber} (${lot.images.length} images):`);
            lot.images.forEach((url, urlIdx) => {
              console.log(`  ${urlIdx + 1}. ${url}`);
            });
          }
        });
        console.log('[BidSpirit] ====================================\n');

        for (const lot of lots) {
          if (lot.images.length > 0) {
            console.log(`[BidSpirit] Downloading ${lot.images.length} images for lot ${lot.lotNumber}...`);
            lot.images.forEach((url, idx) => {
              console.log(`  [${idx + 1}/${lot.images.length}] ${url}`);
            });
            
            try {
              safeSendMessage(
                { type: "download-images", lotNumber: lot.lotNumber, urls: lot.images },
                (res) => {
                  if (res?.ok) {
                    downloadedCount += res.count;
                    status.textContent = `Downloading: ${downloadedCount}/${totalImages} images...`;
                    console.log(`[BidSpirit] ✓ Lot ${lot.lotNumber}: ${res.count} images queued for download`);
                  } else if (res?.error) {
                    console.error('[BidSpirit] Extension error:', res.error);
                    status.textContent = `Error: ${res.error}. Please reload the page.`;
                  }
                }
              );
            } catch (error) {
              console.error('[BidSpirit] Failed to send message:', error);
              status.textContent = `Error: ${error.message}. Please reload the page.`;
              return;
            }
            // Small delay to avoid overwhelming the download API
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Wait a bit longer for all downloads to complete
        setTimeout(() => {
          if (downloadedCount === 0) {
            status.textContent = `Error: No valid image URLs found. Please reload the page.`;
            console.error('[BidSpirit] No images were downloaded. Check background.js console for validation errors.');
          } else {
          status.textContent = `Complete: ${downloadedCount} images from ${lots.length} lots`;
          }
        }, 2000);
      } else {
        // Single lot page mode (fallback)
        const lotNumber = extractLotNumberFromRow(document.body) || 
                         document.querySelector('[data-lot-number]')?.dataset?.lotNumber ||
                         location.href.match(/lot[\/#](\d+)/i)?.[1];
        
        const images = await extractImagesFromRow(document.body, lotNumber);
        
        if (!lotNumber) {
          status.textContent = "No lot number found";
          return;
        }
        if (images.length === 0) {
          status.textContent = "No images found";
          return;
        }

        // Show URLs that will be downloaded
        console.log(`[BidSpirit] ===== URLs TO BE DOWNLOADED FOR LOT ${lotNumber} =====`);
        images.forEach((url, idx) => {
          console.log(`  ${idx + 1}. ${url}`);
        });
        console.log('[BidSpirit] ====================================\n');

        status.textContent = "Downloading...";
        try {
          safeSendMessage(
            { type: "download-images", lotNumber, urls: images },
          (res) => {
            if (res?.ok) {
              console.log(`[BidSpirit] ✓ Started ${res.count} downloads for lot ${lotNumber}`);
              status.textContent = `Started ${res.count} downloads`;
            } else {
              console.error('[BidSpirit] Download failed:', res?.error);
              status.textContent = res?.error || "Failed";
            }
          }
        );
        } catch (error) {
          console.error('[BidSpirit] Failed to send message:', error);
          status.textContent = `Error: ${error.message}. Please reload the page.`;
        }
      }
      };
  
      bar.appendChild(btn);
    bar.appendChild(debugBtn);
      bar.appendChild(status);
      document.body.appendChild(bar);
    }
  
  // Wait for page to load, especially for SPAs
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createToolbar);
  } else {
    createToolbar();
  }

  // Re-create toolbar on hash changes (BidSpirit uses hash routing)
  let lastHash = location.hash;
  setInterval(() => {
    if (location.hash !== lastHash) {
      lastHash = location.hash;
      const existing = document.querySelector('[style*="z-index: 99999"]');
      if (existing) existing.remove();
      createToolbar();
    }
  }, 500);
  })();