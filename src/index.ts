/// <reference types="./types" />
import express, { Express, Request, Response, NextFunction, RequestHandler } from "express";
import dotenv from "dotenv";
import sessionConfig from "./config/sessionConfig";
import passport from "./config/passportConfig";
import createError from 'http-errors';
import errorHandler from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import folderRoutes from "./routes/folder.routes";
import fileRoutes from "./routes/file.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import shareRoutes from "./routes/share.routes";
import flash from 'express-flash';
import morgan from "morgan";
import fetch from 'node-fetch';
dotenv.config();

const PORT: string | number = process.env.PORT || 3000;
const app: Express = express();

app.set('view engine', 'ejs');
app.set('views', 'views');
 
app.use(express.static('public'));
app.use(sessionConfig);
app.use(flash());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"))
app.use(passport.initialize())
app.use(passport.session())
const injectUser: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.locals.currentUser = req.user;
  res.locals.messages = req.flash();
  next();
};
app.use(injectUser);

app.use(authRoutes);
app.use("/folders", folderRoutes);
app.use("/files", fileRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/share", shareRoutes);

// Health check and self-ping route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/', (req: Request, res: Response) => {
  res.render('index');
});

// Self-pinging functionality to keep Render service awake
let pingInterval: NodeJS.Timeout;

function startSelfPing() {
  const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    console.log('🚀 Starting self-ping service to keep app awake...');
    
    pingInterval = setInterval(async () => {
      try {
        const response = await fetch(`${url}/health`);
        const data = await response.json();
        console.log(`✅ Self-ping successful at ${new Date().toISOString()}`, data.status);
      } catch (error) {
        console.error('❌ Self-ping failed:', error);
      }
    }, 13 * 60 * 1000); // 13 minutes
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (pingInterval) {
    clearInterval(pingInterval);
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  if (pingInterval) {
    clearInterval(pingInterval);
  }
  process.exit(0);
});

app.use((req: Request, res: Response, next: NextFunction): void => {
  next(createError(404));
});

app.use(errorHandler);

app.listen(PORT, (): void => {
  console.log(`Server started on ${PORT}.`);
  startSelfPing(); // Start the self-ping service
});
