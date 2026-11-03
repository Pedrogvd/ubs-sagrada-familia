import { Router } from "express";
import { createPatient, listPatients, getPatient, updatePatient, deletePatient, VALID_CONDITIONS } from "../services/patientService";
import { deleteVisitsByPatient } from "../services/visitService";
import { deleteIvcfAssessmentsByPatient } from "../services/ivcfAssessmentService";

export const patientsRouter = Router();

patientsRouter.post("/", async (req, res) => {
    try {
        const { name, cpf, address, phoneNumber, dateOfBirth, priority, conditions, visitPeriodicityDays, cns, microarea, acsResponsavelId } = req.body;

        if (!name || !cpf || !priority || !visitPeriodicityDays) {
            return res.status(400).json({ error: "name, cpf, priority and visitPeriodicityDays are required" });
        }

        if (!/^\d{11}$/.test(cpf)) {
            return res.status(400).json({ error: "cpf must contain exactly 11 digits" });
        }

        if (phoneNumber && !/^\d{10,11}$/.test(phoneNumber)) {
            return res.status(400).json({ error: "phoneNumber must contain 10 or 11 digits" });
        }

        if (cns && !/^\d{15}$/.test(cns)) {
            return res.status(400).json({ error: "cns must contain exactly 15 digits" });
        }

        if (conditions && conditions.some((condition: string) => !(VALID_CONDITIONS as readonly string[]).includes(condition))) {
            return res.status(400).json({ error: `conditions must only contain values from: ${VALID_CONDITIONS.join(", ")}` });
        }

        // ACS comum sempre cadastra paciente pra si mesmo; só admin pode
        // escolher outro ACS responsável (ou deixar em branco)
        const isAdmin = req.user!.role === "admin";
        const resolvedAcsResponsavelId = isAdmin ? (acsResponsavelId || "") : req.user!.professionalId;

        const patient = await createPatient({
            name,
            cpf,
            address: address || "",
            phoneNumber: phoneNumber || "",
            dateOfBirth: dateOfBirth || "",
            priority,
            conditions: conditions || [],
            visitPeriodicityDays,
            cns: cns || "",
            microarea: microarea || "",
            acsResponsavelId: resolvedAcsResponsavelId,
        })

        res.status(201).json(patient);

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})

patientsRouter.get("/", async (req, res) => {
    try {
        const isAdmin = req.user!.role === "admin";
        const patients = await listPatients(isAdmin ? undefined : req.user!.professionalId);
        res.json(patients);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})

patientsRouter.get("/:id", async (req, res)=> {
    try {
        const patient = await getPatient(req.params.id);
        if (!patient) return res.status(404).json({ error: "Patient not found" });

        const isAdmin = req.user!.role === "admin";
        if (!isAdmin && patient.acsResponsavelId !== req.user!.professionalId) {
            return res.status(403).json({ error: "you don't have access to this patient" });
        }

        res.json(patient);

    } catch (error: any) {
         res.status(500).json({ error: error.message });
    }
})

// edição de paciente: admin edita qualquer um, ACS só edita os seus próprios
patientsRouter.patch("/:id", async (req, res) => {
    try {
        const existing = await getPatient(req.params.id);
        if (!existing) return res.status(404).json({ error: "Patient not found" });

        const isAdmin = req.user!.role === "admin";
        if (!isAdmin && existing.acsResponsavelId !== req.user!.professionalId) {
            return res.status(403).json({ error: "you don't have access to this patient" });
        }

        const { name, cpf, address, phoneNumber, dateOfBirth, priority, conditions, visitPeriodicityDays, cns, microarea, acsResponsavelId, active } = req.body;

        if (cpf !== undefined && !/^\d{11}$/.test(cpf)) {
            return res.status(400).json({ error: "cpf must contain exactly 11 digits" });
        }

        if (phoneNumber !== undefined && phoneNumber !== "" && !/^\d{10,11}$/.test(phoneNumber)) {
            return res.status(400).json({ error: "phoneNumber must contain 10 or 11 digits" });
        }

        if (cns !== undefined && cns !== "" && !/^\d{15}$/.test(cns)) {
            return res.status(400).json({ error: "cns must contain exactly 15 digits" });
        }

        if (conditions !== undefined && conditions.some((condition: string) => !(VALID_CONDITIONS as readonly string[]).includes(condition))) {
            return res.status(400).json({ error: `conditions must only contain values from: ${VALID_CONDITIONS.join(", ")}` });
        }

        if (active !== undefined && typeof active !== "boolean") {
            return res.status(400).json({ error: "active must be a boolean" });
        }

        const updates: Record<string, unknown> = {
            name, cpf, address, phoneNumber, dateOfBirth, priority, conditions, visitPeriodicityDays, cns, microarea, active,
        };

        // só admin pode reatribuir o ACS responsável por um paciente
        if (isAdmin && acsResponsavelId !== undefined) {
            updates.acsResponsavelId = acsResponsavelId;
        }

        // tira do objeto os campos que não foram enviados, pra só mesclar o que realmente mudou
        Object.keys(updates).forEach((key) => {
            if (updates[key] === undefined) delete updates[key];
        });

        const updated = await updatePatient(req.params.id, updates);
        if (!updated) return res.status(404).json({ error: "Patient not found" });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})

// exclusão de paciente: só admin pode excluir. Apaga também o histórico
// clínico ligado a ele (visitas e avaliações IVCF-20) pra não deixar
// registro órfão no índice — ação irreversível, usada principalmente pra
// remover cadastros de teste.
patientsRouter.delete("/:id", async (req, res) => {
    try {
        if (req.user!.role !== "admin") {
            return res.status(403).json({ error: "only admin can delete patients" });
        }

        const existing = await getPatient(req.params.id);
        if (!existing) return res.status(404).json({ error: "Patient not found" });

        await deleteVisitsByPatient(req.params.id);
        await deleteIvcfAssessmentsByPatient(req.params.id);
        await deletePatient(req.params.id);

        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})
