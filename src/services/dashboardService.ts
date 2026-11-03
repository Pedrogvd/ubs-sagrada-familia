import { listPatients } from "./patientService";
import { listVisits } from "./visitService";
import { DashboardSummary } from "../types";

// scopeToProfessionalId: quando informado, o resumo é só dos pacientes
// desse profissional (usado pra quem não é admin)
export async function getDashboardSummary(scopeToProfessionalId?: string): Promise<DashboardSummary> {
    // O plano gratuito do Bonsai só permite 1 requisição por vez pro
    // Elasticsearch/OpenSearch, então essas duas buscas precisam rodar
    // uma depois da outra (sequencial), em vez de em paralelo (Promise.all).
    const patients = await listPatients(scopeToProfessionalId);
    const visits = await listVisits(scopeToProfessionalId);

    const now = new Date();

    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);

    const daysAgo30 = new Date(now);
    daysAgo30.setDate(daysAgo30.getDate() - 30);

    const activePatients = patients.filter((p) => p.active);

    const overdueVisits = activePatients.filter(
        (p) => p.nextVisitDue && new Date(p.nextVisitDue) < now
    ).length;

    const upcomingVisits7Days = activePatients.filter(
        (p) => p.nextVisitDue && new Date(p.nextVisitDue) >= now && new Date(p.nextVisitDue) <= in7Days
    ).length;

    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const visitsThisMonth = visits.filter((v) => v.visitDate.slice(0, 7) === currentMonthPrefix).length;

    const patientsTracked = activePatients.length;

    const patientsWithoutVisit30Days = activePatients.filter(
        (p) => !p.lastVisitAt || new Date(p.lastVisitAt) < daysAgo30
    ).length;

    return { overdueVisits, upcomingVisits7Days, visitsThisMonth, patientsTracked, patientsWithoutVisit30Days };
}