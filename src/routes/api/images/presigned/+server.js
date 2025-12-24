import { json, error } from '@sveltejs/kit';
import { getPresignedUrl } from '$lib/services/cloudStorage.js';

/**
 * Generate presigned URLs for S3 images
 * POST body: { keys: ['lots/image1.jpg', 'lots/image2.jpg'] }
 * Returns: { urls: { 'lots/image1.jpg': 'https://...', ... } }
 */
export async function POST({ request }) {
  try {
    const { keys } = await request.json();
    
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return json({ error: 'keys array is required' }, { status: 400 });
    }

    const urls = {};
    
    for (const key of keys) {
      try {
        // Extract key from full URL if needed
        let s3Key = key;
        let needsPresigning = true;
        
        if (key.startsWith('s3://')) {
          // Extract key from s3://bucket/key format
          const match = key.match(/s3:\/\/[^/]+\/(.+)/);
          if (match) {
            s3Key = match[1];
          }
        } else if (key.startsWith('http://') || key.startsWith('https://')) {
          // Check if it's an S3 URL
          if (key.includes('.s3.') || key.includes('s3.amazonaws.com')) {
            // Extract key from full S3 URL (handles both formats)
            // https://bucket.s3.region.amazonaws.com/key
            // https://bucket.s3.amazonaws.com/key
            const match = key.match(/s3[^/]*\.amazonaws\.com\/(.+?)(?:\?|$)/);
            if (match) {
              s3Key = match[1];
            } else {
              // If we can't extract, might already be presigned or external
              urls[key] = key;
              continue;
            }
          } else {
            // External URL or already presigned, use as-is
            urls[key] = key;
            continue;
          }
        } else if (key.startsWith('/')) {
          // Local URL, use as-is
          urls[key] = key;
          continue;
        }
        
        // Generate presigned URL for the S3 key
        urls[key] = await getPresignedUrl(s3Key, 3600); // 1 hour expiration
      } catch (err) {
        console.error(`Error generating presigned URL for ${key}:`, err);
        urls[key] = key; // Fallback to original key/URL
      }
    }

    return json({ urls });
  } catch (err) {
    console.error('Error generating presigned URLs:', err);
    return json({ error: err.message || 'Failed to generate presigned URLs' }, { status: 500 });
  }
}

