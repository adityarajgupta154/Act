import { Router, type IRouter } from "express";
import healthRouter from "./health";
import personaRouter from "./persona";
import nyayaAiRouter from "./nyayaai";
import insightsRouter from "./insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(personaRouter);
router.use(nyayaAiRouter);
router.use(insightsRouter);

export default router;
