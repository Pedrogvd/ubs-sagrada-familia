import { Client } from "@opensearch-project/opensearch";

const ES_URL = process.env.ES_URL;

if (!ES_URL) {
    throw new Error(
        "ES_URL não está definido. Adicione no .env a URL de conexão do Elasticsearch/OpenSearch."
    );
}

export const esClient = new Client({
    node: ES_URL
})

export const INDICES = {
    patients: "patients",
    visits: "visits",
    healthProfessionals: "health_professionals",
    ivcfAssessments: "ivcf_assessments"
}


// Checks if an index (like a "table") already exists in Elasticsearch.
// If it doesn't, creates it with the given mapping (the field definitions).
// This prevents accidentally recreating the whole "patients" table (for
// example) every time the server restarts — NOT the same thing as
// preventing a duplicate patient record, which is a separate concern
// we'll handle later when we build patient creation.
//
// Note: locally, security is disabled on Elasticsearch, so anyone hitting
// port 9200 directly (e.g. via Postman) could create an index by hand,
// bypassing this function entirely. That's fine for local development.
// In production, Elasticsearch security is enabled again, and real users
// only ever talk to our Express API — never directly to Elasticsearch —
// so index creation stays controlled by code like this.

async function ensureIndex(index: string, mappings: Record<string, unknown>) {// "Record means some generic object with text keys, but I won't specify exactly which fields it has."
    const exists = await esClient.indices.exists({ index });
    if (!exists.body) {
        await esClient.indices.create({ index, body: { mappings } })
        console.log(`Index "${index}" created`);
    }
}

export async function ensureIndices(): Promise<void> { // A Promise represents a value that doesn't exist yet, but will exist in the future - it ensures that we will receive some answer (bad or good)

    await ensureIndex(INDICES.patients, {
        properties: {
            name: { type: "text" },
            cpf: { type: "keyword" },
            priority: { type: "keyword" },
            visitPeriodicityDays: { type: "integer" },
            active: { type: "boolean" },
            createdAt: { type: "date" },
            lastVisitAt: { type: "date" },
            nextVisitDue: { type: "date" },
        },
    });

    await ensureIndex(INDICES.visits, {
        properties: {
            patientId: { type: "keyword" },
            professionalId: { type: "keyword" },
            visitDate: { type: "date" },
            notes: { type: "text" },
        },
    });

    await ensureIndex(INDICES.healthProfessionals, {
        properties: {
            name: { type: "text" },
            cpf: { type: "keyword" },
            email: { type: "keyword" },
            passwordHash: { type: "keyword" },
            createdAt: { type: "date" },
        },
    });

    await ensureIndex(INDICES.ivcfAssessments, {
        properties: {
            patientId: { type: "keyword" },
            professionalId: { type: "keyword" },
            assessedAt: { type: "date" },
            totalScore: { type: "integer" },
            classification: { type: "keyword" },
            createdAt: { type: "date" },
        },
    });

}