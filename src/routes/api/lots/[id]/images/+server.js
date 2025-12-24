import { json, error } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { deleteFile } from '$lib/services/cloudStorage.js';

// Get all images for a lot
export async function GET({ params }) {
  try {
    const images = await prisma.lotImage.findMany({
      where: { lotId: params.id },
      orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }]
    });
    return json(images);
  } catch (err) {
    console.error('Error fetching lot images:', err);
    throw error(500, 'Failed to fetch images');
  }
}

// Add images to a lot
export async function POST({ params, request }) {
  try {
    const { images } = await request.json(); // Array of {url, key, displayOrder?, isPrimary?}
    
    if (!Array.isArray(images) || images.length === 0) {
      throw error(400, 'Images array is required');
    }

    // Verify lot exists
    const lot = await prisma.lot.findUnique({
      where: { id: params.id }
    });

    if (!lot) {
      throw error(404, 'Lot not found');
    }

    // If setting a primary image, unset existing primary
    const hasPrimary = images.some(img => img.isPrimary);
    if (hasPrimary) {
      await prisma.lotImage.updateMany({
        where: { lotId: params.id, isPrimary: true },
        data: { isPrimary: false }
      });
    }

    // Create image records
    const createdImages = await Promise.all(
      images.map((img, index) =>
        prisma.lotImage.create({
          data: {
            lotId: params.id,
            url: img.url,
            cloudKey: img.key,
            displayOrder: img.displayOrder ?? index,
            isPrimary: img.isPrimary ?? false
          }
        })
      )
    );

    return json(createdImages, { status: 201 });
  } catch (err) {
    console.error('Error creating lot images:', err);
    if (err.status) throw err;
    throw error(500, 'Failed to create images');
  }
}

// Delete an image
export async function DELETE({ params, url }) {
  try {
    const imageId = url.searchParams.get('imageId');
    if (!imageId) {
      throw error(400, 'imageId parameter is required');
    }

    const image = await prisma.lotImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw error(404, 'Image not found');
    }

    // Delete from cloud storage
    if (image.cloudKey) {
      try {
        await deleteFile(image.cloudKey, 'lots');
      } catch (deleteError) {
        console.warn('Failed to delete from cloud storage:', deleteError);
        // Continue with database deletion even if cloud deletion fails
      }
    }

    // Delete from database
    await prisma.lotImage.delete({
      where: { id: imageId }
    });

    return json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Error deleting image:', err);
    if (err.status) throw err;
    throw error(500, 'Failed to delete image');
  }
}

