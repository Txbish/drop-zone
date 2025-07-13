import passport from 'passport'
import prisma from "../database/prismaClient"
import LocalStrategy from "../strategy/local"
const configurePassport=()=>{
    passport.use(LocalStrategy)
    passport.serializeUser((user,done)=>done(null,user.id));
    passport.deserializeUser(async(id:number,done)=>{
        try {
            const user =await prisma.user.findUnique({where:{id:id}});
            done(null,user);

        } catch (error) {
            done(error);
        }
    }
)
}

configurePassport();

export default passport;