/**
 * Cloud Storage Service
 * Supports multiple cloud storage providers (S3, Cloudinary, etc.)
 * Configure via environment variables
 */

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local'; // 'local', 's3', 'cloudinary'

/**
 * Upload a file buffer to cloud storage
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} folder - Folder path in storage (e.g., 'lots')
 * @returns {Promise<{url: string, key: string}>} - Uploaded file URL and storage key
 */
export async function uploadFile(buffer, filename, folder = 'lots') {
  switch (STORAGE_PROVIDER) {
    case 's3':
      return await uploadToS3(buffer, filename, folder);
    case 'cloudinary':
      return await uploadToCloudinary(buffer, filename, folder);
    case 'local':
    default:
      return await uploadToLocal(buffer, filename, folder);
  }
}

/**
 * Delete a file from cloud storage
 * @param {string} key - Storage key/identifier
 * @param {string} folder - Folder path
 * @returns {Promise<void>}
 */
export async function deleteFile(key, folder = 'lots') {
  switch (STORAGE_PROVIDER) {
    case 's3':
      return await deleteFromS3(key, folder);
    case 'cloudinary':
      return await deleteFromCloudinary(key);
    case 'local':
    default:
      return await deleteFromLocal(key, folder);
  }
}

// ===== S3 Implementation =====
async function uploadToS3(buffer, filename, folder) {
  try {
    // Install: npm install @aws-sdk/client-s3
    // Lazy import to prevent Vite from analyzing at build time
    const s3Package = '@aws-sdk/client-s3';
    const s3Module = await import(/* @vite-ignore */ s3Package).catch(() => {
      throw new Error('@aws-sdk/client-s3 is not installed. Run: npm install @aws-sdk/client-s3');
    });
    const { S3Client, PutObjectCommand } = s3Module;
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const ext = filename.split('.').pop() || 'jpg';
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const bucket = process.env.AWS_S3_BUCKET;

    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`
    }));

    const url = `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    return { url, key };
  } catch (error) {
    if (error.message.includes('not installed')) {
      throw error;
    }
    throw new Error(`S3 upload failed: ${error.message}`);
  }
}

async function deleteFromS3(key, folder) {
  try {
    // Lazy import to prevent Vite from analyzing at build time
    const s3Package = '@aws-sdk/client-s3';
    const s3Module = await import(/* @vite-ignore */ s3Package).catch(() => {
      throw new Error('@aws-sdk/client-s3 is not installed. Run: npm install @aws-sdk/client-s3');
    });
    const { S3Client, DeleteObjectCommand } = s3Module;
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    }));
  } catch (error) {
    if (error.message.includes('not installed')) {
      throw error;
    }
    throw new Error(`S3 delete failed: ${error.message}`);
  }
}

// ===== Cloudinary Implementation =====
async function uploadToCloudinary(buffer, filename, folder) {
  try {
    // Install: npm install cloudinary
    // Lazy import to prevent Vite from analyzing at build time
    const cloudinaryPackage = 'cloudinary';
    const cloudinaryModule = await import(/* @vite-ignore */ cloudinaryPackage).catch(() => {
      throw new Error('cloudinary is not installed. Run: npm install cloudinary');
    });
    const cloudinary = cloudinaryModule.v2;
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve({ url: result.secure_url, key: result.public_id });
        }
      ).end(buffer);
    });
  } catch (error) {
    if (error.message.includes('not installed')) {
      throw error;
    }
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
}

async function deleteFromCloudinary(key) {
  try {
    // Lazy import to prevent Vite from analyzing at build time
    const cloudinaryPackage = 'cloudinary';
    const cloudinaryModule = await import(/* @vite-ignore */ cloudinaryPackage).catch(() => {
      throw new Error('cloudinary is not installed. Run: npm install cloudinary');
    });
    const cloudinary = cloudinaryModule.v2;
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    await cloudinary.uploader.destroy(key);
  } catch (error) {
    if (error.message.includes('not installed')) {
      throw error;
    }
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
}

// ===== Local Storage Implementation =====
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

async function uploadToLocal(buffer, filename, folder) {
  const uploadDir = join(process.cwd(), 'static', 'uploads', folder);
  await mkdir(uploadDir, { recursive: true });

  const ext = filename.split('.').pop() || 'jpg';
  const uniqueFilename = `${randomBytes(16).toString('hex')}.${ext}`;
  const filepath = join(uploadDir, uniqueFilename);

  await writeFile(filepath, buffer);
  
  const url = `/uploads/${folder}/${uniqueFilename}`;
  const key = `${folder}/${uniqueFilename}`;
  
  return { url, key };
}

async function deleteFromLocal(key, folder) {
  const filepath = join(process.cwd(), 'static', 'uploads', key);
  try {
    await unlink(filepath);
  } catch (error) {
    // File might not exist, ignore
    console.warn('File not found for deletion:', filepath);
  }
}

