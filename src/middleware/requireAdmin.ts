import { Request, Response, NextFunction } from "express";

// usar sempre DEPOIS do requireAuth (precisa de req.user já preenchido)
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "admin access required" });
    }
    next();
}