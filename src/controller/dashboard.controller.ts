import { Request, RequestHandler, Response, NextFunction } from 'express';
import prisma from '../database/prismaClient';
import { validationResult } from "express-validator";

export const renderDashboard: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      req.flash('error', 'Please log in to access the dashboard');
      return res.redirect('/login');
    }

    res.render('dashboard', {
      currentUser: req.user,
      messages: req.flash()
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardData: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { folderId, type } = req.query;

    let folders: any[] = [];
    let files: any[] = [];

    switch (type) {
      case 'public':
        // Get user's public files
        files = await prisma.file.findMany({
          where: {
            userId: userId,
            isPublic: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        folders = [];
        break;

      case 'recent':
        // Get recently accessed files (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        files = await prisma.file.findMany({
          where: {
            userId: userId,
            updatedAt: {
              gte: thirtyDaysAgo
            }
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 50
        });
        folders = [];
        break;

      default:
        // Get folders and files for a specific folder or root
        const currentFolderId = folderId as string || null;

        folders = await prisma.folder.findMany({
          where: {
            parentId: currentFolderId,
            userId: userId,
          },
          orderBy: {
            name: 'asc',
          },
        });

        files = await prisma.file.findMany({
          where: {
            folderId: currentFolderId,
            userId: userId,
          },
          orderBy: {
            originalName: 'asc',
          },
        });
        break;
    }

    // Get folder path for breadcrumb
    const breadcrumb = [];
    if (folderId && typeof folderId === 'string') {
      let currentFolder = await prisma.folder.findUnique({
        where: { id: folderId }
      });

      while (currentFolder) {
        breadcrumb.unshift({
          id: currentFolder.id,
          name: currentFolder.name
        });

        if (currentFolder.parentId) {
          currentFolder = await prisma.folder.findUnique({
            where: { id: currentFolder.parentId }
          });
        } else {
          break;
        }
      }
    }

    res.json({
      folders: folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        type: 'folder',
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      })),
      files: files.map(file => ({
        id: file.id,
        name: file.originalName,
        type: 'file',
        size: file.size,
        mimeType: file.mimeType,
        isPublic: file.isPublic,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      })),
      breadcrumb,
      currentFolderId: folderId || null
    });
  } catch (error) {
    next(error);
  }
};

export const getFolderTree: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get all folders for the user to build tree structure
    const allFolders = await prisma.folder.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Build tree structure
    const buildTree = (parentId: string | null): any[] => {
      return allFolders
        .filter(folder => folder.parentId === parentId)
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          children: buildTree(folder.id)
        }));
    };

    const tree = buildTree(null);
    res.json(tree);
  } catch (error) {
    next(error);
  }
};

export const searchFiles: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = q.toLowerCase();

    // Search folders
    const folders = await prisma.folder.findMany({
      where: {
        userId: userId,
        name: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Search files
    const files = await prisma.file.findMany({
      where: {
        userId: userId,
        originalName: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      orderBy: {
        originalName: 'asc'
      }
    });

    res.json({
      folders: folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        type: 'folder',
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      })),
      files: files.map(file => ({
        id: file.id,
        name: file.originalName,
        type: 'file',
        size: file.size,
        mimeType: file.mimeType,
        isPublic: file.isPublic,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getItemDetails: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id, type } = req.params;

    if (type === 'folder') {
      const folder = await prisma.folder.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              children: true,
              files: true
            }
          }
        }
      });

      if (!folder || folder.userId !== userId) {
        return res.status(404).json({ error: 'Folder not found' });
      }

      res.json({
        id: folder.id,
        name: folder.name,
        type: 'folder',
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        itemCount: folder._count.children + folder._count.files
      });
    } else {
      const file = await prisma.file.findUnique({
        where: { id },
        include: {
          folder: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!file || file.userId !== userId) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.json({
        id: file.id,
        name: file.originalName,
        type: 'file',
        size: file.size,
        mimeType: file.mimeType,
        isPublic: file.isPublic,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        folder: file.folder
      });
    }
  } catch (error) {
    next(error);
  }
};
