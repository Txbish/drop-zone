import express from "express"
import dotenv from "dotenv"
import sessionConfig from "./config/sessionConfig";
import passport from "passport"
import createError from 'http-errors'
import errorHandler from './middleware/errorHandler'

dotenv.config();
const app = express();

app.use(sessionConfig);
app.use(express.json());

app.use(passport.initialize())
app.use(passport.session())

app.use((req, res, next) => {
  res.locals.currentUser = req.user
  next()
})

// 404 handler - should come before error handler
app.use((req, res, next) => next(createError(404)))

// Error handler - should be last
app.use(errorHandler)

app.listen(process.env.PORT, () => {
  console.log(`Server started on ${process.env.PORT}.`);
});
