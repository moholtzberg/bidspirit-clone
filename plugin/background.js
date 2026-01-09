function getFileExtensionFromUrl(url) {
  // Extract file extension from URL
  // Try to get it from the path first (before query params)
  const pathMatch = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i);
  if (pathMatch) {
    return pathMatch[1].toLowerCase();
  }
  
  // Check Content-Type header if available (would need fetch, but we can't do that here)
  // Default to jpg if we can't determine
  return 'jpg';
}

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Must be HTTP/HTTPS
  if (!/^https?:\/\//i.test(url)) return false;
  
  // Only reject obviously non-image file types
  const invalidExtensions = /\.(xml|html|css|js|json|txt|pdf|zip|doc|docx)(\?|$)/i;
  if (invalidExtensions.test(url)) {
    return false;
  }
  
  // Accept everything else - let Chrome handle the download
  return true;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "download-images") return true;

  const { lotNumber, urls } = msg;
  if (!lotNumber || !urls?.length) {
    sendResponse({ ok: false, error: "Missing lot number or URLs" });
    return true;
  }

  // Filter out only obviously invalid URLs (non-HTTP/HTTPS or non-image file types)
  const validUrls = urls.filter(url => {
    const isValid = isValidImageUrl(url);
    if (!isValid) {
      console.warn(`[BidSpirit] Skipping invalid URL: ${url.substring(0, 100)}...`);
    }
    return isValid;
  });

  console.log(`[BidSpirit] Received ${urls.length} URLs, ${validUrls.length} will be downloaded`);

  if (validUrls.length === 0) {
    console.error(`[BidSpirit] No valid URLs found. All URLs were rejected.`);
    sendResponse({ ok: false, error: "No valid image URLs found. Please check the console for details." });
    return true;
  }

  let successCount = 0;
  let errorCount = 0;

  validUrls.forEach((url, idx) => {
    // Extract file extension from URL
    const ext = getFileExtensionFromUrl(url);
    
    // Chrome downloads relative to the default download folder
    // To save to ~/Documents/pumbi/images/, set Chrome's download folder to ~/Documents/pumbi
    const filename = `pumbi/images/${lotNumber}-${idx + 1}.${ext}`;
    
    chrome.downloads.download(
      { 
        url, 
        filename, 
        conflictAction: "uniquify",
        saveAs: false // Use default download location
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          errorCount++;
          console.error(`[BidSpirit] Failed to download ${filename}:`, chrome.runtime.lastError.message);
        } else {
          successCount++;
          console.log(`[BidSpirit] Downloading ${filename} from ${url.substring(0, 80)}...`);
        }
      }
    );
  });

  console.log(`[BidSpirit] Starting download of ${validUrls.length} images for lot ${lotNumber}`);
  
  sendResponse({ 
    ok: true, 
    count: validUrls.length,
    skipped: urls.length - validUrls.length
  });
  return true; // Keep channel open for async response
});