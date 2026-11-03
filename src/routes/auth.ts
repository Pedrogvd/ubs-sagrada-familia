import { Router } from "express";
import { loginHealthProfessional } from "../services/healthProfessionalService";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "email and password are required" });
        }

        const result = await loginHealthProfessional(email, password);

        if (!result) {
            return res.status(401).json({ error: "invalid credentials" });
        }

        res.status(200).json(result);

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})