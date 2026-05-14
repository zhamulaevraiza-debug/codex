import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

@Injectable()
export class CryptoService {
  private cachedKey: Buffer | null = null;

  private getKey(): Buffer {
    if (this.cachedKey) return this.cachedKey;
    const raw = process.env.CRYPTO_KEY;
    if (!raw) {
      throw new Error("CRYPTO_KEY is not set");
    }
    const key = Buffer.from(raw, "base64");
    if (key.length !== 32) {
      throw new Error("CRYPTO_KEY must be 32 bytes (base64-encoded)");
    }
    this.cachedKey = key;
    return key;
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      iv.toString("base64"),
      tag.toString("base64"),
      encrypted.toString("base64"),
    ].join(":");
  }

  decrypt(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split(":");
    if (!ivB64 || !tagB64 || !dataB64) {
      throw new Error("Invalid encrypted payload");
    }
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = createDecipheriv("aes-256-gcm", this.getKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  }
}
