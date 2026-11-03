import { esClient, INDICES } from "./esClient";
import { CreateIvcfAssessmentInput, IvcfAnswers, IvcfAssessment, IvcfClassification, IvcfScoreBreakdown } from "../types";

// Calcula a pontuação do IVCF-20 a partir das respostas (pontuação máxima: 40).
// Alguns itens (AVD instrumental, capacidade aeróbica/muscular e comorbidade
// múltipla) valem uma pontuação FIXA quando "Sim" é marcado, mesmo que mais
// de uma condição esteja presente — é assim que o instrumento original
// (Moraes et al.) define esses itens, e o próprio formulário avisa isso
// nessas três seções ("pontuação máxima X, mesmo que respondido Sim pra
// todas as questões").
export function computeIvcfScore(
    answers: IvcfAnswers
): { totalScore: number; scoreBreakdown: IvcfScoreBreakdown; classification: IvcfClassification } {
    const age = answers.age === "85_plus" ? 3 : answers.age === "75_84" ? 1 : 0;
    const healthPerception = answers.healthPerception === "regular_bad" ? 1 : 0;

    const avdInstrumental =
        answers.avdInstrumental.stoppedShopping ||
        answers.avdInstrumental.stoppedManagingMoney ||
        answers.avdInstrumental.stoppedHousework
            ? 4
            : 0;

    const avdBasica = answers.avdBasica.stoppedBathingAlone ? 6 : 0;

    const cognition =
        (answers.cognition.familyNoticedForgetfulness ? 1 : 0) +
        (answers.cognition.forgetfulnessWorsening ? 1 : 0) +
        (answers.cognition.forgetfulnessImpairsActivity ? 2 : 0);

    const humor =
        (answers.humor.discouragementSadnessHopelessness ? 2 : 0) +
        (answers.humor.lossOfInterestOrPleasure ? 2 : 0);

    const reachGrip =
        (answers.mobility.reachGrip.cannotRaiseArmsAboveShoulder ? 1 : 0) +
        (answers.mobility.reachGrip.cannotHandleSmallObjects ? 1 : 0);

    const aerobicMuscular = answers.mobility.aerobicMuscular.hasCondition ? 2 : 0;

    const gait =
        (answers.mobility.gait.difficultyImpairsActivity ? 2 : 0) +
        (answers.mobility.gait.twoOrMoreFallsLastYear ? 2 : 0);

    const continence = answers.mobility.continence.involuntaryLossOfUrineOrFeces ? 2 : 0;

    const vision = answers.communication.visionImpairsActivity ? 2 : 0;
    const hearing = answers.communication.hearingImpairsActivity ? 2 : 0;

    const multipleComorbidity = answers.multipleComorbidity.hasCondition ? 4 : 0;

    const scoreBreakdown: IvcfScoreBreakdown = {
        age,
        healthPerception,
        avdInstrumental,
        avdBasica,
        cognition,
        humor,
        reachGrip,
        aerobicMuscular,
        gait,
        continence,
        vision,
        hearing,
        multipleComorbidity,
    };

    const totalScore = Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0);

    // 0-6 baixa e >=15 alta estão impressos no formulário; a faixa intermediária
    // (7 a 14) como "moderada" segue a definição original do instrumento IVCF-20
    // (Moraes et al.) — o PDF usado de base imprime "7 a 10", o que parece uma
    // errata de digitação, já que deixaria 11 a 14 sem classificação nenhuma.
    const classification: IvcfClassification = totalScore <= 6 ? "baixa" : totalScore <= 14 ? "moderada" : "alta";

    return { totalScore, scoreBreakdown, classification };
}

export async function createIvcfAssessment(
    input: CreateIvcfAssessmentInput,
    professionalId: string
): Promise<IvcfAssessment> {
    const { totalScore, scoreBreakdown, classification } = computeIvcfScore(input.answers);

    const assessment: IvcfAssessment = {
        id: crypto.randomUUID(),
        patientId: input.patientId,
        professionalId,
        assessedAt: input.assessedAt,
        answers: input.answers,
        totalScore,
        scoreBreakdown,
        classification,
        createdAt: new Date().toISOString(),
    };

    await esClient.index({
        index: INDICES.ivcfAssessments,
        id: assessment.id,
        body: assessment,
        refresh: "wait_for",
    });

    return assessment;
}

// histórico completo de aplicações do IVCF-20 pro paciente, mais recente
// primeiro — a "versão atual" do documento do paciente é sempre o primeiro
// item dessa lista
export async function listIvcfAssessmentsByPatient(patientId: string): Promise<IvcfAssessment[]> {
    const result = await esClient.search({
        index: INDICES.ivcfAssessments,
        body: {
            query: { term: { patientId } },
            sort: [{ assessedAt: { order: "desc" } }],
            size: 200,
        },
    });

    return result.body.hits.hits.map((hit: any) => hit._source as IvcfAssessment);
}

// apaga todas as avaliações IVCF-20 de um paciente — usado quando o
// paciente em si é excluído, pra não deixar avaliação "órfã" no índice
export async function deleteIvcfAssessmentsByPatient(patientId: string): Promise<void> {
    await esClient.deleteByQuery({
        index: INDICES.ivcfAssessments,
        body: { query: { term: { patientId } } },
        refresh: true,
    });
}

export async function getIvcfAssessmentById(id: string): Promise<IvcfAssessment | null> {
    try {
        const result = await esClient.get({
            index: INDICES.ivcfAssessments,
            id,
        });

        const source = result.body._source as IvcfAssessment | undefined;
        return source ?? null;
    } catch (error: any) {
        if (error.meta?.statusCode === 404) return null;
        throw error;
    }
}
