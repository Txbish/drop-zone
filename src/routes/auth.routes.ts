import { Router } from "express";
import { handleLogin, renderLogin, handleSignup, renderSignup, handleLogout } from "../controller/auth.controller";

const router = Router();

router.get("/login", renderLogin);
router.post("/login", handleLogin);
router.get("/signup", renderSignup);
router.post("/signup", handleSignup);
router.get("/logout", handleLogout);

export default router;
