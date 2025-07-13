import { Router } from "express";
import { handleLogin, renderLogin, handleSignup, renderSignup } from "../controller/auth.controller";

const router = Router();

router.get("/login", renderLogin);
router.post("/login", handleLogin);
router.get("/signup", renderSignup);
router.post("/signup", handleSignup);

export default router;
