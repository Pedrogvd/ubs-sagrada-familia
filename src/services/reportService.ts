import { esClient, INDICES, searchAll } from "./esClient";
import { listVisits } from "./visitService";
import {
    Visit,
    Patient,
    HealthProfessional,
    MonthlyReport,
    VisitOutcomeBreakdown,
    AcsRanking,
    ConditionBreakdown,
} from "../types";

async function listAllPatients(): Promise<Patient[]> {
    const hits = await searchAll(INDICES.patients, { match_all: {} }, ["_doc"]);
    return hits.map((hit: any) => hit._source as Patient);
}

async function listAllHealthProfessionals(): Promise<HealthProfessional[]> {
    const hits = await searchAll(INDICES.healthProfessionals, { match_all: {} }, ["_doc"]);
    return hits.map((hit: any) => hit._source as HealthProfessional);
}

// "YYYY-MM-DDTHH:mm..." sempre começa com "YYYY-MM", então comparar os 7
// primeiros caracteres evita qualquer problema de fuso horário (mesma ideia
// já usada no calendário de visitas)
function isInMonth(isoLikeString: string, month: string): boolean {
    return isoLikeString.slice(0, 7) === month;
}

function buildVisitOutcomes(visits: Visit[]): VisitOutcomeBreakdown {
    const completed = visits.filter((v) => v.outcome === "completed").length;
    const patient_absent = visits.filter((v) => v.outcome === "patient_absent").length;
    const refused = visits.filter((v) => v.outcome === "refused").length;
    const total = visits.length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, patient_absent, refused, total, successRate };
}

function buildAcsRanking(visits: Visit[], professionals: HealthProfessional[]): AcsRanking[] {
    const countByProfessional = new Map<string, number>();

    for (const visit of visits) {
        countByProfessional.set(visit.professionalId, (countByProfessional.get(visit.professionalId) ?? 0) + 1);
    }

    const ranking: AcsRanking[] = [];
    for (const [professionalId, visitsCount] of countByProfessional) {
        const professional = professionals.find((p) => p.id === professionalId);
        ranking.push({
            professionalId,
            professionalName: professional?.name ?? "Desconhecido",
            visitsCount,
        });
    }

    return ranking.sort((a, b) => b.visitsCount - a.visitsCount);
}

function buildConditionBreakdown(visits: Visit[], patients: Patient[]): ConditionBreakdown[] {
    const patientsById = new Map(patients.map((p) => [p.id, p]));

    // só conta pacientes realmente atendidos ("completed"), uma vez por
    // condição, mesmo que tenham sido visitados mais de uma vez no mês
    const visitedPatientIds = new Set(
        visits.filter((v) => v.outcome === "completed").map((v) => v.patientId)
    );

    const countByCondition = new Map<string, number>();

    for (const patientId of visitedPatientIds) {
        const patient = patientsById.get(patientId);
        if (!patient) continue;

        for (const condition of patient.conditions) {
            countByCondition.set(condition, (countByCondition.get(condition) ?? 0) + 1);
        }
    }

    return Array.from(countByCondition.entries())
        .map(([condition, patientsVisited]) => ({ condition, patientsVisited }))
        .sort((a, b) => b.patientsVisited - a.patientsVisited);
}

// scopeToProfessionalId: quando informado, o relatório é só dos pacientes
// desse profissional (usado pra quem não é admin)
export async function getMonthlyReport(month: string, scopeToProfessionalId?: string): Promise<MonthlyReport> {
    // Mesma razão do dashboardService: o plano gratuito do Bonsai só aceita
    // 1 requisição por vez, então essas três buscas rodam em sequência.
    const allVisits = await listVisits(scopeToProfessionalId);
    const patients = await listAllPatients();
    const professionals = await listAllHealthProfessionals();

    const visitsInMonth = allVisits.filter((visit) => isInMonth(visit.visitDate, month));

    const scopedPatients = scopeToProfessionalId
        ? patients.filter((p) => p.acsResponsavelId === scopeToProfessionalId)
        : patients;

    const newPatientsCount = scopedPatients.filter((patient) => isInMonth(patient.createdAt, month)).length;

    return {
        month,
        visitOutcomes: buildVisitOutcomes(visitsInMonth),
        acsRanking: buildAcsRanking(visitsInMonth, professionals),
        conditionBreakdown: buildConditionBreakdown(visitsInMonth, scopedPatients),
        newPatientsCount,
    };
}