export interface EncryptedEnvelope {
  key: string; // AES envuelta (RSA-OAEP) en base64
  iv: string; // 12 bytes base64
  data: string; // ciphertext+tag base64
  nonce: string; // correlación
}
export interface EncryptedResponse {
  iv: string;
  data: string;
  nonce: string;
}

export function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    str += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)),
    );
  }
  return btoa(str);
}

export function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function randomNonce(len = 16): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return bufToB64(bytes);
}

export function getPathname(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
}

export function isEncryptedResponse(body: unknown): body is EncryptedResponse {
  return (
    !!body &&
    typeof body === 'object' &&
    'iv' in body &&
    'data' in body &&
    'nonce' in body
  );
}
