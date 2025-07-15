import { Request, RequestHandler, Response, NextFunction } from 'express';
import prisma from '../database/prismaClient';
import { body, Result, ValidationError, validationResult } from "express-validator";
import { cloudinary } from '../config/cloudinaryConfig';
import { Prisma } from '../generated/prisma';

export const uploadFile: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(error => error.msg)
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { folderId, isPublic } = req.body;

    // If folderId is provided, verify it exists and belongs to the user
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId }
      });

      if (!folder || folder.userId !== userId) {
        // Delete from Cloudinary if folder validation fails
        if (req.file && (req.file as any).public_id) {
          try {
            await cloudinary.uploader.destroy((req.file as any).public_id);
          } catch (cleanupError) {
            console.error('Error cleaning up Cloudinary file:', cleanupError);
          }
        }
        return res.status(404).json({ error: 'Folder not found or access denied' });
      }
    }

    // Extract Cloudinary file information
    const cloudinaryFile = req.file as any;
    
    const file = await prisma.file.create({
      data: {
        originalName: req.file.originalname,
        storedName: cloudinaryFile.public_id, // Cloudinary public_id
        cloudinaryUrl: cloudinaryFile.url,
        secureUrl: cloudinaryFile.secure_url,
        mimeType: req.file.mimetype,
        size: req.file.size,
        userId: userId,
        folderId: folderId || null,
        isPublic: isPublic === 'true' || isPublic === true || false
      }
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: file.id,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        isPublic: file.isPublic,
        url: file.secureUrl,
        createdAt: file.createdAt
      }
    });
  } catch (error) {
    // Clean up Cloudinary file if database operation fails
    if (req.file && (req.file as any).public_id) {
      try {
        await cloudinary.uploader.destroy((req.file as any).public_id);
      } catch (cleanupError) {
        console.error('Error cleaning up Cloudinary file:', cleanupError);
      }
    }
    next(error);
  }
};

export const getFile: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(error => error.msg)
      });
    }

    const fileId = req.params.id;
    const userId = req.user?.id;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user has access to the file
    if (!file.isPublic && file.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For Cloudinary files, redirect to the secure URL
    if (file.secureUrl) {
      return res.redirect(file.secureUrl);
    }
    
    // Fallback: if no Cloudinary URL, try to generate one from public_id
    if (file.storedName) {
      const cloudinaryUrl = cloudinary.url(file.storedName, {
        secure: true,
        resource_type: 'auto'
      });
      return res.redirect(cloudinaryUrl);
    }

    return res.status(404).json({ error: 'File URL not available' });
  } catch (error) {
    next(error);
  }
};

export const updateFile: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(error => error.msg)
      });
    }

    const fileId = req.params.id;
    const userId = req.user?.id;
    const { originalName, folderId, isPublic } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if file exists and belongs to user
    const existingFile = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!existingFile || existingFile.userId !== userId) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // If folderId is provided, verify it exists and belongs to the user
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId }
      });

      if (!folder || folder.userId !== userId) {
        return res.status(404).json({ error: 'Folder not found or access denied' });
      }
    }

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        originalName: originalName || existingFile.originalName,
        folderId: folderId !== undefined ? folderId : existingFile.folderId,
        isPublic: isPublic !== undefined ? (isPublic === 'true' || isPublic === true) : existingFile.isPublic
      }
    });

    res.status(200).json({
      message: 'File updated successfully',
      file: {
        id: updatedFile.id,
        originalName: updatedFile.originalName,
        size: updatedFile.size,
        mimeType: updatedFile.mimeType,
        isPublic: updatedFile.isPublic,
        folderId: updatedFile.folderId,
        updatedAt: updatedFile.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(error => error.msg)
      });
    }

    const fileId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get file details before deletion
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // Delete file from database
    await prisma.file.delete({
      where: { id: fileId }
    });

    // Delete file from Cloudinary
    if (file.storedName) {
      try {
        await cloudinary.uploader.destroy(file.storedName);
      } catch (cloudinaryError) {
        console.error('Error deleting file from Cloudinary:', cloudinaryError);
        // Continue anyway - database record is deleted
      }
    }

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Additional helper function to get file info without downloading
export const getFileInfo: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(error => error.msg)
      });
    }

    const fileId = req.params.id;
    const userId = req.user?.id;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user has access to the file
    if (!file.isPublic && file.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.status(200).json({
      id: file.id,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      isPublic: file.isPublic,
      folder: file.folder,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    });
  } catch (error) {
    next(error);
  }
};

