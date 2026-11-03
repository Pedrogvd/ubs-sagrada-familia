import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt";

export interface AuthenticatedUser {
    professionalId: string;
    email: string;
    role: "admin" | "professional";
}

// creating the field "user" on Request
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "missing or invalid authorization header" });
    }

    const token = authHeader.substring("Bearer ".length);
    try {
        const payload = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
        req.user = payload;
        next();

    } catch (error) {
        return res.status(401).json({ error: "invalid or expired token" });
    }
}