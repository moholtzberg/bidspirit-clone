/**
 * Utility to convert S3 URLs/keys to presigned URLs
 * This ensures private S3 images are accessible
 */

import { getPresignedUrl } from '$lib/services/cloudStorage.js';

/**
 * Check if a URL is an S3 URL that needs presigning
 */
function isS3Url(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('.s3.') || 
         url.includes('s3.amazonaws.com') || 
         url.startsWith('s3://') ||
         (url.includes('/') && !url.startsWith('http') && !url.startsWith('/'));
}

/**
 * Extract S3 key from various URL formats
 */
function extractS3Key(url) {
  if (!url) return null;
  
  // s3://bucket/key format
  if (url.startsWith('s3://')) {
    const match = url.match(/s3:\/\/[^/]+\/(.+)/);
    return match ? match[1] : null;
  }
  
  // https://bucket.s3.region.amazonaws.com/key or https://bucket.s3.amazonaws.com/key
  if (url.includes('.s3.')) {
    const match = url.match(/s3[^/]*\.amazonaws\.com\/(.+?)(?:\?|$)/);
    return match ? match[1] : null;
  }
  
  // Just the key (e.g., "lots/image.jpg")
  if (url.includes('/') && !url.startsWith('http') && !url.startsWith('/')) {
    return url;
  }
  
  return null;
}

/**
 * Convert a single S3 URL/key to presigned URL
 */
export async function convertToPresignedUrl(url) {
  if (!url || !isS3Url(url)) {
    return url; // Return as-is if not an S3 URL
  }
  
  const key = extractS3Key(url);
  if (!key) {
    return url; // Can't extract key, return original
  }
  
  try {
    return await getPresignedUrl(key, 3600); // 1 hour expiration
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return url; // Fallback to original URL
  }
}

/**
 * Convert multiple S3 URLs/keys to presigned URLs
 */
export async function convertToPresignedUrls(urls) {
  if (!urls || !Array.isArray(urls)) {
    return urls;
  }
  
  const results = await Promise.all(
    urls.map(url => convertToPresignedUrl(url))
  );
  
  return results;
}

/**
 * Convert image objects with URLs to presigned URLs
 */
export async function convertImageObjects(images) {
  if (!images || !Array.isArray(images)) {
    return images;
  }
  
  const results = await Promise.all(
    images.map(async (img) => {
      if (typeof img === 'string') {
        return await convertToPresignedUrl(img);
      }
      
      if (img && img.url) {
        return {
          ...img,
          url: await convertToPresignedUrl(img.url)
        };
      }
      
      return img;
    })
  );
  
  return results;
}

