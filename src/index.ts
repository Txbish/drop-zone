import express from "express"
import dotenv from "dotenv"
import sessionConfig from "./config/sessionConfig";
import passport from "passport"
import createError from 'http-errors'

dotenv.config();
const app = express();

app.use(sessionConfig);
app.use(express.json());

app.use(passport.session())
app.use(passport.initialize())

app.use((req, res, next) => next(createError(404)))
app.use(errorHandler)

app.use((req, res, next) => {
  res.locals.currentUser = req.user
  next()
})

app.listen(process.env.PORT, () => {
  console.log(`Server started on ${process.env.PORT}.`);
});
