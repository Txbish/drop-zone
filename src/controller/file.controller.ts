import { Request,RequestHandler, Response, NextFunction } from 'express';
import prisma from '../database/prismaClient';
import {body,Result,ValidationError,validationResult} from "express-validator";

export const uploadFile = async (req:Request, res:Response,next:NextFunction) => { };
export const getFile = async (req:Request, res:Response,next:NextFunction) => { };
export const updateFile= async (req:Request, res:Response,next:NextFunction) => { };
export const deleteFile= async (req:Request, res:Response,next:NextFunction) => { };

