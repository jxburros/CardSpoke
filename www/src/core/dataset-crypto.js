/*
 * Copyright 2026 Jeffrey Guntly (JX Holdings, LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Dataset envelope encryption (CS-001)
//
// PIN-protected datasets are persisted as a JSON "envelope" that carries the
// KDF/cipher parameters (salt, IV, iteration count) and the AES-GCM
// ciphertext — never the PIN itself, in any form. Unlocking re-derives the
// key from the PIN the user types. This module is pure and environment-
// agnostic (browser + Node >= 18 via globalThis.crypto) so the envelope
// format has real unit tests.

const PBKDF2_ITERATIONS = 250000;

function getCrypto() {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (!c || !c.subtle) throw new Error('Web Crypto API unavailable');
  return c;
}

export function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function derivePinKey(pin, saltBytes) {
  const cryptoApi = getCrypto();
  const encoder = new TextEncoder();
  const baseKey = await cryptoApi.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return cryptoApi.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a serialized store payload with a PIN-derived key.
 * @returns {Promise<string>} JSON envelope string
 */
export async function encryptStorePayload(payload, pin) {
  const cryptoApi = getCrypto();
  const salt = cryptoApi.getRandomValues(new Uint8Array(16));
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const key = await derivePinKey(pin, salt);
  const data = new TextEncoder().encode(payload);
  const encrypted = await cryptoApi.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return JSON.stringify({
    encrypted: true,
    version: 1,
    kdf: 'PBKDF2',
    cipher: 'AES-GCM',
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    payload: toBase64(new Uint8Array(encrypted))
  });
}

/**
 * Decrypt an envelope produced by encryptStorePayload().
 * Non-envelope input is returned unchanged. A wrong PIN rejects
 * (AES-GCM authentication fails) — it never yields garbage output.
 * @returns {Promise<string>} the decrypted payload string
 */
export async function decryptStorePayload(encryptedPayload, pin) {
  const envelope = typeof encryptedPayload === 'string' ? JSON.parse(encryptedPayload) : encryptedPayload;
  if (!envelope || !envelope.encrypted) return encryptedPayload;
  const cryptoApi = getCrypto();
  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  const ciphertext = fromBase64(envelope.payload);
  const key = await derivePinKey(pin, salt);
  const decrypted = await cryptoApi.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

/**
 * Detect the encrypted-dataset envelope WITHOUT attempting decryption.
 * load() must call this before parsing a payload as a store so an
 * encrypted dataset is never mistaken for (and overwritten by) an empty
 * store (CS-001).
 */
export function isEncryptedEnvelope(value) {
  return !!(value && typeof value === 'object' &&
    value.encrypted === true &&
    typeof value.payload === 'string' &&
    typeof value.salt === 'string' &&
    typeof value.iv === 'string');
}
