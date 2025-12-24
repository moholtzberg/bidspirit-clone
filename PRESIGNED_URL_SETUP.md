# Presigned URL Setup for S3 Images

## Installation

First, install the required package:

```bash
npm install @aws-sdk/s3-request-presigner
```

## What's Been Implemented

1. **Automatic Presigned URL Generation**: All S3 image URLs are automatically converted to presigned URLs when lots are fetched from the database
2. **API Endpoint**: `/api/images/presigned` - Can be used to manually convert S3 URLs/keys to presigned URLs
3. **Utility Functions**: `src/lib/utils/s3Presigned.js` - Helper functions for converting URLs

## How It Works

When you fetch lots from the API:
- The system automatically detects S3 URLs (like `https://pumbii.s3.amazonaws.com/lots/image.jpg`)
- It extracts the S3 key from the URL
- Generates a presigned URL that's valid for 1 hour
- Returns the presigned URL to the frontend

## Testing

After installing the package and restarting your dev server:

1. **Check the console** - You should see presigned URLs being generated
2. **View an image** - Images should now load correctly
3. **Check the URL** - Presigned URLs will have query parameters like `?X-Amz-Algorithm=...`

## Troubleshooting

If images still don't load:

1. **Check your .env file** - Make sure these are set:
   ```
   STORAGE_PROVIDER=s3
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_S3_BUCKET=dealer-edge-production
   AWS_REGION=us-east-1
   ```

2. **Check the console** - Look for errors about missing package or invalid credentials

3. **Test the presigned URL endpoint**:
   ```bash
   curl -X POST http://localhost:5173/api/images/presigned \
     -H "Content-Type: application/json" \
     -d '{"keys": ["lots/your-image-key.jpg"]}'
   ```

## Notes

- Presigned URLs expire after 1 hour
- The system automatically regenerates them when fetching lots
- Existing S3 URLs in your database will be automatically converted
- New uploads will store the S3 key, which gets converted to presigned URLs when served

