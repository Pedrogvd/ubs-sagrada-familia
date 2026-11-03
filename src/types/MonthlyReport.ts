export interface VisitOutcomeBreakdown {
    completed: number;
    patient_absent: number;
    refused: number;
    total: number;
    successRate: number;
}

export interface AcsRanking {
    professionalId: string;
    professionalName: string;
    visitsCount: number;
}

export interface ConditionBreakdown {
    condition: string;
    patientsVisited: number;
}

export interface MonthlyReport {
    month: string;
    visitOutcomes: VisitOutcomeBreakdown;
    acsRanking: AcsRanking[];
    conditionBreakdown: ConditionBreakdown[];
    newPatientsCount: number;
}