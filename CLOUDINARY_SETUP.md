# Cloudinary Configuration

This application now uses Cloudinary for file storage instead of local file storage.

## Setup Instructions

1. **Create a Cloudinary Account**

   - Go to [https://cloudinary.com](https://cloudinary.com)
   - Sign up for a free account
   - Note down your Cloud Name, API Key, and API Secret from the dashboard

2. **Update Environment Variables**
   Update your `.env` file with your Cloudinary credentials:

   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   CLOUDINARY_API_KEY=your_api_key_here
   CLOUDINARY_API_SECRET=your_api_secret_here
   ```

3. **Run Database Migration**

   ```bash
   npx prisma migrate dev
   ```

4. **Migrate Existing Files (Optional)**
   If you have existing files in the local uploads folder, you can migrate them to Cloudinary:
   ```bash
   npm run migrate-to-cloudinary
   ```

## Features

- **Automatic File Optimization**: Cloudinary automatically optimizes images and other media files
- **CDN Delivery**: Files are served through Cloudinary's global CDN for faster delivery
- **Multiple Format Support**: Supports images, videos, documents, and other file types
- **Secure URLs**: All files are served through HTTPS
- **File Transformations**: Cloudinary can automatically transform images (resize, format conversion, etc.)

## Configuration

The Cloudinary configuration is in `src/config/cloudinaryConfig.ts`. You can modify:

- Upload folder structure
- File size limits
- Allowed file formats
- Image transformations

## File Management

- Files are uploaded directly to Cloudinary
- Database stores Cloudinary public_id, URL, and secure_url
- File downloads redirect to Cloudinary URLs
- File deletion removes from both database and Cloudinary

## Migration from Local Storage

If you're migrating from the previous local storage setup:

1. Old files will still work if they exist in the uploads folder
2. Use the migration script to move existing files to Cloudinary
3. New uploads will automatically go to Cloudinary
4. You can safely delete the uploads folder after migration
