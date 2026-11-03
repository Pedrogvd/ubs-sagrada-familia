// Apaga TODOS os documentos dos índices patients, visits e health_professionals,
// mantendo os índices e seus mapeamentos (não deleta os índices em si).
// Rode com: npx tsx scripts/clearData.ts
//
// ATENÇÃO: isso é irreversível. Não roda em produção sem ter certeza.

import "dotenv/config";
import { esClient, INDICES } from "../src/services/esClient";

async function clearIndex(index: string) {
    const result = await esClient.deleteByQuery({
        index,
        body: { query: { match_all: {} } },
        refresh: true,
    });
    const deleted = (result.body as any).deleted ?? 0;
    console.log(`"${index}": ${deleted} documento(s) apagado(s)`);
}

async function main() {
    console.log("Apagando dados de patients, visits e health_professionals...\n");
    await clearIndex(INDICES.patients);
    await clearIndex(INDICES.visits);
    await clearIndex(INDICES.healthProfessionals);
    console.log("\nPronto. Os índices continuam existindo, só os dados foram removidos.");
}

main().catch((err) => {
    console.error("Erro ao limpar os dados:", err);
    process.exit(1);
});
