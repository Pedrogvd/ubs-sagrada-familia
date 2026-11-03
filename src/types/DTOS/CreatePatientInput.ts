export interface CreatePatientInput {
    name: string;
    cpf: string;
    address: string;
    phoneNumber: string;
    dateOfBirth: string;
    priority: "high" | "medium" | "low";
    conditions: string[];
    visitPeriodicityDays: number;
    cns: string;
    microarea: string;
    acsResponsavelId: string;
}