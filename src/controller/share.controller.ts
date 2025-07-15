import { Request, RequestHandler, Response, NextFunction } from 'express';
import prisma from '../database/prismaClient';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

// Validation middleware
export const validateCreateShare = [
  body('folderId')
    .notEmpty()
    .withMessage('Folder ID is required')
    .isString()
    .withMessage('Folder ID must be a string'),
  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .matches(/^\d+[dhm]$/)
    .withMessage('Duration must be in format like "7d", "24h", or "30m"')
];

export const validateShareToken = [
  param('shareToken')
    .notEmpty()
    .withMessage('Share token is required')
    .isUUID()
    .withMessage('Invalid share token format')
];

export const validateExtendShare = [
  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .matches(/^\d+[dhm]$/)
    .withMessage('Duration must be in format like "7d", "24h", or "30m"')
];

// Helper function to parse duration string (e.g., "7d", "1h", "30m")
function parseDuration(duration: string): Date {
  const now = new Date();
  const match = duration.match(/^(\d+)([dhm])$/);
  
  if (!match) {
    throw new Error('Invalid duration format. Use format like "7d", "24h", or "30m"');
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'd': // days
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    case 'h': // hours
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'm': // minutes
      return new Date(now.getTime() + value * 60 * 1000);
    default:
      throw new Error('Invalid duration unit. Use "d" for days, "h" for hours, or "m" for minutes');
  }
}

// Create a folder share
export const createFolderShare: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(error => error.msg)
      });
    }

    const { folderId, duration } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify folder exists and belongs to user
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        user: { select: { username: true } }
      }
    });

    if (!folder || folder.userId !== userId) {
      return res.status(404).json({ error: 'Folder not found or access denied' });
    }

    // Parse duration
    const expiresAt = parseDuration(duration);

    // Generate unique share token
    const shareToken = uuidv4();

    // Check if there's already an active share for this folder
    const existingShare = await prisma.folderShare.findFirst({
      where: {
        folderId: folderId,
        userId: userId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingShare) {
      return res.status(400).json({ 
        error: 'Folder already has an active share link',
        shareToken: existingShare.shareToken,
        expiresAt: existingShare.expiresAt
      });
    }

    // Create the share
    const folderShare = await prisma.folderShare.create({
      data: {
        folderId,
        userId,
        shareToken,
        expiresAt,
        isActive: true
      },
      include: {
        folder: { select: { name: true } }
      }
    });

    res.status(201).json({
      message: 'Folder share created successfully',
      share: {
        id: folderShare.id,
        shareToken: folderShare.shareToken,
        shareUrl: `${req.protocol}://${req.get('host')}/share/${folderShare.shareToken}`,
        folderName: folderShare.folder.name,
        expiresAt: folderShare.expiresAt,
        createdAt: folderShare.createdAt
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid duration')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// Get shared folder content (public access)
export const getSharedFolder: RequestHandler = async (req, res, next) => {
  try {
    const { shareToken } = req.params;

    // Find the share
    const folderShare = await prisma.folderShare.findUnique({
      where: { shareToken },
      include: {
        folder: {
          include: {
            user: { select: { username: true } },
            files: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                size: true,
                secureUrl: true,
                cloudinaryUrl: true,
                createdAt: true,
                updatedAt: true
              }
            },
            children: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        }
      }
    });

    if (!folderShare) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    // Check if share is still active and not expired
    if (!folderShare.isActive || folderShare.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Share link has expired or been deactivated' });
    }

    // Increment access count
    await prisma.folderShare.update({
      where: { id: folderShare.id },
      data: { accessCount: { increment: 1 } }
    });

    // Get all nested files recursively
    const getAllNestedFiles = async (folderId: string): Promise<any[]> => {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
        include: {
          files: {
            select: {
              id: true,
              originalName: true,
              mimeType: true,
              size: true,
              secureUrl: true,
              cloudinaryUrl: true,
              createdAt: true,
              updatedAt: true
            }
          },
          children: { select: { id: true, name: true } }
        }
      });

      if (!folder) return [];

      let allFiles = [...folder.files];

      // Recursively get files from child folders
      for (const child of folder.children) {
        const childFiles = await getAllNestedFiles(child.id);
        allFiles = allFiles.concat(childFiles);
      }

      return allFiles;
    };

    const allFiles = await getAllNestedFiles(folderShare.folder.id);

    // Check if request wants JSON response (API call)
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(200).json({
        folder: {
          id: folderShare.folder.id,
          name: folderShare.folder.name,
          owner: folderShare.folder.user.username,
          sharedAt: folderShare.createdAt,
          expiresAt: folderShare.expiresAt
        },
        files: folderShare.folder.files,
        subfolders: folderShare.folder.children,
        allFiles: allFiles, // All files including from subfolders
        totalFiles: allFiles.length
      });
    }

    // Render the shared folder view
    res.render('shared-folder', {
      folder: {
        id: folderShare.folder.id,
        name: folderShare.folder.name,
        owner: folderShare.folder.user.username,
        sharedAt: folderShare.createdAt,
        expiresAt: folderShare.expiresAt
      },
      files: folderShare.folder.files,
      subfolders: folderShare.folder.children,
      allFiles: allFiles,
      totalFiles: allFiles.length
    });
  } catch (error) {
    next(error);
  }
};

// Get user's folder shares (for management)
export const getUserShares: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const shares = await prisma.folderShare.findMany({
      where: { userId },
      include: {
        folder: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add share URLs to response
    const sharesWithUrls = shares.map(share => ({
      ...share,
      shareUrl: `${req.protocol}://${req.get('host')}/share/${share.shareToken}`,
      isExpired: share.expiresAt < new Date()
    }));

    res.status(200).json({ shares: sharesWithUrls });
  } catch (error) {
    next(error);
  }
};

// Deactivate a folder share
export const deactivateShare: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(error => error.msg)
      });
    }

    const { shareToken } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find and verify ownership
    const folderShare = await prisma.folderShare.findUnique({
      where: { shareToken }
    });

    if (!folderShare || folderShare.userId !== userId) {
      return res.status(404).json({ error: 'Share not found or access denied' });
    }

    // Deactivate the share
    await prisma.folderShare.update({
      where: { shareToken },
      data: { isActive: false }
    });

    res.status(200).json({ message: 'Share deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

// Extend share expiration
export const extendShare: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(error => error.msg)
      });
    }

    const { shareToken } = req.params;
    const { duration } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find and verify ownership
    const folderShare = await prisma.folderShare.findUnique({
      where: { shareToken }
    });

    if (!folderShare || folderShare.userId !== userId) {
      return res.status(404).json({ error: 'Share not found or access denied' });
    }

    // Parse new duration
    const newExpiresAt = parseDuration(duration);

    // Update the share
    const updatedShare = await prisma.folderShare.update({
      where: { shareToken },
      data: { 
        expiresAt: newExpiresAt,
        isActive: true // Reactivate if it was deactivated
      }
    });

    res.status(200).json({
      message: 'Share expiration extended successfully',
      share: {
        id: updatedShare.id,
        expiresAt: updatedShare.expiresAt
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid duration')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};
