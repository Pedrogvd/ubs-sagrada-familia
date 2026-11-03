export interface CreateVisitInput {
    patientId: string;
    visitDate: string;
    outcome: "completed" | "patient_absent" | "refused";
    bloodPressure: string;
    weightKg: number | null;
    bloodGlucoseMgDl: number | null;
    needsReferral: boolean;
    referredTo: string;
    notes: string;
}