import { Request,RequestHandler, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';
import prisma from '../database/prismaClient';
import {body,Result,ValidationError,validationResult} from "express-validator"




const handleLogin: RequestHandler = (req:Request, res:Response, next:NextFunction) => {
    try {
        const errors: Result<ValidationError> = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    req.flash("error", errorMessages.join(", "));
    return res.redirect("/login");
  }

  if (req.isAuthenticated()) {
    req.flash("warning", "Already Authenticated");
    return res.redirect("/dashboard");
  }

  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })(req, res, next);
    } catch (error) {
        res.redirect("/login");
    }
  
};



const renderLogin = (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
        console.log("Already Authenticated");
        req.flash("warning", "Already Authenticated");
        return res.redirect("/dashboard");
      }
    res.render('login', { messages: req.flash(), title: 'Login' });
};

const handleSignup = async (req: Request, res: Response) => {
    try {
        const errors: Result<ValidationError> = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    req.flash("error", errorMessages.join(", "));
    return res.redirect("/signup");
  }
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            },
        });
        res.redirect('/login');
    } catch (error) {
        res.redirect('/signup');
    }
};

const renderSignup = (req: Request, res: Response) => {
    res.render('signup', { title: 'Sign Up' });
};

const handleLogout = (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
};

export { handleLogin, renderLogin, handleSignup, renderSignup, handleLogout };