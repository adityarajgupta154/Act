import { Router, type IRouter } from "express";
import healthRouter from "./health";
import personaRouter from "./persona";
import nyayaAiRouter from "./nyayaai";
import insightsRouter from "./insights";
import storyVoiceRouter from "./storyvoice";

const router: IRouter = Router();

router.use(healthRouter);
router.use(personaRouter);
router.use(nyayaAiRouter);
router.use(insightsRouter);
router.use(storyVoiceRouter);

export default router;
