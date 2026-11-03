import { IvcfAnswers } from "../IvcfAssessment";

export interface CreateIvcfAssessmentInput {
    patientId: string;
    assessedAt: string;
    answers: IvcfAnswers;
}
