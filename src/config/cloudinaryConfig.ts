import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define allowed formats
const ALLOWED_FORMATS = [
  // Images
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico',
  // Documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf',
  // Archives
  'zip', 'rar', '7z', 'tar', 'gz',
  // Audio
  'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a',
  // Video
  'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv',
  // Code files
  'html', 'css', 'js', 'json', 'xml', 'csv'
];

// Create Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    return {
      folder: 'file-uploader',
      resource_type: 'auto', // Auto-detect the resource type
      use_filename: true,
      unique_filename: true,
      // Remove allowed_formats to be more permissive
      // Cloudinary will handle most file types automatically
    };
  }
});

export { cloudinary, storage };
export default storage;
