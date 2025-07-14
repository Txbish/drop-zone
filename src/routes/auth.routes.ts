import { Router } from "express";
import {
  handleLogin,
  renderLogin,
  handleSignup,
  renderSignup,
  handleLogout,
} from "../controller/auth.controller";
import { body } from "express-validator";

const router = Router();

router.get("/login", renderLogin);

router.post(
  "/login",
  [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  handleLogin 
);

router.get("/signup", renderSignup);

router.post(
  "/signup",
  [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password")
      .trim()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  handleSignup
);

router.get("/logout", handleLogout);

export default router;
