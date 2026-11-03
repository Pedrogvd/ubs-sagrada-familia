export interface HealthProfessional {
    id: string;
    name: string;
    cpf: string;
    address: string;
    phoneNumber: string;
    email: string;
    passwordHash: string;
    role: "admin" | "professional";
    active: boolean;
    createdAt: string;
}