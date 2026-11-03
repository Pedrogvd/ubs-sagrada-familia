const secret = process.env.JWT_SECRET;

if (!secret) {
    throw new Error(
        "JWT_SECRET não está definido. Crie um arquivo .env na raiz do projeto com a linha JWT_SECRET=<uma string aleatória longa>."
    );
}

export const JWT_SECRET = secret;