import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (in development only)
  await prisma.file.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleared existing data');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'alice',
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        username: 'bob',
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-3',
        username: 'charlie',
        password: hashedPassword,
      },
    }),
  ]);

  console.log('👥 Created test users');

  // Create folders for Alice
  const aliceRootFolders = await Promise.all([
    prisma.folder.create({
      data: {
        id: 'folder-1',
        name: 'Documents',
        userId: 'user-1',
      },
    }),
    prisma.folder.create({
      data: {
        id: 'folder-2',
        name: 'Pictures',
        userId: 'user-1',
      },
    }),
    prisma.folder.create({
      data: {
        id: 'folder-3',
        name: 'Projects',
        userId: 'user-1',
      },
    }),
  ]);

  // Create subfolders
  const aliceSubFolders = await Promise.all([
    prisma.folder.create({
      data: {
        id: 'folder-4',
        name: 'Work',
        parentId: 'folder-1',
        userId: 'user-1',
      },
    }),
    prisma.folder.create({
      data: {
        id: 'folder-5',
        name: 'Personal',
        parentId: 'folder-1',
        userId: 'user-1',
      },
    }),
    prisma.folder.create({
      data: {
        id: 'folder-6',
        name: 'Vacation 2024',
        parentId: 'folder-2',
        userId: 'user-1',
      },
    }),
    prisma.folder.create({
      data: {
        id: 'folder-7',
        name: 'DropZone App',
        parentId: 'folder-3',
        userId: 'user-1',
      },
    }),
  ]);

  // Create folders for Bob
  const bobFolders = await Promise.all([
    prisma.folder.create({
      data: {
        id: 'folder-8',
        name: 'Music',
        userId: 'user-2',
      },
    }),
    prisma.folder.create({
      data: {
        id: 'folder-9',
        name: 'Videos',
        userId: 'user-2',
      },
    }),
  ]);

  console.log('📁 Created test folders');

  // Create test files
  const files = await Promise.all([
    // Alice's files
    prisma.file.create({
      data: {
        id: 'file-1',
        originalName: 'resume.pdf',
        storedName: 'f1_resume_2024.pdf',
        mimeType: 'application/pdf',
        size: 245760, // ~240KB
        folderId: 'folder-4', // Work folder
        userId: 'user-1',
        isPublic: false,
      },
    }),
    prisma.file.create({
      data: {
        id: 'file-2',
        originalName: 'contract.docx',
        storedName: 'f2_contract_draft.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 156800, // ~153KB
        folderId: 'folder-4', // Work folder
        userId: 'user-1',
        isPublic: false,
      },
    }),
    prisma.file.create({
      data: {
        id: 'file-3',
        originalName: 'beach_sunset.jpg',
        storedName: 'f3_beach_sunset_2024.jpg',
        mimeType: 'image/jpeg',
        size: 2048000, // ~2MB
        folderId: 'folder-6', // Vacation 2024 folder
        userId: 'user-1',
        isPublic: true,
      },
    }),
    prisma.file.create({
      data: {
        id: 'file-4',
        originalName: 'family_dinner.png',
        storedName: 'f4_family_dinner.png',
        mimeType: 'image/png',
        size: 3072000, // ~3MB
        folderId: 'folder-6', // Vacation 2024 folder
        userId: 'user-1',
        isPublic: false,
      },
    }),
    prisma.file.create({
      data: {
        id: 'file-5',
        originalName: 'project_spec.md',
        storedName: 'f5_project_specification.md',
        mimeType: 'text/markdown',
        size: 12800, // ~12.5KB
        folderId: 'folder-7', // DropZone App folder
        userId: 'user-1',
        isPublic: false,
      },
    }),
    prisma.file.create({
      data: {
        id: 'file-6',
        originalName: 'shopping_list.txt',
        storedName: 'f6_shopping_list_jan.txt',
        mimeType: 'text/plain',
        size: 512, // 512 bytes
        folderId: 'folder-5', // Personal folder
        userId: 'user-1',
        isPublic: false,
      },
    }),
    // Bob's files
    prisma.file.create({
      data: {
        id: 'file-7',
        originalName: 'favorite_song.mp3',
        storedName: 'f7_favorite_song_2024.mp3',
        mimeType: 'audio/mpeg',
        size: 5242880, // ~5MB
        folderId: 'folder-8', // Music folder
        userId: 'user-2',
        isPublic: true,
      },
    }),
    prisma.file.create({
      data: {
        id: 'file-8',
        originalName: 'workout_routine.mp4',
        storedName: 'f8_workout_routine_jan.mp4',
        mimeType: 'video/mp4',
        size: 52428800, // ~50MB
        folderId: 'folder-9', // Videos folder
        userId: 'user-2',
        isPublic: false,
      },
    }),
    // Files without folders (root level)
    prisma.file.create({
      data: {
        id: 'file-9',
        originalName: 'readme.txt',
        storedName: 'f9_readme_instructions.txt',
        mimeType: 'text/plain',
        size: 1024, // 1KB
        folderId: null, // Root level
        userId: 'user-1',
        isPublic: true,
      },
    }),
    prisma.file.create({
      data: {
        id: 'file-10',
        originalName: 'profile_pic.jpg',
        storedName: 'f10_profile_picture.jpg',
        mimeType: 'image/jpeg',
        size: 512000, // ~500KB
        folderId: null, // Root level
        userId: 'user-2',
        isPublic: true,
      },
    }),
  ]);

  console.log('📄 Created test files');

  // Print summary
  const userCount = await prisma.user.count();
  const folderCount = await prisma.folder.count();
  const fileCount = await prisma.file.count();

  console.log('✅ Seed completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   👥 Users: ${userCount}`);
  console.log(`   📁 Folders: ${folderCount}`);
  console.log(`   📄 Files: ${fileCount}`);
  console.log('');
  console.log('🔑 Test credentials:');
  console.log('   Username: alice | Password: password123');
  console.log('   Username: bob   | Password: password123');
  console.log('   Username: charlie | Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
