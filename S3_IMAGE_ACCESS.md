# S3 Image Access Configuration

Your S3 bucket is currently private, which means images need presigned URLs to be accessible. You have two options:

## Option 1: Make S3 Bucket Public (Simpler)

If you want images to be publicly accessible without presigned URLs:

1. Go to your S3 bucket in AWS Console
2. Go to **Permissions** tab
3. Edit **Block public access** settings and uncheck all options
4. Add a bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::dealer-edge-production/*"
    }
  ]
}
```

Replace `dealer-edge-production` with your actual bucket name.

**Pros:** Simple, no code changes needed
**Cons:** Images are publicly accessible to anyone with the URL

## Option 2: Use Presigned URLs (More Secure)

This is already implemented. You need to:

1. Install the presigner package:
   ```bash
   npm install @aws-sdk/s3-request-presigner
   ```

2. The system will automatically generate presigned URLs when serving images via the API endpoint `/api/images/presigned`

3. Presigned URLs expire after 1 hour by default

**Pros:** More secure, images are not publicly accessible
**Cons:** Requires code changes, URLs expire

## Current Implementation

The code is set up to use presigned URLs. When you upload images:
- The S3 key is stored in the database
- When images are displayed, they should be converted to presigned URLs

However, existing images in your database have full S3 URLs like:
`https://pumbii.s3.amazonaws.com/lots/1766606110493-cmprc5.jpg`

These need to be converted to presigned URLs. The `/api/images/presigned` endpoint handles this.

## Next Steps

1. **Install the presigner package:**
   ```bash
   npm install @aws-sdk/s3-request-presigner
   ```

2. **Restart your dev server**

3. **Test the presigned URL endpoint:**
   ```bash
   curl -X POST http://localhost:5173/api/images/presigned \
     -H "Content-Type: application/json" \
     -d '{"keys": ["lots/1766606110493-cmprc5.jpg"]}'
   ```

4. **Or make the bucket public** (Option 1) if you prefer simplicity

