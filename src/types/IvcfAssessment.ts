// IVCF-20 (Índice de Vulnerabilidade Clínico Funcional 20) — instrumento de
// rastreio de fragilidade em idosos, baseado no formulário oficial (Moraes
// et al.) usado pela Prefeitura do Rio.

export interface IvcfAnswers {
    age: "60_74" | "75_84" | "85_plus";
    healthPerception: "good" | "regular_bad";

    avdInstrumental: {
        stoppedShopping: boolean;
        stoppedManagingMoney: boolean;
        stoppedHousework: boolean;
    };

    avdBasica: {
        stoppedBathingAlone: boolean;
    };

    cognition: {
        familyNoticedForgetfulness: boolean;
        forgetfulnessWorsening: boolean;
        forgetfulnessImpairsActivity: boolean;
    };

    humor: {
        discouragementSadnessHopelessness: boolean;
        lossOfInterestOrPleasure: boolean;
    };

    mobility: {
        reachGrip: {
            cannotRaiseArmsAboveShoulder: boolean;
            cannotHandleSmallObjects: boolean;
        };
        aerobicMuscular: {
            hasCondition: boolean;
            unintentionalWeightLoss: boolean;
            lowBmi: boolean;
            smallCalfCircumference: boolean;
            slowGaitSpeed: boolean;
        };
        gait: {
            difficultyImpairsActivity: boolean;
            twoOrMoreFallsLastYear: boolean;
        };
        continence: {
            involuntaryLossOfUrineOrFeces: boolean;
        };
    };

    communication: {
        visionImpairsActivity: boolean;
        hearingImpairsActivity: boolean;
    };

    multipleComorbidity: {
        hasCondition: boolean;
        fiveOrMoreChronicDiseases: boolean;
        fiveOrMoreDailyMedications: boolean;
        recentHospitalization: boolean;
    };
}

export interface IvcfScoreBreakdown {
    age: number;
    healthPerception: number;
    avdInstrumental: number;
    avdBasica: number;
    cognition: number;
    humor: number;
    reachGrip: number;
    aerobicMuscular: number;
    gait: number;
    continence: number;
    vision: number;
    hearing: number;
    multipleComorbidity: number;
}

export type IvcfClassification = "baixa" | "moderada" | "alta";

export interface IvcfAssessment {
    id: string;
    patientId: string;
    professionalId: string;
    assessedAt: string;
    answers: IvcfAnswers;
    totalScore: number;
    scoreBreakdown: IvcfScoreBreakdown;
    classification: IvcfClassification;
    createdAt: string;
}
