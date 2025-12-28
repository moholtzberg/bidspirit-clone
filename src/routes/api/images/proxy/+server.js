import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * Proxy endpoint to fetch images from S3 with proper CORS headers
 * This allows canvas elements to load images without CORS issues
 */
export async function GET({ url, locals }) {
  try {
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
      throw error(400, 'Image URL is required');
    }

    // Verify user is authenticated
    const session = await locals.auth?.();
    if (!session?.user) {
      throw error(401, 'Unauthorized');
    }

    // Fetch the image from the provided URL
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw error(response.status, `Failed to fetch image: ${response.statusText}`);
    }

    // Get the image data
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper CORS headers
    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err) {
    if (err.status) {
      throw err;
    }
    console.error('Error proxying image:', err);
    throw error(500, err.message || 'Failed to proxy image');
  }
}
