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
    // First try: itemIndex (the lot number like 1, 2, 3...)
    const itemIndexElement = row.querySelector('span.itemIndex, .itemIndex, [class*="itemIndex"]');
    if (itemIndexElement) {
      const itemIndex = (itemIndexElement.textContent || '').trim();
      if (itemIndex) {
        console.log(`[BidSpirit] Extracted lot number from itemIndex: ${itemIndex}`);
        return itemIndex;
      }
    }
    
    // Second try: lotitemid attribute on the <tr> element
    if (row.getAttribute && row.getAttribute('lotitemid')) {
      const lotId = row.getAttribute('lotitemid');
      console.log(`[BidSpirit] Extracted lot ID from lotitemid attribute: ${lotId}`);
      return lotId;
    }
    
    // Third try: <th column="serialId"> element (fallback)
    const serialIdCell = row.querySelector('th[column="serialId"]');
    if (serialIdCell) {
      const serialId = (serialIdCell.textContent || '').trim();
      if (serialId) {
        console.log(`[BidSpirit] Extracted lot serial ID from th[column="serialId"]: ${serialId}`);
        return serialId;
      }
    }
    
    // Fallback: Try various selectors for lot number in AG Grid or similar tables
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
    
    // Extract lot number from row if not provided
    if (!lotNumber) {
      lotNumber = extractLotNumberFromRow(row);
      console.log('[BidSpirit] Extracted lot number from row:', lotNumber);
    }
    
    console.log(`[BidSpirit] ===== Starting image extraction for LOT ${lotNumber || 'UNKNOWN'} =====`);
    
    // Scroll row into view first to ensure it's visible
    try {
      row.scrollIntoView({ behavior: 'instant', block: 'nearest' });
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (e) {
      // Ignore scroll errors
    }
    
    // First, close any existing lightbox
    try {
      if (typeof window.Components !== 'undefined' && 
          typeof window.Components.LotLightbox !== 'undefined' && 
          typeof window.Components.LotLightbox.hide === 'function') {
        window.Components.LotLightbox.hide();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (e) {
      // Ignore
    }
    
    // Find the <td column="pic"> and the div inside it with onmouseover
    const picCell = row.querySelector('td[column="pic"]');
    if (!picCell) {
      console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: No td[column="pic"] found`);
      return [];
    }
    
    const lightboxTrigger = picCell.querySelector('div[onmouseover*="displayLotLightbox"]');
    
    if (!lightboxTrigger) {
      console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: No lightbox trigger div found in pic cell`);
      return [];
    }
    
    console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Found lightbox trigger div in pic cell`);
    
    // Extract lot ID from the onmouseover attribute
    const onmouseoverAttr = lightboxTrigger.getAttribute('onmouseover');
    let lotId = null;
    if (onmouseoverAttr) {
      const lotIdMatch = onmouseoverAttr.match(/displayLotLightbox\((\d+)/);
      if (lotIdMatch) {
        lotId = parseInt(lotIdMatch[1], 10);
        console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Extracted lot ID from trigger: ${lotId}`);
      }
    }
    
    // Trigger the lightbox by hovering over the div
    try {
      // Try calling the function directly if available
      if (lotId && typeof window.Admin !== 'undefined' && 
          typeof window.Admin.Catalog !== 'undefined' && 
          typeof window.Admin.Catalog.displayLotLightbox === 'function') {
        console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Calling displayLotLightbox directly with lot ID: ${lotId}`);
        window.Admin.Catalog.displayLotLightbox(lotId, lightboxTrigger, true);
      } else {
        // Fallback: trigger mouseover event on the div
        console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Triggering mouseover event on trigger div`);
        const mouseoverEvent = new MouseEvent('mouseover', { 
          bubbles: true, 
          cancelable: true, 
          view: window 
        });
        lightboxTrigger.dispatchEvent(mouseoverEvent);
      }
    } catch (e) {
      console.warn(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Error triggering lightbox:`, e);
      // Fallback: trigger mouseover event
      const mouseoverEvent = new MouseEvent('mouseover', { 
        bubbles: true, 
        cancelable: true, 
        view: window 
      });
      lightboxTrigger.dispatchEvent(mouseoverEvent);
    }
    
    // Wait for lightbox to appear - try multiple times with increasing delays
    let lightbox = null;
    const expectedLotNumber = lotNumber ? String(lotNumber) : null;
    
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 400 + (attempt * 200)));
      
      // Look for the lotLightbox that appears on hover
      const allLightboxes = document.querySelectorAll('.lotLightbox');
      console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Attempt ${attempt + 1}: Found ${allLightboxes.length} lightbox elements, looking for lot ${lotNumber}`);
      
      for (const lb of allLightboxes) {
        const style = lb.getAttribute('style') || '';
        const computedStyle = window.getComputedStyle(lb);
        const isVisible = (style.includes('visibility: visible') || computedStyle.visibility === 'visible') && 
                         computedStyle.display !== 'none';
        
        if (isVisible) {
          // Check if lightbox matches this lot number
          const lightboxHeading = lb.querySelector('.panel-heading');
          if (lightboxHeading) {
            const headingText = lightboxHeading.textContent || '';
            const lotMatch = headingText.match(/LOT\s+(\d+)/i);
            const lightboxLotNumber = lotMatch ? lotMatch[1] : null;
            
            console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Found visible lightbox showing LOT ${lightboxLotNumber || 'UNKNOWN'}`);
            
            if (expectedLotNumber && lightboxLotNumber === expectedLotNumber) {
              lightbox = lb;
              console.log(`[BidSpirit] ✓ LOT ${lotNumber}: Found matching lightbox on attempt ${attempt + 1}`);
              break;
            } else if (!expectedLotNumber) {
              // If we don't have a lot number, use the first visible lightbox
              lightbox = lb;
              console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Using visible lightbox (no lot number to match) on attempt ${attempt + 1}`);
              break;
            } else {
              console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Lightbox shows LOT ${lightboxLotNumber}, looking for LOT ${expectedLotNumber}, skipping`);
            }
          } else {
            // No heading - skip if we have a lot number to match
            console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Lightbox has no heading`);
            if (!expectedLotNumber) {
              lightbox = lb;
              console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Using visible lightbox (no heading, no lot number) on attempt ${attempt + 1}`);
              break;
            }
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
        const lightboxHeading = lightbox.querySelector('.panel-heading');
        const headingText = lightboxHeading ? lightboxHeading.textContent : 'unknown';
        console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Using lightbox (${headingText})`);
        
        // Extract ALL images from lightbox - try multiple selectors to catch everything
        const allLightboxImages = lightbox.querySelectorAll('img');
        console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Found ${allLightboxImages.length} total img elements in lightbox`);
        
        // Also check for main image specifically
        const mainImage = lightbox.querySelector('.mainImage');
        if (mainImage && mainImage.src) {
          const mainUrl = transformImageUrl(mainImage.src);
          if (mainUrl && /^https?:\/\//i.test(mainUrl)) {
            images.add(mainUrl);
            console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Added main image from lightbox:`, mainUrl.substring(0, 80) + '...');
          }
        }
        
        // Extract all images from lightbox (main + thumbnails)
        allLightboxImages.forEach((img, idx) => {
          // Try multiple sources for the image URL
          const imageSources = [
            img.src,
            img.currentSrc,
            img.dataset.src,
            img.dataset.full,
            img.dataset.original,
            img.getAttribute('data-src'),
            img.getAttribute('data-full'),
            img.getAttribute('data-original')
          ].filter(Boolean);
          
          imageSources.forEach((imgUrl, sourceIdx) => {
            if (!imgUrl || imgUrl.includes('placeholder') || imgUrl.includes('spacer') || imgUrl.includes('1x1') || imgUrl.startsWith('data:')) {
              return;
            }
            
            // Transform URL (replace h_100 with w_1000)
            let transformedUrl = transformImageUrl(imgUrl);
            
            if (transformedUrl && /^https?:\/\//i.test(transformedUrl)) {
              images.add(transformedUrl);
              console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: ✓ Added image ${idx + 1} (source ${sourceIdx + 1}) from lightbox:`, transformedUrl.substring(0, 80) + '...');
            }
          });
        });
        
        // Also check for background images in the lightbox
        const elementsWithBg = lightbox.querySelectorAll('[style*="background-image"]');
        elementsWithBg.forEach((el, idx) => {
          const style = el.getAttribute('style') || '';
          const bgMatch = style.match(/url\(['"]?([^'")]+)['"]?\)/i);
          if (bgMatch) {
            let bgUrl = bgMatch[1];
            if (bgUrl.startsWith('//')) bgUrl = 'https:' + bgUrl;
            if (bgUrl.startsWith('/')) bgUrl = location.origin + bgUrl;
            if (/^https?:\/\//i.test(bgUrl) && !bgUrl.includes('placeholder')) {
              const transformedUrl = transformImageUrl(bgUrl);
              images.add(transformedUrl);
              console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: ✓ Added background image ${idx + 1} from lightbox:`, transformedUrl.substring(0, 80) + '...');
            }
          }
        });
        
        console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Extracted ${images.size} total unique images from lightbox`);
        
        // Close lightbox by calling hide function
        try {
          if (typeof window.Components !== 'undefined' && 
              typeof window.Components.LotLightbox !== 'undefined' && 
              typeof window.Components.LotLightbox.hide === 'function') {
            window.Components.LotLightbox.hide();
          } else {
            // Fallback: trigger mouseleave
            const mouseleaveEvent = new MouseEvent('mouseleave', { bubbles: true, cancelable: true, view: window });
            row.dispatchEvent(mouseleaveEvent);
            if (lightboxTrigger) {
              lightboxTrigger.dispatchEvent(mouseleaveEvent);
            }
          }
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (e) {
          console.warn('[BidSpirit] Error closing lightbox:', e);
        }
      }
    } else {
      console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: No lightbox found - trying alternative methods`);
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
    
    console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Final images: ${uniqueImages.length} unique URLs`);
    if (uniqueImages.length > 0) {
      console.log(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: Sample URLs:`, uniqueImages.slice(0, 2).map(url => url.substring(0, 80) + '...'));
    } else {
      console.warn(`[BidSpirit] LOT ${lotNumber || 'UNKNOWN'}: No images found - raw images set had ${images.size} entries`);
    }
    console.log(`[BidSpirit] ===== Finished image extraction for LOT ${lotNumber || 'UNKNOWN'} =====`);
    
    return uniqueImages;
  }

  async function getAllLotsFromCatalog() {
    const lots = [];
    const debug = [];
    
    // First, try to find tbody.itemsTableBody with <tr> children
    const itemsTableBody = document.querySelector('tbody.itemsTableBody');
    let rows = [];
    
    if (itemsTableBody) {
      rows = Array.from(itemsTableBody.querySelectorAll('tr'));
      console.log('[BidSpirit] Found tbody.itemsTableBody with', rows.length, 'rows');
    } else {
      // Fallback: AG Grid rows (BidSpirit admin uses AG Grid)
      rows = Array.from(document.querySelectorAll('.ag-row:not(.ag-header-row)'));
      console.log('[BidSpirit] No itemsTableBody found, using AG Grid rows:', rows.length);
    }
    
    // If still no rows, try generic table rows
    if (rows.length === 0) {
      rows = Array.from(document.querySelectorAll('table tbody tr, table tr:not(:first-child)'));
      console.log('[BidSpirit] Trying generic table rows:', rows.length);
    }
    
    for (const [idx, row] of rows.entries()) {
      const lotNumber = extractLotNumberFromRow(row);
      console.log(`\n[BidSpirit] ===== Processing row ${idx + 1}/${rows.length} =====`);
      console.log(`[BidSpirit] Lot Serial Number: ${lotNumber || 'UNKNOWN'}`);
      console.log(`[BidSpirit] Row index: ${idx}`);
      
      const images = await extractImagesFromRow(row, lotNumber);
      
      console.log(`[BidSpirit] Lot ${lotNumber || 'UNKNOWN'}: Found ${images.length} images`);
      console.log(`[BidSpirit] ===== Finished row ${idx + 1} =====\n`);
      
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
      
      // Close any lightbox and wait before processing next row
      try {
        if (typeof window.Components !== 'undefined' && 
            typeof window.Components.LotLightbox !== 'undefined' && 
            typeof window.Components.LotLightbox.hide === 'function') {
          window.Components.LotLightbox.hide();
        }
      } catch (e) {
        // Ignore
      }
      
      // Small delay between rows to ensure lightboxes don't interfere
      if (idx < rows.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
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
              // Check if extension is still valid before sending
              if (!isExtensionValid()) {
                throw new Error('Extension context invalidated. Please reload the page.');
              }
              
              safeSendMessage(
                { type: "download-images", lotNumber: lot.lotNumber, urls: lot.images },
                (res) => {
                  if (res?.ok) {
                    downloadedCount += res.count;
                    status.textContent = `Downloading: ${downloadedCount}/${totalImages} images...`;
                    console.log(`[BidSpirit] ✓ Lot ${lot.lotNumber}: ${res.count} images queued for download`);
                  } else if (res?.error) {
                    console.error('[BidSpirit] Extension error:', res.error);
                    if (res.error.includes('connection') || res.error.includes('invalidated')) {
                      status.textContent = `Extension reloaded. Please refresh the page.`;
                    } else {
                    status.textContent = `Error: ${res.error}. Please reload the page.`;
                    }
                  }
                }
              );
            } catch (error) {
              console.error('[BidSpirit] Failed to send message:', error);
              if (error.message.includes('connection') || error.message.includes('invalidated')) {
                status.textContent = "Extension reloaded. Please refresh the page.";
              } else {
              status.textContent = `Error: ${error.message}. Please reload the page.`;
              }
              // Don't return, continue with other lots
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