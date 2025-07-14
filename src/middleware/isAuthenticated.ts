import { Request, RequestHandler, Response, NextFunction } from 'express';

export default function isAuthenticated(req:Request,res:Response,next:NextFunction):void{
    if(req.isAuthenticated())
    {
        return next();
    }
    res.redirect("/login");
}