import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string; // 64-character hex string
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(text: string): string | null {
  try {
    console.log("Attempting to decrypt:", text);
    const textParts = text.split(":");
    if (textParts.length !== 2) {
      console.error("Invalid encrypted text format");
      return null;
    }
    const iv = Buffer.from(textParts[0], "hex");
    const encryptedText = Buffer.from(textParts[1], "hex");
    const key = Buffer.from(ENCRYPTION_KEY, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    const result = decrypted.toString();
    console.log("Decryption successful. Token length:", result.length);
    return result;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

export { encrypt, decrypt };