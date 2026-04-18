import * as Crypto from 'expo-crypto';

export async function hashPin(pin: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin
  );
}

export async function verifyPin(input: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPin(input);
  return inputHash === storedHash;
}
