import { Router } from "express";
import { createVisit, listVisits, VALID_VISIT_OUTCOMES } from "../services/visitService";
import { getPatient } from "../services/patientService";

export const visitsRouter = Router();

visitsRouter.post("/", async (req, res) => {
    try {
        const { patientId, visitDate, outcome, bloodPressure, weightKg, bloodGlucoseMgDl, needsReferral, referredTo, notes } = req.body;

        if (!patientId || !visitDate) {
            return res.status(400).json({ error: "patientId and visitDate are required" });
        }

        const resolvedOutcome = outcome || "completed";

        if (!(VALID_VISIT_OUTCOMES as readonly string[]).includes(resolvedOutcome)) {
            return res.status(400).json({ error: `outcome must be one of: ${VALID_VISIT_OUTCOMES.join(", ")}` });
        }

        const professionalId = req.user!.professionalId;
        const isAdmin = req.user!.role === "admin";

        // ACS comum só pode registrar visita em paciente que é dele
        if (!isAdmin) {
            const patient = await getPatient(patientId);
            if (!patient) return res.status(404).json({ error: "patient not found" });
            if (patient.acsResponsavelId !== professionalId) {
                return res.status(403).json({ error: "you don't have access to this patient" });
            }
        }

        const visit = await createVisit({
            patientId,
            visitDate,
            outcome: resolvedOutcome,
            bloodPressure: bloodPressure || "",
            weightKg: weightKg ?? null,
            bloodGlucoseMgDl: bloodGlucoseMgDl ?? null,
            needsReferral: !!needsReferral,
            referredTo: referredTo || "",
            notes: notes || "",
        }, professionalId);

        res.status(201).json(visit);

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})

visitsRouter.get("/", async (req, res) => {
    try {
        const isAdmin = req.user!.role === "admin";
        const patientId = req.query.patientId;

        // GET /visits?patientId=... filtra o histórico de um paciente específico
        if (typeof patientId === "string") {
            const patient = await getPatient(patientId);
            if (!patient) return res.status(404).json({ error: "patient not found" });
            if (!isAdmin && patient.acsResponsavelId !== req.user!.professionalId) {
                return res.status(403).json({ error: "you don't have access to this patient" });
            }
        }

        const visits = await listVisits(isAdmin ? undefined : req.user!.professionalId);
        const filtered = typeof patientId === "string" ? visits.filter((visit) => visit.patientId === patientId) : visits;

        res.json(filtered);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
})