import { Request,RequestHandler, Response, NextFunction } from 'express';
import prisma from '../database/prismaClient';
import {body,Result,ValidationError,validationResult} from "express-validator";


export const getRootFolders: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    const folders = await prisma.folder.findMany({
      where: {
        parentId: null,
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(folders);
  } catch (error) {
    console.error('Error fetching root folders:', error);
    next(error);
  }
};
export const getFolderById: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(error => error.msg)
      });
    }

    const folderId = req.params.id;
    const userId = req.user?.id;


    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        children: true, 
        files: true,    
      },
    });

    if (!folder || folder.userId !== userId) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.status(200).json(folder);
  } catch (error) {
    next(error);
  }
};
export const createFolder: RequestHandler = async (req, res, next) => { 
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(error => error.msg)
      });
    }

    const { name, parentId } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // If parentId is provided, verify it exists and belongs to the user
    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { id: parentId }
      });

      if (!parentFolder || parentFolder.userId !== userId) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
    }
    
    const folder = await prisma.folder.create({
      data: {
        name: name,
        userId: userId,
        parentId: parentId || null
      }
    });

    res.status(201).json(folder);
  } catch (error) {
    next(error);
  }
};
export const updateFolder: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(error => error.msg)
      });
    }

    const userId = req.user?.id;
    const { name } = req.body;
    const folderId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const updatedFolder = await prisma.folder.updateMany({
      where: {
        id: folderId,
        userId: userId,
      },
      data: {
        name: name,
      },
    });

    if (updatedFolder.count === 0) {
      return res.status(404).json({ error: 'Folder not found or access denied' });
    }

    return res.status(200).json({ message: 'Folder updated successfully' });
  } catch (error) {
    next(error);
  }
};


export const deleteFolder: RequestHandler = async (req: Request, res: Response, next: NextFunction) => { 
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(error => error.msg)
      });
    }

    const userId = req.user?.id;
    const folderId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const deleteResult = await prisma.folder.deleteMany({
      where: {
        id: folderId,
        userId: userId
      }
    });
    
    if (deleteResult.count === 0) {
      return res.status(404).json({ error: "Folder not found or access denied." });
    }
    
    return res.status(200).json({ message: 'Folder deleted successfully' });
  } catch (error) {
    next(error);
  }
};
