import { User as PrismaUser } from '../generated/prisma';

declare global {
  namespace Express {
    interface User extends Omit<PrismaUser, 'password'> {}
  }
}

export {};
