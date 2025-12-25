import { env } from '$env/dynamic/private';

/**
 * Remove background from an image using API4AI service
 * @param {File} imageFile - The image file to process
 * @param {string} imageUrl - Alternative: URL to the image
 * @returns {Promise<{success: boolean, image?: string, error?: string, details?: any}>}
 */
export async function removeBackground(imageFile, imageUrl = null) {
  try {
    if (!imageFile && !imageUrl) {
      return { success: false, error: 'No image provided. Provide either image file or url.' };
    }

    // Get API key from environment (default to demo endpoint if not set)
    const apiKey = env.API4AI_API_KEY;
    const useDemo = !apiKey; // Use demo endpoint if no API key
    console.log(apiKey, " > API4AI Key");
    console.log(useDemo, "> Use Demo");
    const apiEndpoint = useDemo 
      ? 'https://demo.api4ai.cloud/img-bg-removal/v1/results'
      : 'https://api4ai.cloud/img-bg-removal/v1/results';
    
    // Prepare form data for API4AI
    // Use native FormData which works with fetch in Node.js 18+
    const apiFormData = new FormData();
    
    if (imageFile && imageFile instanceof File) {
      // Convert File to Blob for proper serialization
      // Read the file stream and create a new Blob
      const arrayBuffer = await imageFile.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: imageFile.type || 'image/jpeg' });
      
      // Create a File-like object with the original name
      const fileToSend = new File([blob], imageFile.name, { type: imageFile.type || 'image/jpeg' });
      apiFormData.append('image', fileToSend);
    } else if (imageUrl) {
      apiFormData.append('url', imageUrl);
    }
    
    // Make request to API4AI
    // Don't set Content-Type - fetch will set it automatically with boundary for FormData
    const headers = {};
    if (apiKey) {
      headers['X-API-KEY'] = apiKey;
    }
    
    console.log('Calling API4AI:', {
      endpoint: apiEndpoint,
      hasApiKey: !!apiKey,
      useDemo,
      hasImageFile: !!imageFile,
      hasImageUrl: !!imageUrl,
      imageFileName: imageFile?.name,
      imageFileType: imageFile?.type,
      imageFileSize: imageFile?.size
    });
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: apiFormData
    });
    
    console.log('API4AI response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API4AI error:', response.status, errorText);
      return { 
        success: false,
        error: `Background removal failed: ${errorText}`,
        status: response.status,
        details: errorText
      };
    }
    
    let result;
    try {
      result = await response.json();
      console.log('API4AI response structure:', {
        hasResults: !!result.results,
        resultsLength: result.results?.length,
        firstResultStatus: result.results?.[0]?.status
      });
    } catch (parseError) {
      const responseText = await response.text();
      console.error('Failed to parse API4AI response as JSON:', parseError);
      console.error('Response text:', responseText.substring(0, 500));
      return { 
        success: false,
        error: 'Invalid response from background removal service',
        details: responseText.substring(0, 500)
      };
    }
    
    // Check if processing was successful
    if (result.results && result.results.length > 0) {
      const firstResult = result.results[0];
      
      if (firstResult.status.code === 'failure') {
        return { 
          success: false,
          error: firstResult.status.message || 'Background removal failed',
          details: firstResult
        };
      }
      
      // Extract the processed image (base64 PNG with transparent background)
      const imageEntity = firstResult.entities?.find(e => e.kind === 'image');
      
      if (!imageEntity || !imageEntity.image) {
        return { 
          success: false,
          error: 'No processed image found in response',
          details: firstResult
        };
      }
      
      // Return the base64 image data
      return {
        success: true,
        image: imageEntity.image, // Base64 encoded PNG with transparent background
        format: imageEntity.format || 'PNG',
        width: firstResult.width,
        height: firstResult.height,
        // Include bounding box info if available
        objects: firstResult.entities?.find(e => e.kind === 'objects')?.objects || []
      };
    }
    
    return { success: false, error: 'Unexpected response format' };
  } catch (err) {
    console.error('Error removing background:', err);
    return { 
      success: false,
      error: err.message || 'Failed to remove background'
    };
  }
}

