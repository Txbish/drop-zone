import passport from 'passport'
import { Strategy as LocalStrategy } from "passport-local"
import prisma from "../database/prismaClient"
import bcrypt from "bcrypt"

export default new LocalStrategy(async (username: string, password: string, done) => {
    try {
        const user = await prisma.user.findFirst({ where: { username: username } });
        if (!user) {
            return done(null, false, { message: "User not found." });
        }
        const matched = await bcrypt.compare(password, user.password);
        if (!matched) {
            return done(null, false, { message: "Incorrect Password." });
        }
        return done(null, user);
    } catch (error) {
        return done(error);
    }
});
