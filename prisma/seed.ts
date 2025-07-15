import { PrismaClient } from '@prisma/client';
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
  
  const alice = await prisma.user.create({
    data: {
      username: 'alice',
      password: hashedPassword,
    },
  });
  
  const bob = await prisma.user.create({
    data: {
      username: 'bob',
      password: hashedPassword,
    },
  });
  
  const charlie = await prisma.user.create({
    data: {
      username: 'charlie',
      password: hashedPassword,
    },
  });

  console.log('👥 Created test users');

  // Create folders for Alice
  const documentsFolder = await prisma.folder.create({
    data: {
      name: 'Documents',
      userId: alice.id,
    },
  });
  
  const picturesFolder = await prisma.folder.create({
    data: {
      name: 'Pictures',
      userId: alice.id,
    },
  });
  
  const projectsFolder = await prisma.folder.create({
    data: {
      name: 'Projects',
      userId: alice.id,
    },
  });

  // Create subfolders
  const workFolder = await prisma.folder.create({
    data: {
      name: 'Work',
      parentId: documentsFolder.id,
      userId: alice.id,
    },
  });
  
  const personalFolder = await prisma.folder.create({
    data: {
      name: 'Personal',
      parentId: documentsFolder.id,
      userId: alice.id,
    },
  });
  
  const vacationFolder = await prisma.folder.create({
    data: {
      name: 'Vacation 2024',
      parentId: picturesFolder.id,
      userId: alice.id,
    },
  });
  
  const dropzoneFolder = await prisma.folder.create({
    data: {
      name: 'DropZone App',
      parentId: projectsFolder.id,
      userId: alice.id,
    },
  });

  // Create folders for Bob
  const bobMusicFolder = await prisma.folder.create({
    data: {
      name: 'Music',
      userId: bob.id,
    },
  });
  
  const bobVideosFolder = await prisma.folder.create({
    data: {
      name: 'Videos',
      userId: bob.id,
    },
  });

  console.log('📁 Created test folders');

  // Create test files
  // Alice's files
  const resumeFile = await prisma.file.create({
    data: {
      originalName: 'resume.pdf',
      storedName: 'f1_resume_2024.pdf',
      mimeType: 'application/pdf',
      size: 245760, // ~240KB
      folderId: workFolder.id,
      userId: alice.id,
      isPublic: false,
    },
  });
  
  const contractFile = await prisma.file.create({
    data: {
      originalName: 'contract.docx',
      storedName: 'f2_contract_draft.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 156800, // ~153KB
      folderId: workFolder.id,
      userId: alice.id,
      isPublic: false,
    },
  });
  
  const beachPhotoFile = await prisma.file.create({
    data: {
      originalName: 'beach_sunset.jpg',
      storedName: 'f3_beach_sunset_2024.jpg',
      mimeType: 'image/jpeg',
      size: 2048000, // ~2MB
      folderId: vacationFolder.id,
      userId: alice.id,
      isPublic: true,
    },
  });
  
  const familyPhotoFile = await prisma.file.create({
    data: {
      originalName: 'family_dinner.png',
      storedName: 'f4_family_dinner.png',
      mimeType: 'image/png',
      size: 3072000, // ~3MB
      folderId: vacationFolder.id,
      userId: alice.id,
      isPublic: false,
    },
  });
  
  const projectSpecFile = await prisma.file.create({
    data: {
      originalName: 'project_spec.md',
      storedName: 'f5_project_specification.md',
      mimeType: 'text/markdown',
      size: 12800, // ~12.5KB
      folderId: dropzoneFolder.id,
      userId: alice.id,
      isPublic: false,
    },
  });
  
  const shoppingListFile = await prisma.file.create({
    data: {
      originalName: 'shopping_list.txt',
      storedName: 'f6_shopping_list_jan.txt',
      mimeType: 'text/plain',
      size: 512, // 512 bytes
      folderId: personalFolder.id,
      userId: alice.id,
      isPublic: false,
    },
  });
  
  // Bob's files
  const songFile = await prisma.file.create({
    data: {
      originalName: 'favorite_song.mp3',
      storedName: 'f7_favorite_song_2024.mp3',
      mimeType: 'audio/mpeg',
      size: 5242880, // ~5MB
      folderId: bobMusicFolder.id,
      userId: bob.id,
      isPublic: true,
    },
  });
  
  const workoutVideoFile = await prisma.file.create({
    data: {
      originalName: 'workout_routine.mp4',
      storedName: 'f8_workout_routine_jan.mp4',
      mimeType: 'video/mp4',
      size: 52428800, // ~50MB
      folderId: bobVideosFolder.id,
      userId: bob.id,
      isPublic: false,
    },
  });
  
  // Files without folders (root level)
  const readmeFile = await prisma.file.create({
    data: {
      originalName: 'readme.txt',
      storedName: 'f9_readme_instructions.txt',
      mimeType: 'text/plain',
      size: 1024, // 1KB
      folderId: null, // Root level
      userId: alice.id,
      isPublic: true,
    },
  });
  
  const profilePicFile = await prisma.file.create({
    data: {
      originalName: 'profile_pic.jpg',
      storedName: 'f10_profile_picture.jpg',
      mimeType: 'image/jpeg',
      size: 512000, // ~500KB
      folderId: null, // Root level
      userId: bob.id,
      isPublic: true,
    },
  });

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
