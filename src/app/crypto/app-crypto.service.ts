import { Injectable, makeStateKey, TransferState } from '@angular/core';
import {
  EncryptedEnvelope,
  EncryptedResponse,
  bufToB64,
  b64ToBuf,
  randomNonce,
} from './crypto-utils';

const JWK_STATE = makeStateKey<JsonWebKey | null>('SERVER_PUBLIC_JWK');

@Injectable({ providedIn: 'root' })
export class AppCryptoService {
  private serverPublicKey?: CryptoKey;
  private aesByNonce = new Map<string, CryptoKey>();
  private encryptionEnabled = false; // solo si SSR dejó la JWK en TransferState

  constructor(private ts: TransferState) {
    // Cliente: intenta leer de TransferState (inyectado por SSR). Nunca hace GET aquí.
    const cached = this.ts.get<JsonWebKey | null>(JWK_STATE, null);
    console.log('Cached JWK:', cached);
    if (cached) {
      crypto.subtle
        .importKey('jwk', cached, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, [
          'encrypt',
        ])
        .then((k) => {
          this.serverPublicKey = k;
          this.encryptionEnabled = true;
        })
        .catch(() => {
          this.encryptionEnabled = false;
        });
    }
  }

  isEncryptionReady(): boolean {
    console.log(
      'Encryption ready:',
      this.encryptionEnabled,
      this.serverPublicKey,
    );
    return this.encryptionEnabled && !!this.serverPublicKey;
  }

  private async makeAesKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ]);
  }
  private async exportRawAes(key: CryptoKey): Promise<ArrayBuffer> {
    return crypto.subtle.exportKey('raw', key);
  }

  async encryptPayload(
    method: string,
    urlPath: string,
    payload: any,
    useAAD = true,
  ) {
    if (!this.isEncryptionReady()) throw new Error('Encryption not ready');
    const aesKey = await this.makeAesKey();
    const nonce = randomNonce(16);
    this.aesByNonce.set(nonce, aesKey);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plain = new TextEncoder().encode(JSON.stringify(payload));
    const params: AesGcmParams = { name: 'AES-GCM', iv };
    if (useAAD)
      (params as any).additionalData = new TextEncoder().encode(
        `${method.toUpperCase()}:${urlPath}`,
      );

    const cipherBuf = await crypto.subtle.encrypt(params, aesKey, plain);
    const rawAes = await this.exportRawAes(aesKey);
    const wrapped = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      this.serverPublicKey!,
      rawAes,
    );

    const envelope: EncryptedEnvelope = {
      key: bufToB64(wrapped),
      iv: bufToB64(iv),
      data: bufToB64(cipherBuf),
      nonce,
    };
    return { envelope, nonce };
  }

  async decryptResponse(
    resp: EncryptedResponse,
    method: string,
    urlPath: string,
    useAAD = true,
  ) {
    const aesKey = this.aesByNonce.get(resp.nonce);
    if (!aesKey) throw new Error('AES key not found for nonce');
    const iv = new Uint8Array(b64ToBuf(resp.iv));
    const cipher = b64ToBuf(resp.data);
    const params: AesGcmParams = { name: 'AES-GCM', iv };
    if (useAAD)
      (params as any).additionalData = new TextEncoder().encode(
        `${method.toUpperCase()}:${urlPath}`,
      );

    const plain = await crypto.subtle.decrypt(params, aesKey, cipher);
    this.aesByNonce.delete(resp.nonce);
    const text = new TextDecoder().decode(plain);
    return JSON.parse(text);
  }
}
