import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

async function migrateFilesToCloudinary() {
  try {
    console.log('Starting migration of existing files to Cloudinary...');
    
    // Get all files that don't have Cloudinary URLs yet
    const files = await prisma.file.findMany({
      where: {
        cloudinaryUrl: null
      }
    });

    console.log(`Found ${files.length} files to migrate`);

    let migrated = 0;
    let failed = 0;

    for (const file of files) {
      try {
        const localFilePath = path.join(process.cwd(), 'uploads', file.storedName);
        
        // Check if local file exists
        if (!fs.existsSync(localFilePath)) {
          console.log(`Local file not found: ${file.originalName} (${file.id})`);
          failed++;
          continue;
        }

        console.log(`Uploading ${file.originalName}...`);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(localFilePath, {
          folder: 'file-uploader',
          public_id: `migrated_${file.id}`,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true
        });

        // Update database record
        await prisma.file.update({
          where: { id: file.id },
          data: {
            storedName: result.public_id,
            cloudinaryUrl: result.url,
            secureUrl: result.secure_url
          }
        });

        // Optionally delete local file after successful upload
        // fs.unlinkSync(localFilePath);

        migrated++;
        console.log(`✓ Migrated ${file.originalName}`);

      } catch (error) {
        console.error(`✗ Failed to migrate ${file.originalName}:`, error);
        failed++;
      }
    }

    console.log(`\nMigration complete:`);
    console.log(`  Migrated: ${migrated} files`);
    console.log(`  Failed: ${failed} files`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if called directly
if (require.main === module) {
  migrateFilesToCloudinary();
}

export default migrateFilesToCloudinary;
