import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { voiceAdmission } from "./routes/nyayaai/rateLimit";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// ONE platform proxy hop fronts the app on Replit: trust it so req.ip is
// the real client (last X-Forwarded-For entry), not the proxy peer — the
// voice admission limiter keys on req.ip. Never trust more hops than exist.
app.set("trust proxy", 1);
app.use(cors());
// Admission BEFORE body parsing: a shed voice post costs a 429, never a
// 5MB JSON parse (review-caught abuse path).
app.use("/api/nyaya-ai/sarvam-voice", voiceAdmission);
app.use(express.json({ limit: "5mb" }));   // sarvam-voice sends base64 audio
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use("/api", router);

export default app;
