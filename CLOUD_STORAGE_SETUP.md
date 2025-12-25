# Cloud Storage Setup

The application now supports multiple cloud storage providers for image uploads. Configure your preferred provider using environment variables.

## Supported Providers

### 1. Local Storage (Default)
Stores files in `static/uploads/` directory.

**Environment Variables:**
```env
STORAGE_PROVIDER=local
```

No additional configuration needed.

### 2. AWS S3

**Installation:**
```bash
npm install @aws-sdk/client-s3
```

**Environment Variables:**
```env
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
```

### 3. Cloudinary

**Installation:**
```bash
npm install cloudinary
```

**Environment Variables:**
```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Database Migration

After updating the schema, run:

```bash
npx prisma db push
```

Or create a migration:

```bash
npx prisma migrate dev --name add_lot_images
```

## API Endpoints

### Upload Images
`POST /api/upload/image`
- Accepts multiple files via FormData
- Returns array of image objects with `url` and `key`

### Manage Lot Images
- `GET /api/lots/[id]/images` - Get all images for a lot
- `POST /api/lots/[id]/images` - Add images to a lot
- `DELETE /api/lots/[id]/images?imageId=[id]` - Delete an image

## Notes

- Images are stored in a separate `LotImage` table
- Each lot can have multiple images
- One image can be marked as primary
- Images have a display order for sorting
- Cloud storage keys are stored for deletion purposes
