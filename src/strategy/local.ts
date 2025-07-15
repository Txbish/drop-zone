import passport from 'passport';
import { Strategy as LocalStrategy, VerifyFunction } from "passport-local";
import prisma from "../database/prismaClient";
import bcrypt from "bcrypt";

const verifyFunction: VerifyFunction = async (username: string, password: string, done): Promise<void> => {
    try {
        const user = await prisma.user.findFirst({ where: { username: username } });
        if (!user) {
            return done(null, false, { message: "User not found." });
        }
        const matched: boolean = await bcrypt.compare(password, user.password);
        if (!matched) {
            return done(null, false, { message: "Incorrect Password." });
        }
        return done(null, user);
    } catch (error) {
        return done(error);
    }
};
export default new LocalStrategy(verifyFunction);
