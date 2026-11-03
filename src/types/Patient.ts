export interface Patient {
    id: string;
    name: string;
    cpf: string;
    address: string;
    phoneNumber: string;
    dateOfBirth: string;
    priority: "high" | "medium" | "low";
    conditions: string[];
    visitPeriodicityDays: number;
    active: boolean;
    createdAt: string;
    lastVisitAt: string | null;
    nextVisitDue: string | null;
    cns: string;
    microarea: string;
    acsResponsavelId: string;
}

export type AlertLevel = "critical" | "overdue" | "upcoming" | "ok";

export interface PatientWithAlert extends Patient {
    alertLevel: AlertLevel;
}