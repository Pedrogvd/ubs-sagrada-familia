import crypto from "crypto";

// Gera uma senha temporária alfanumérica, sem caracteres ambíguos (0/O, 1/l),
// usada tanto no cadastro quanto no reset de senha feito por um admin.
export function generateTempPassword(length = 10): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pass = "";
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        pass += chars[bytes[i] % chars.length];
    }
    return pass;
}
