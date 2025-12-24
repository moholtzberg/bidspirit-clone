import { json } from '@sveltejs/kit';
import { uploadFile } from '$lib/services/cloudStorage.js';

export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    const lotId = formData.get('lotId'); // Optional: if creating images for a specific lot
    
    if (!files || files.length === 0) {
      return json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedImages = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;
      
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Upload to cloud storage
      const { url, key } = await uploadFile(buffer, file.name, 'lots');
      
      uploadedImages.push({
        url,
        key,
        filename: file.name,
        size: file.size,
        type: file.type
      });
    }

    return json({ images: uploadedImages });
  } catch (error) {
    console.error('Error uploading images:', error);
    return json({ error: error.message || 'Failed to upload images' }, { status: 500 });
  }
}

