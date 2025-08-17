export type Envelope = {
    iv: string;    // base64
    data: string;  // base64
    ek: string;    // base64  (solo en la petición)
    nonce: string; // base64url
};

// Para respuestas del server (sin ek)
export type EnvelopeResp = {
    iv: string;
    data: string;
    nonce: string;
};


// --- base64 helpers sobre Uint8Array ---
export function bytesToB64(u8: Uint8Array): string {
    let s = '';
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return typeof btoa !== 'undefined' ? btoa(s) : Buffer.from(s, 'binary').toString('base64');
}

export function b64ToBytes(b64: string): Uint8Array {
    const bin = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

export function toB64url(b64: string): string {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function fromB64url(b64url: string): string {
    const pad = (s: string) => s + '==='.slice((s.length + 3) % 4);
    return pad(b64url.replace(/-/g, '+').replace(/_/g, '/'));
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export function strToBytes(s: string): Uint8Array { return enc.encode(s); }
export function bytesToStr(b: Uint8Array): string { return dec.decode(b); }

export function randomBytes(len: number): Uint8Array {
    const a = new Uint8Array(len);
    crypto.getRandomValues(a);
    return a;
}
export function randomNonce(len = 16): string {
    return toB64url(bytesToB64(randomBytes(len)));
}

export async function importServerPublicKeyFromJwk(jwk: JsonWebKey): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );
}

export async function genAesKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

export function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
    const ab = new ArrayBuffer(u8.byteLength);
    new Uint8Array(ab).set(u8);
    return ab;
}
