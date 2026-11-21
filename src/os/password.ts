export interface PasswordCredential {
  salt: string;
  hash: string;
}

const ITERATIONS = 310_000;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})+$/i.test(value)) {
    throw new Error("Stored password data is invalid.");
  }
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

async function derivePasswordHash(password: string, salt: Uint8Array): Promise<Uint8Array> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Password protection requires a browser with Web Crypto support.");
  }
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBuffer, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function createPasswordCredential(password: string): Promise<PasswordCredential> {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Password protection requires a browser with secure random number support.");
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt);
  return { salt: toHex(salt), hash: toHex(hash) };
}

export async function verifyPassword(password: string, credential: PasswordCredential): Promise<boolean> {
  const salt = fromHex(credential.salt);
  const expected = fromHex(credential.hash);
  if (salt.length !== 16 || expected.length !== 32) {
    throw new Error("Stored password data is invalid.");
  }

  const actual = await derivePasswordHash(password, salt);
  if (actual.length !== expected.length) {
    throw new Error("Derived password data has an unexpected length.");
  }
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    const expectedByte = expected[index];
    const actualByte = actual[index];
    if (expectedByte === undefined || actualByte === undefined) {
      throw new Error("Stored password data is invalid.");
    }
    mismatch |= expectedByte ^ actualByte;
  }
  return mismatch === 0;
}
