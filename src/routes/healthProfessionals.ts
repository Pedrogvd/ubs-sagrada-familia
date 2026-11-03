import { Router } from "express"
import { createHealthProfessional, listHealthProfessionals, getHealthProfessionalById, updateHealthProfessional, changeOwnPassword, resetPasswordByAdmin } from "../services/healthProfessionalService"
import { generateTempPassword } from "../utils/generatePassword"
import { requireAuth } from "../middleware/requireAuth"
import { requireAdmin } from "../middleware/requireAdmin"

export const healthProfessionalRouter = Router();

healthProfessionalRouter.post("/", async (req, res) => {
    try {
        const { name, cpf, address, phoneNumber, email, password } = req.body;

        if (!name || !cpf || !email || !password) {
            return res.status(400).json({ error: "name, cpf, email and password are required" });
        }

        const healthProfessional = await createHealthProfessional({
            name,
            cpf,
            address: address || "",
            phoneNumber: phoneNumber || "",
            email,
            password,
        });

        const safeHealthProfessional = {
            id: healthProfessional.id,
            name: healthProfessional.name,
            cpf: healthProfessional.cpf,
            address: healthProfessional.address,
            phoneNumber: healthProfessional.phoneNumber,
            email: healthProfessional.email,
            role: healthProfessional.role,
            active: healthProfessional.active,
            createdAt: healthProfessional.createdAt,
        }; // we won't show the password on response

        res.status(201).json(safeHealthProfessional);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})

healthProfessionalRouter.get("/", requireAuth, async (req, res) => {
    try {
        const healthProfessionals = await listHealthProfessionals();
        res.json(healthProfessionals);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})

// só admin vê o perfil completo de outro profissional (usado na tela de editar)
healthProfessionalRouter.get("/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
        const targetId = req.params.id;
        if (typeof targetId !== "string") {
            return res.status(400).json({ error: "invalid id" });
        }

        const professional = await getHealthProfessionalById(targetId);
        if (!professional) return res.status(404).json({ error: "health professional not found" });

        res.json(professional);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})

// só admin promove/despromove, ativa/desativa ou edita os dados de outro profissional
healthProfessionalRouter.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
        // como a rota passa por requireAuth/requireAdmin antes do handler, o TS não
        // consegue mais inferir "id" como string a partir do path "/:id" (ele cai
        // de volta no tipo genérico de params, que permite string | string[] | undefined
        // por causa do noUncheckedIndexedAccess do tsconfig). Então garantimos aqui.
        const targetId = req.params.id;
        if (typeof targetId !== "string") {
            return res.status(400).json({ error: "invalid id" });
        }

        const { role, active, name, cpf, address, phoneNumber, email } = req.body;

        if (role !== undefined && role !== "admin" && role !== "professional") {
            return res.status(400).json({ error: "role must be 'admin' or 'professional'" });
        }

        if (active !== undefined && typeof active !== "boolean") {
            return res.status(400).json({ error: "active must be a boolean" });
        }

        if (
            role === undefined &&
            active === undefined &&
            name === undefined &&
            cpf === undefined &&
            address === undefined &&
            phoneNumber === undefined &&
            email === undefined
        ) {
            return res.status(400).json({ error: "no fields to update were provided" });
        }

        // ninguém muda o próprio perfil/status — evita se trancar pra fora sem querer.
        // editar nome/cpf/endereço/telefone/email do próprio perfil continua liberado.
        if (targetId === req.user!.professionalId && (role !== undefined || active !== undefined)) {
            return res.status(400).json({ error: "you can't change your own role or active status" });
        }

        const updated = await updateHealthProfessional(targetId, { role, active, name, cpf, address, phoneNumber, email });
        if (!updated) return res.status(404).json({ error: "health professional not found" });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})

// qualquer profissional logado troca a própria senha, desde que informe a senha atual
healthProfessionalRouter.patch("/me/password", requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "currentPassword and newPassword are required" });
        }

        if (typeof newPassword !== "string" || newPassword.length < 6) {
            return res.status(400).json({ error: "newPassword must be at least 6 characters" });
        }

        const result = await changeOwnPassword(req.user!.professionalId, currentPassword, newPassword);

        if (result === "not_found") {
            return res.status(404).json({ error: "health professional not found" });
        }

        if (result === "wrong_password") {
            return res.status(400).json({ error: "current password is incorrect" });
        }

        res.json({ message: "password updated successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})

// só admin reseta a senha de outro profissional; se não mandar newPassword, gera uma temporária
// (não existe fluxo de "esqueci minha senha" por email, porque o projeto não tem envio de email)
healthProfessionalRouter.patch("/:id/password", requireAuth, requireAdmin, async (req, res) => {
    try {
        const targetId = req.params.id;
        if (typeof targetId !== "string") {
            return res.status(400).json({ error: "invalid id" });
        }

        let { newPassword } = req.body;
        let generated = false;

        if (!newPassword) {
            newPassword = generateTempPassword();
            generated = true;
        }

        const updated = await resetPasswordByAdmin(targetId, newPassword);
        if (!updated) return res.status(404).json({ error: "health professional not found" });

        res.json({
            message: "password reset successfully",
            ...(generated ? { temporaryPassword: newPassword } : {}),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})
