import { Request, RequestHandler, Response, NextFunction } from 'express';
import prisma from '../database/prismaClient';
import { body, Result, ValidationError, validationResult } from "express-validator";
import fs from 'fs';
import path from 'path';
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
        // Clean up uploaded file if folder validation fails
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (cleanupError) {
            console.error('Error cleaning up file:', cleanupError);
          }
        }
        return res.status(404).json({ error: 'Folder not found or access denied' });
      }
    }

    const file = await prisma.file.create({
      data: {
        originalName: req.file.originalname,
        storedName: req.file.filename,
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
        createdAt: file.createdAt
      }
    });
  } catch (error) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
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

    const filePath = path.join(process.cwd(), 'uploads', file.storedName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Length', file.size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
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

    // Delete physical file
    const filePath = path.join(process.cwd(), 'uploads', file.storedName);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileDeleteError) {
      console.error('Error deleting physical file:', fileDeleteError);
      // Continue anyway - database record is deleted
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

