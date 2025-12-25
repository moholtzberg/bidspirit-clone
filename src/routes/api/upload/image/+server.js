import { json } from '@sveltejs/kit';
import { uploadFile } from '$lib/services/cloudStorage.js';
import { removeBackground as removeBackgroundService } from '$lib/services/backgroundRemoval.js';

export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    const lotId = formData.get('lotId'); // Optional: if creating images for a specific lot
    const shouldRemoveBackground = formData.get('removeBackground') === 'true'; // Checkbox value
    
    if (!files || files.length === 0) {
      return json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedImages = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;
      
      let buffer;
      let processedFileName = file.name;
      
      // If background removal is requested, process the image first
      if (shouldRemoveBackground) {
        try {
          // Call background removal service directly (no HTTP request needed)
          const bgResult = await removeBackgroundService(file);
          
          if (bgResult.success && bgResult.image) {
            // Convert base64 PNG to buffer
            // API4AI returns base64 string, may or may not have data URI prefix
            let base64Data = bgResult.image;
            if (base64Data.includes(',')) {
              // Has data URI prefix, remove it
              base64Data = base64Data.split(',')[1];
            }
            // Remove any whitespace
            base64Data = base64Data.trim();
            
            try {
              buffer = Buffer.from(base64Data, 'base64');
              processedFileName = file.name.replace(/\.(jpg|jpeg|png)$/i, '.png'); // Change extension to PNG
              console.log('Background removed successfully, converted to PNG');
            } catch (base64Error) {
              console.error('Failed to decode base64 image:', base64Error);
              throw base64Error;
            }
          } else {
            console.warn('Background removal failed, using original image:', bgResult.error || 'Unknown error');
            // Fall back to original image
            const arrayBuffer = await file.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
          }
        } catch (bgError) {
          console.error('Error during background removal, using original image:', bgError);
          // Fall back to original image
          const arrayBuffer = await file.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
        }
      } else {
        // Convert file to buffer (no background removal)
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }
      
      // Upload to cloud storage
      const { url, key } = await uploadFile(buffer, processedFileName, 'lots');
      
      uploadedImages.push({
        url,
        key,
        filename: processedFileName,
        size: buffer.length,
        type: shouldRemoveBackground ? 'image/png' : file.type,
        backgroundRemoved: shouldRemoveBackground
      });
    }

    return json({ images: uploadedImages });
  } catch (error) {
    console.error('Error uploading images:', error);
    return json({ error: error.message || 'Failed to upload images' }, { status: 500 });
  }
}

