import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { EncryptedData } from './interfaces/encryption.interface';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const hexKey = this.configService.getOrThrow<string>('salla.encryptionKey');
    this.key = Buffer.from(hexKey, 'hex');

    if (this.key.length !== 32) {
      throw new Error('SALLA_ENCRYPTION_KEY must be a 32-byte hex string (64 hex characters)');
    }
  }

  encrypt(plaintext: string): EncryptedData {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  decrypt(data: EncryptedData): string {
    try {
      const decipher = createDecipheriv(this.algorithm, this.key, Buffer.from(data.iv, 'hex'));
      decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(data.encrypted, 'hex')),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('Decryption failed');
      throw error;
    }
  }
}
