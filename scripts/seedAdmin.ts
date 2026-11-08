// Cria a conta de admin inicial do sistema (hoje não existe nenhuma).
// Como a rota pública de cadastro força role "professional" de propósito,
// aqui a gente cria normal e depois promove pra admin.
// Rode com: npx tsx scripts/seedAdmin.ts

import "dotenv/config";
import { createHealthProfessional, updateHealthProfessional } from "../src/services/healthProfessionalService";
import { generateTempPassword } from "../src/utils/generatePassword";

const ADMIN = {
    name: "Pedro",
    cpf: "120.101.346-13",
    email: "pedrogabrielvilacadiniz@gmail.com",
};

async function main() {
    const password = generateTempPassword();

    const created = await createHealthProfessional({
        name: ADMIN.name,
        cpf: ADMIN.cpf,
        address: "",
        phoneNumber: "",
        email: ADMIN.email,
        password,
    });

    await updateHealthProfessional(created.id, { role: "admin" });

    console.log("Conta de admin criada!\n");
    console.log(`Nome: ${ADMIN.name}`);
    console.log(`Email: ${ADMIN.email}`);
    console.log(`Senha temporária: ${password}`);
    console.log("\nUse essa senha pra logar e depois troque pela rota PATCH /health-professionals/me/password.");
}

main().catch((err) => {
    console.error("Erro ao criar admin:", err);
    process.exit(1);
});
