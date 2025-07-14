import { User as PrismaUser } from '../generated/prisma';

declare global {
  namespace Express {
    export interface User extends Omit<PrismaUser, 'password'> {}
  }
}
