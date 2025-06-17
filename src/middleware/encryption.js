import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY.slice(0, 32); // must be 32 chars
const IV = crypto.randomBytes(16);

export const encrypt = (text) => {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    IV
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return IV.toString("hex") + ":" + encrypted.toString("hex");
};

export const decrypt = (text) => {
  const [ivStr, encryptedText] = text.split(":");
  const iv = Buffer.from(ivStr, "hex");
  const encrypted = Buffer.from(encryptedText, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
