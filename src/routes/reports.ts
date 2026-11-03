import { Router } from "express";
import { getMonthlyReport } from "../services/reportService";

export const reportsRouter = Router();

reportsRouter.get("/monthly", async (req, res) => {
    try {
        const month = typeof req.query.month === "string" ? req.query.month : currentMonth();

        if (!/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ error: "month deve estar no formato YYYY-MM" });
        }

        const isAdmin = req.user!.role === "admin";
        const report = await getMonthlyReport(month, isAdmin ? undefined : req.user!.professionalId);
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

function currentMonth(): string {
    const now = new Date();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    return `${now.getUTCFullYear()}-${month}`;
}