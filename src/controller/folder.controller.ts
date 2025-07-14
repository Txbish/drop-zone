import { Request,RequestHandler, Response, NextFunction } from 'express';
import prisma from '../database/prismaClient';
import {body,Result,ValidationError,validationResult} from "express-validator"

export const getRootFolders :RequestHandler= async (req:Request, res:Response) => {
    try {
        const folders = await prisma.folder.findMany({where:{parentId:null}});
        res.json(folders);
    } catch (error) {
        
    }
 };
export const getFolderById:RequestHandler = async (req:Request, res:Response) => { };
export const createFolder :RequestHandler= async (req:Request, res:Response) => { };
export const updateFolder :RequestHandler= async (req:Request, res:Response) => { };
export const deleteFolder :RequestHandler= async (req:Request, res:Response) => { };
