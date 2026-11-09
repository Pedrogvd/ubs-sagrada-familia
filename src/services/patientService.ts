import { esClient, INDICES, searchAll } from "./esClient";
import { AlertLevel, CreatePatientInput, Patient, PatientWithAlert } from "../types";

export const VALID_CONDITIONS = [
    "diabetes",
    "hypertension",
    "pregnant",
    "postpartum",
    "child_under_2",
    "bedridden_elderly",
    "frail_elderly",
    "physical_disability",
    "mental_disorder",
    "tuberculosis",
    "leprosy",
    "substance_dependency",
] as const;

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
    const patient: Patient = {
        id: crypto.randomUUID(),
        name: input.name,
        cpf: input.cpf,
        address: input.address,
        phoneNumber: input.phoneNumber,
        dateOfBirth: input.dateOfBirth,
        priority: input.priority,
        conditions: input.conditions,
        visitPeriodicityDays: input.visitPeriodicityDays,
        active: true,
        createdAt: new Date().toISOString(),
        lastVisitAt: null,
        nextVisitDue: null,
        cns: input.cns,
        microarea: input.microarea,
        acsResponsavelId: input.acsResponsavelId,
    }

    await esClient.index({
        index: INDICES.patients,
        id: patient.id,
        body: patient,
        refresh: "wait_for"
    })

    return patient;
}

export function calculateAlertLevel(patient: Patient, now: Date = new Date()): AlertLevel {
    
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);

    const daysAgo30 = new Date(now);
    daysAgo30.setDate(daysAgo30.getDate() - 30);

    if (!patient.lastVisitAt || new Date(patient.lastVisitAt) < daysAgo30) {
        return "critical";
    }
    if (patient.nextVisitDue && new Date(patient.nextVisitDue) < now) {
        return "overdue";
    }

    if (patient.nextVisitDue && new Date(patient.nextVisitDue) <= in7Days) {
        return "upcoming";
    }

    return "ok";
}

// scopeToProfessionalId: quando informado, só retorna pacientes cujo ACS
// responsável é esse profissional (usado pra quem não é admin)
export async function listPatients(scopeToProfessionalId?: string): Promise<PatientWithAlert[]> {
    const hits = await searchAll(INDICES.patients, { match_all: {} }, ["_doc"]);

    const now = new Date();

    const patients = hits.map((hit: any) => {
        const patient = hit._source as Patient;
        return { ...patient, alertLevel: calculateAlertLevel(patient, now) };
    });

    if (!scopeToProfessionalId) {
        return patients;
    }

    return patients.filter((patient) => patient.acsResponsavelId === scopeToProfessionalId);
}

export async function getPatient(id: string): Promise<PatientWithAlert | null> {
    try {
        const result = await esClient.get({
            index: INDICES.patients,
            id: id
        })

        const source = result.body._source as Patient | undefined;
        if (!source) return null;

        return { ...source, alertLevel: calculateAlertLevel(source) };

    } catch (error: any) {
        if (error.meta?.statusCode === 404) return null;
        throw error;
    }
}

// updates parciais (edição de paciente) — só os campos enviados são mesclados no documento existente
export async function updatePatient(
    id: string,
    updates: Partial<Omit<Patient, "id" | "createdAt" | "lastVisitAt" | "nextVisitDue">>
): Promise<PatientWithAlert | null> {
    try {
        await esClient.update({
            index: INDICES.patients,
            id,
            body: { doc: updates },
            refresh: "wait_for",
        });
    } catch (error: any) {
        if (error.meta?.statusCode === 404) return null;
        throw error;
    }

    return getPatient(id);
}

export async function updatePatientAfterVisit(patientId: string, visitDate: string): Promise<void> {
    const patient = await getPatient(patientId)
    if (!patient) throw new Error(`Patient ${patientId} not found`);

    const nextVisitDue = addDays(visitDate, patient.visitPeriodicityDays);

    await esClient.update({
        index: INDICES.patients,
        id: patientId,
        body: {
            doc: {
                // only these fields get merged into the existing patient; everything else stays untouched
                lastVisitAt: visitDate,
                nextVisitDue: nextVisitDue
            }
        },
        refresh: "wait_for"
    })
}

// apaga o documento do paciente. NÃO apaga visitas/IVCF ligados a ele —
// isso é responsabilidade de quem chama (ver a rota DELETE /patients/:id,
// que apaga o histórico clínico primeiro pra não deixar registro órfão)
export async function deletePatient(id: string): Promise<void> {
    try {
        await esClient.delete({
            index: INDICES.patients,
            id,
            refresh: "wait_for",
        });
    } catch (error: any) {
        if (error.meta?.statusCode === 404) return;
        throw error;
    }
}

function addDays(isoDate: string, days: number): string {
    const date = new Date(isoDate);
    date.setDate(date.getDate() + days);
    return date.toISOString();
}