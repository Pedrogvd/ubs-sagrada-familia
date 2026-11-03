import { Router } from "express";
import { getDashboardSummary } from "../services/dashboardService";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (req, res) => {
    try {
        const isAdmin = req.user!.role === "admin";
        const summary = await getDashboardSummary(isAdmin ? undefined : req.user!.professionalId);
        res.json(summary);

    } catch (error: any) {
        console.error("Erro no /dashboard:", error?.meta?.body ?? error);
        res.status(500).json({ error: error.message });
    }
})