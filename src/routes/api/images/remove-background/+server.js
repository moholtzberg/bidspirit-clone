import { json } from '@sveltejs/kit';
import { removeBackground } from '$lib/services/backgroundRemoval.js';

/**
 * API endpoint for background removal
 * This endpoint can be called from the frontend if needed
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const imageUrl = formData.get('url'); // Alternative: pass image URL
    
    if (!imageFile && !imageUrl) {
      return json({ error: 'No image provided. Provide either image file or url.' }, { status: 400 });
    }

    // Call the shared background removal service
    const result = await removeBackground(imageFile, imageUrl);
    
    if (result.success) {
      return json({
        success: true,
        image: result.image,
        format: result.format,
        width: result.width,
        height: result.height,
        objects: result.objects
      });
    } else {
      return json({ 
        error: result.error || 'Background removal failed',
        details: result.details
      }, { status: result.status || 500 });
    }
  } catch (err) {
    console.error('Error in background removal endpoint:', err);
    return json({ error: err.message || 'Failed to remove background' }, { status: 500 });
  }
}

