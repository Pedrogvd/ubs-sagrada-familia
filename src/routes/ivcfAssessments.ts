import { Router, Request } from "express";
import { createIvcfAssessment, listIvcfAssessmentsByPatient, getIvcfAssessmentById } from "../services/ivcfAssessmentService";
import { getPatient } from "../services/patientService";

export const ivcfAssessmentsRouter = Router();

// mesma regra de acesso usada em /visits: ACS comum só mexe em paciente que
// é dele, admin acessa qualquer um
async function checkPatientAccess(
    req: Request,
    patientId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
    const patient = await getPatient(patientId);
    if (!patient) return { ok: false, status: 404, error: "patient not found" };

    const isAdmin = req.user!.role === "admin";
    if (!isAdmin && patient.acsResponsavelId !== req.user!.professionalId) {
        return { ok: false, status: 403, error: "you don't have access to this patient" };
    }

    return { ok: true };
}

ivcfAssessmentsRouter.post("/", async (req, res) => {
    try {
        const { patientId, assessedAt, answers } = req.body;

        if (!patientId || !assessedAt || !answers) {
            return res.status(400).json({ error: "patientId, assessedAt and answers are required" });
        }

        const access = await checkPatientAccess(req, patientId);
        if (!access.ok) return res.status(access.status).json({ error: access.error });

        const assessment = await createIvcfAssessment({ patientId, assessedAt, answers }, req.user!.professionalId);
        res.status(201).json(assessment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// histórico de avaliações IVCF-20 de um paciente: GET /ivcf-assessments?patientId=...
ivcfAssessmentsRouter.get("/", async (req, res) => {
    try {
        const patientId = req.query.patientId;
        if (typeof patientId !== "string") {
            return res.status(400).json({ error: "patientId query param is required" });
        }

        const access = await checkPatientAccess(req, patientId);
        if (!access.ok) return res.status(access.status).json({ error: access.error });

        const assessments = await listIvcfAssessmentsByPatient(patientId);
        res.json(assessments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

ivcfAssessmentsRouter.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        if (typeof id !== "string") {
            return res.status(400).json({ error: "invalid id" });
        }

        const assessment = await getIvcfAssessmentById(id);
        if (!assessment) return res.status(404).json({ error: "assessment not found" });

        const access = await checkPatientAccess(req, assessment.patientId);
        if (!access.ok) return res.status(access.status).json({ error: access.error });

        res.json(assessment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
