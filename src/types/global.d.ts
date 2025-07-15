import { User as PrismaUser } from '@prisma/client';

declare global {
  namespace Express {
    interface User extends Omit<PrismaUser, 'password'> {}
    
    interface Request {
      user?: User;
      flash(type?: string, message?: string): string[];
      isAuthenticated(): boolean;
      logout(callback?: (err?: any) => void): void;
    }
  }
}

export {};
