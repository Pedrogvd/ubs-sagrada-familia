import "dotenv/config";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { ensureIndices } from "./services/esClient"; // exporting only the function
import { patientsRouter } from "./routes/patients";
import { healthProfessionalRouter } from "./routes/healthProfessionals";
import { visitsRouter } from "./routes/visits";
import { dashboardRouter } from "./routes/dashboard";
import { reportsRouter } from "./routes/reports";
import { authRouter } from "./routes/auth";
import { ivcfAssessmentsRouter } from "./routes/ivcfAssessments";
import { requireAuth } from "./middleware/requireAuth";

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "https://ubs-riacho-estado.pages.dev",
];

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

// Request logging (access.log), used for log pipeline experiments
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
const accessLogStream = fs.createWriteStream(path.join(logsDir, "access.log"), { flags: "a" });
app.use(morgan("common", { stream: accessLogStream }));

// Health check route, used by UptimeRobot to keep the free Render instance awake
app.get("/", (req, res) => {
    res.status(200).json({ status: "ok" });
});

/* 
Notice: /auth (login) and /health-professionals (registration) are left
without requireAuth — that makes sense, because to log in or register 
you don't have a token yet. /patients, /visits, and /dashboard,
on the other hand, now require a valid token before reaching the
actual routes.
*/
app.use("/auth", authRouter)
app.use("/health-professionals", healthProfessionalRouter)

app.use("/patients", requireAuth, patientsRouter);
app.use("/visits", requireAuth, visitsRouter);
app.use("/dashboard", requireAuth, dashboardRouter)
app.use("/reports", requireAuth, reportsRouter)
app.use("/ivcf-assessments", requireAuth, ivcfAssessmentsRouter)
app.use("/auth", requireAuth, authRouter)

async function start() {
    await ensureIndices();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    })
}

start();