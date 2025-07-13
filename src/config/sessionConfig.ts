import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import session, { SessionOptions } from 'express-session';
import prisma from '../database/prismaClient';

const SESSION_SECRET: string = process.env.SESSION_SECRET || 'pickle rick';
const MAX_AGE: number = 7 * 24 * 60 * 60 * 1000; 
const CHECK_PERIOD: number = 2 * 60 * 1000; 

const sessionConfig: SessionOptions = {
  cookie: {
    maxAge: MAX_AGE,
  },
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: new PrismaSessionStore(prisma, {
    checkPeriod: CHECK_PERIOD,
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
  }),
};

export default session(sessionConfig);