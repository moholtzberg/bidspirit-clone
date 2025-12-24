/**
 * Utility to convert S3 keys to presigned URLs or handle image URLs
 * This ensures S3 images are accessible even when the bucket is private
 */

/**
 * Convert an image URL or S3 key to a presigned URL if needed
 * @param {string} urlOrKey - Image URL or S3 key
 * @returns {Promise<string>} - Presigned URL or original URL
 */
export async function getImageUrl(urlOrKey) {
  if (!urlOrKey) return null;
  
  // If it's already a full URL (http/https), return as-is
  if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
    // Check if it's an S3 URL that needs presigning
    if (urlOrKey.includes('.s3.') || urlOrKey.includes('s3.amazonaws.com')) {
      // Extract key from S3 URL
      const match = urlOrKey.match(/s3[^/]*\.amazonaws\.com\/(.+)/) || urlOrKey.match(/s3:\/\/[^/]+\/(.+)/);
      if (match) {
        const key = match[1];
        try {
          const response = await fetch('/api/images/presigned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keys: [key] })
          });
          if (response.ok) {
            const { urls } = await response.json();
            return urls[key] || urlOrKey;
          }
        } catch (error) {
          console.error('Error getting presigned URL:', error);
        }
      }
    }
    return urlOrKey;
  }
  
  // If it's an S3 key (starts with 'lots/' or similar), get presigned URL
  if (urlOrKey.includes('/') && !urlOrKey.startsWith('/')) {
    try {
      const response = await fetch('/api/images/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: [urlOrKey] })
      });
      if (response.ok) {
        const { urls } = await response.json();
        return urls[urlOrKey] || urlOrKey;
      }
    } catch (error) {
      console.error('Error getting presigned URL:', error);
    }
  }
  
  // Fallback: assume it's a local URL
  return urlOrKey.startsWith('/') ? urlOrKey : `/${urlOrKey}`;
}

/**
 * Batch convert multiple image URLs/keys to presigned URLs
 * @param {string[]} urlsOrKeys - Array of image URLs or S3 keys
 * @returns {Promise<string[]>} - Array of presigned URLs or original URLs
 */
export async function getImageUrls(urlsOrKeys) {
  if (!urlsOrKeys || urlsOrKeys.length === 0) return [];
  
  // Extract S3 keys that need presigning
  const keysToPresign = [];
  const keyToIndex = new Map();
  
  urlsOrKeys.forEach((urlOrKey, index) => {
    if (!urlOrKey) return;
    
    // Check if it's an S3 URL or key
    if (urlOrKey.includes('.s3.') || urlOrKey.includes('s3.amazonaws.com') || 
        (urlOrKey.includes('/') && !urlOrKey.startsWith('http') && !urlOrKey.startsWith('/'))) {
      let key = urlOrKey;
      
      // Extract key from full S3 URL
      if (urlOrKey.includes('.s3.')) {
        const match = urlOrKey.match(/s3[^/]*\.amazonaws\.com\/(.+)/);
        if (match) key = match[1];
      } else if (urlOrKey.startsWith('s3://')) {
        const match = urlOrKey.match(/s3:\/\/[^/]+\/(.+)/);
        if (match) key = match[1];
      }
      
      keysToPresign.push(key);
      keyToIndex.set(key, index);
    }
  });
  
  if (keysToPresign.length === 0) {
    return urlsOrKeys;
  }
  
  try {
    const response = await fetch('/api/images/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: keysToPresign })
    });
    
    if (response.ok) {
      const { urls } = await response.json();
      const result = [...urlsOrKeys];
      
      // Replace S3 URLs/keys with presigned URLs
      urlsOrKeys.forEach((urlOrKey, index) => {
        if (!urlOrKey) return;
        
        let key = urlOrKey;
        if (urlOrKey.includes('.s3.')) {
          const match = urlOrKey.match(/s3[^/]*\.amazonaws\.com\/(.+)/);
          if (match) key = match[1];
        } else if (urlOrKey.startsWith('s3://')) {
          const match = urlOrKey.match(/s3:\/\/[^/]+\/(.+)/);
          if (match) key = match[1];
        } else if (urlOrKey.includes('/') && !urlOrKey.startsWith('http') && !urlOrKey.startsWith('/')) {
          key = urlOrKey;
        } else {
          return; // Not an S3 key
        }
        
        if (urls[key]) {
          result[index] = urls[key];
        }
      });
      
      return result;
    }
  } catch (error) {
    console.error('Error getting presigned URLs:', error);
  }
  
  return urlsOrKeys;
}

