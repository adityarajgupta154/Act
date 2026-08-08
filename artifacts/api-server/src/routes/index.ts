import { Router, type IRouter } from "express";
import healthRouter from "./health";
import avatarRouter from "./avatar";
import personaRouter from "./persona";

const router: IRouter = Router();

router.use(healthRouter);
router.use(avatarRouter);
router.use(personaRouter);

export default router;
