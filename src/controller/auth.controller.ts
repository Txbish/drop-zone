import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';
import prisma from '../database/prismaClient';

const handleLogin = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
});

const renderLogin = (req: Request, res: Response) => {
    res.render('login', { messages: req.flash() });
};

const handleSignup = async (req: Request, res: Response) => {
    try {
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
    res.render('signup');
};

export { handleLogin, renderLogin, handleSignup, renderSignup };