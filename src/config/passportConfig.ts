import passport from 'passport';
import prisma from "../database/prismaClient";
import LocalStrategy from "../strategy/local";



const configurePassport = (): void => {
    passport.use(LocalStrategy);
    
    passport.serializeUser((user: any, done): void => {
        done(null, user.id);
    });
    
    passport.deserializeUser(async (id: number, done): Promise<void> => {
        try {
            const user = await prisma.user.findUnique({ where: { id: id } });
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
};

configurePassport();

export default passport;