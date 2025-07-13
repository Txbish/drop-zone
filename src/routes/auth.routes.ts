import { Router } from "express";
import { handleLogin, handleSignup, renderLogin, renderSignup } from "../controller/auth.controller";

const router = Router();
router.route("/login").get(renderLogin).post(handleLogin);

router.route("/signup").get(renderSignup).post(handleSignup);

export default router;
