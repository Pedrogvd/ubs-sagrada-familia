import { esClient, INDICES, searchAll } from "./esClient";
import { CreateHealthProfessionalInput, HealthProfessional } from "../types";
import { JWT_SECRET } from "../config/jwt";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

function toSafeProfessional(professional: HealthProfessional): Omit<HealthProfessional, "passwordHash"> {
    return {
        id: professional.id,
        name: professional.name,
        cpf: professional.cpf,
        address: professional.address,
        phoneNumber: professional.phoneNumber,
        email: professional.email,
        role: professional.role ?? "professional",
        active: professional.active ?? true,
        createdAt: professional.createdAt,
    };
}

export async function createHealthProfessional(input: CreateHealthProfessionalInput): Promise<HealthProfessional> {
    const passwordHash = await bcrypt.hash(input.password, 10);

    const healthProfessional: HealthProfessional = {
        id: crypto.randomUUID(),
        name: input.name,
        cpf: input.cpf,
        address: input.address,
        phoneNumber: input.phoneNumber,
        email: input.email,
        passwordHash,
        // todo cadastro nasce como profissional comum e ativo; virar admin ou
        // ser desativado é feito depois, via tela de Usuários
        role: "professional",
        active: true,
        createdAt: new Date().toISOString(),
    }

    await esClient.index({
        index: INDICES.healthProfessionals,
        id: healthProfessional.id,
        body: healthProfessional,
        refresh: "wait_for"
    })

    return healthProfessional;
}

// the user will type the email at login and with this we will get the ID
export async function getHealthProfessionalByEmail(email: string): Promise<HealthProfessional | null> {

    const result = await esClient.search({
        index: INDICES.healthProfessionals,
        body: {
            query: {
                term: { email }
            }
        }
    })

    const hit = result.body.hits.hits[0];

    if (!hit || !hit._source) {
        return null;
    }

    return hit._source as HealthProfessional;
}


export async function loginHealthProfessional(email: string, password: string): Promise<{ token: string; name: string } | null> {
    const professional = await getHealthProfessionalByEmail(email);

    if (!professional) {
        return null;
    }

    // cadastros antigos não tinham esse campo; só bloqueia se foi explicitamente desativado
    if (professional.active === false) {
        return null;
    }

    const passwordMatches = await bcrypt.compare(password, professional.passwordHash)

    if (!passwordMatches) {
        return null;
    }

    const token = jwt.sign (
        {
            professionalId: professional.id,
            email: professional.email,
            role: professional.role ?? "professional",
        },
        JWT_SECRET,
        {expiresIn: "8h"}
    );

    return {token, name: professional.name}
}

export async function listHealthProfessionals(): Promise<Omit<HealthProfessional, "passwordHash">[]> {
    const hits = await searchAll(INDICES.healthProfessionals, { match_all: {} }, ["_doc"]);

    return hits.map((hit: any) => toSafeProfessional(hit._source as HealthProfessional));
}

export async function getHealthProfessionalById(id: string): Promise<Omit<HealthProfessional, "passwordHash"> | null> {
    try {
        const result = await esClient.get({
            index: INDICES.healthProfessionals,
            id,
        });

        const source = result.body._source as HealthProfessional | undefined;
        if (!source) return null;

        return toSafeProfessional(source);
    } catch (error: any) {
        if (error.meta?.statusCode === 404) return null;
        throw error;
    }
}

export async function updateHealthProfessional(
    id: string,
    updates: {
        role?: "admin" | "professional";
        active?: boolean;
        name?: string;
        cpf?: string;
        address?: string;
        phoneNumber?: string;
        email?: string;
    }
): Promise<Omit<HealthProfessional, "passwordHash"> | null> {
    try {
        await esClient.update({
            index: INDICES.healthProfessionals,
            id,
            body: { doc: updates },
            refresh: "wait_for",
        });
    } catch (error: any) {
        if (error.meta?.statusCode === 404) return null;
        throw error;
    }

    const result = await esClient.get({
        index: INDICES.healthProfessionals,
        id,
    });

    const source = result.body._source as HealthProfessional | undefined;
    if (!source) return null;

    return toSafeProfessional(source);
}


export async function changeOwnPassword(
    id: string,
    currentPassword: string,
    newPassword: string
): Promise<"ok" | "not_found" | "wrong_password"> {
    let professional: HealthProfessional | undefined;

    try {
        const result = await esClient.get({
            index: INDICES.healthProfessionals,
            id,
        });
        professional = result.body._source as HealthProfessional | undefined;
    } catch (error: any) {
        if (error.meta?.statusCode === 404) return "not_found";
        throw error;
    }

    if (!professional) return "not_found";

    const passwordMatches = await bcrypt.compare(currentPassword, professional.passwordHash);
    if (!passwordMatches) return "wrong_password";

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await esClient.update({
        index: INDICES.healthProfessionals,
        id,
        body: { doc: { passwordHash } },
        refresh: "wait_for",
    });

    return "ok";
}

// admin reseta a senha de outro profissional (ex: usuário esqueceu e não tem como
// recuperar por email, já que não existe envio de email configurado no projeto)
export async function resetPasswordByAdmin(id: string, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    try {
        await esClient.update({
            index: INDICES.healthProfessionals,
            id,
            body: { doc: { passwordHash } },
            refresh: "wait_for",
        });
    } catch (error: any) {
        if (error.meta?.statusCode === 404) return false;
        throw error;
    }

    return true;
}
