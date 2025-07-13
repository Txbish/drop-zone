import express, { Express, Request, Response, NextFunction, RequestHandler } from "express";
import dotenv from "dotenv";
import sessionConfig from "./config/sessionConfig";
import passport from "passport";
import createError from 'http-errors';
import errorHandler from './middleware/errorHandler';

dotenv.config();

const PORT: string | number = process.env.PORT || 3000;
const app: Express = express();

app.use(sessionConfig);
app.use(express.json());

app.use(passport.initialize())
app.use(passport.session())
const injectUser: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.locals.currentUser = req.user;
  next();
};
app.use(injectUser);

app.use((req: Request, res: Response, next: NextFunction): void => {
  next(createError(404));
});

app.use(errorHandler);

app.listen(PORT, (): void => {
  console.log(`Server started on ${PORT}.`);
});
