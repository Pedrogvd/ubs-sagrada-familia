import { esClient, INDICES, searchAll } from "./esClient";
import { CreateVisitInput, Visit } from "../types";
import { updatePatientAfterVisit, listPatients } from "./patientService";

export const VALID_VISIT_OUTCOMES = ["completed", "patient_absent", "refused"] as const;

export async function createVisit (input: CreateVisitInput, professionalId: string) : Promise <Visit> {

    const visit : Visit = {
        id: crypto.randomUUID(),
        patientId: input.patientId,
        professionalId,
        visitDate: input.visitDate,
        outcome: input.outcome,
        bloodPressure: input.bloodPressure,
        weightKg: input.weightKg,
        bloodGlucoseMgDl: input.bloodGlucoseMgDl,
        needsReferral: input.needsReferral,
        referredTo: input.referredTo,
        notes: input.notes,
    }

    await esClient.index({ // .index = create row
        index: INDICES.visits,
        id: visit.id,
        body: visit,
        refresh: "wait_for"
    })

    // só conta como "visitado" se o paciente foi realmente encontrado/atendido;
    // ausência ou recusa não deve resetar o alerta de atraso dele
    if (visit.outcome === "completed") {
        await updatePatientAfterVisit(visit.patientId, visit.visitDate);
    }

    return visit;
}

// scopeToProfessionalId: quando informado, só retorna visitas de pacientes
// cujo ACS responsável é esse profissional (usado pra quem não é admin)
// apaga todas as visitas de um paciente — usado quando o paciente em si
// é excluído, pra não deixar visita "órfã" (sem paciente) no índice
export async function deleteVisitsByPatient(patientId: string): Promise<void> {
    await esClient.deleteByQuery({
        index: INDICES.visits,
        body: { query: { term: { patientId } } },
        refresh: true,
    });
}

export async function listVisits(scopeToProfessionalId?: string): Promise<Visit[]> {
    const hits = await searchAll(
        INDICES.visits,
        { match_all: {} },
        [{ visitDate: { order: "desc" } }]
    );

    const visits = hits.map((hit: any) => hit._source as Visit);

    if (!scopeToProfessionalId) {
        return visits;
    }

    const myPatients = await listPatients(scopeToProfessionalId);
    const myPatientIds = new Set(myPatients.map((p) => p.id));

    return visits.filter((visit) => myPatientIds.has(visit.patientId));
}