import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, TransferState, inject, makeStateKey } from '@angular/core';
import {
    Envelope,
    EnvelopeResp,
    b64ToBytes,
    bytesToB64,
    bytesToStr,
    genAesKey,
    importServerPublicKeyFromJwk,
    randomBytes, randomNonce,
    strToBytes,
} from './crypto-utils';

const JWK_STATE = makeStateKey<JsonWebKey | null>('SERVER_PUBLIC_JWK');

// Helper para asegurar ArrayBuffer real
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
    const ab = new ArrayBuffer(u8.byteLength);
    new Uint8Array(ab).set(u8);
    return ab;
}

@Injectable({ providedIn: 'root' })
export class AppCryptoService {
    private ts = inject(TransferState);
    private platformId = inject(PLATFORM_ID);

    private serverPublicKey?: CryptoKey;
    private aesByNonce = new Map<string, CryptoKey>();
    private ready = false;
    private initPromise: Promise<void> | null = null;

    public get isReady() { return this.ready && !!this.serverPublicKey; }

    public async setServerPublicJwk(jwk: JsonWebKey) {
        this.initPromise = (async () => {
            this.serverPublicKey = await importServerPublicKeyFromJwk(jwk);
            this.ready = true;
        })();
        await this.initPromise;
    }

    public async waitUntilReady() {
        if (this.isReady) return;
        if (this.initPromise) {
            await this.initPromise;
        }
    }

    public ensureReadyFromTransferStateOnce(): Promise<void> | void {
        if (this.isReady) return;
        const jwk = this.ts.get<JsonWebKey | null>(JWK_STATE, null);
        if (jwk) {
            return this.setServerPublicJwk(jwk);
        }
    }
    // Solo se debe invocar en SSR, nunca en cliente
    public async fetchJwkOnServerOnce(getJwk: () => Promise<JsonWebKey>) {
        if (!isPlatformServer(this.platformId)) {
            throw new Error('fetchJwkOnServerOnce() no debe llamarse en cliente');
        }
        if (this.isReady || this.initPromise) {
            await this.waitUntilReady();
            return;
        }
        const jwk = await getJwk();
        await this.setServerPublicJwk(jwk);
    }


    public looksEnvelope(x: any): x is Envelope | EnvelopeResp {
        return !!x && typeof x === 'object'
            && typeof x.iv === 'string'
            && typeof x.data === 'string'
            && typeof x.nonce === 'string';
    }

    public async encryptPayload(plain: any): Promise<{ envelope: Envelope; nonce: string }> {
        if (!this.isReady || !this.serverPublicKey) throw new Error('Crypto not ready');

        // 1) Prepara AES, IV, nonce y payload
        const aes = await genAesKey();
        const ivBytes = randomBytes(12);
        const nonce = randomNonce();
        const rawBytes = strToBytes(JSON.stringify(plain));

        // 2) Cifra el body con AES-GCM
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: toArrayBuffer(ivBytes) },
            aes,
            toArrayBuffer(rawBytes),
        );

        // 3) Exporta la AES en crudo y envuélvela con la pública del server (RSA-OAEP)
        const aesRaw = new Uint8Array(await crypto.subtle.exportKey('raw', aes));
        const wrapped = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, this.serverPublicKey, toArrayBuffer(aesRaw));

        // 4) Serializa a base64 y arma el envelope
        const cipherU8 = new Uint8Array(ciphertext);
        const wrappedU8 = new Uint8Array(wrapped);

        const envelope: Envelope = {
            iv: bytesToB64(ivBytes),
            data: bytesToB64(cipherU8),
            ek: bytesToB64(wrappedU8),
            nonce,
        };

        // 5) Guarda la AES por nonce para descifrar la respuesta
        this.aesByNonce.set(nonce, aes);

        return { envelope, nonce };
    }

    // Descifrar respuesta del server (envelope de vuelta)
    public async decryptEnvelope(env: Envelope | EnvelopeResp): Promise<any> {
        const aes = this.aesByNonce.get(env.nonce);
        if (!aes) throw new Error('Missing session key for nonce');

        const ivBytes = b64ToBytes(env.iv);
        const dataBytes = b64ToBytes(env.data);

        const plainBuf = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: toArrayBuffer(ivBytes) },
            aes,
            toArrayBuffer(dataBytes),
        );

        const json = bytesToStr(new Uint8Array(plainBuf));
        return JSON.parse(json);
    }


    public dropNonce(nonce: string) {
        this.aesByNonce.delete(nonce);
    }
}
