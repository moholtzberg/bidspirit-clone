import { json } from '@sveltejs/kit';

/**
 * Proxy endpoint to fetch images from S3 and return them as blobs
 * This bypasses CORS issues when loading images into canvas
 */
export async function GET({ url }) {
  const imageUrl = url.searchParams.get('url');
  
  if (!imageUrl) {
    return json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Fetch the image from S3
    const response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*'
      }
    });

    if (!response.ok) {
      return json({ error: 'Failed to fetch image' }, { status: response.status });
    }

    // Get the image as a blob
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return the image with appropriate headers
    return new Response(buffer, {
      headers: {
        'Content-Type': blob.type || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return json({ error: 'Failed to proxy image' }, { status: 500 });
  }
}

