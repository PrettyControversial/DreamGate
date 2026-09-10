import { Capacitor, registerPlugin } from "@capacitor/core";

interface DreamGateSecureStoragePlugin {
  getClientToken(): Promise<{ value: string | null }>;
  setClientToken(options: { value: string }): Promise<void>;
}

const secureStorage = registerPlugin<DreamGateSecureStoragePlugin>(
  "DreamGateSecureStorage",
);

export async function readSecureClerkClientToken(): Promise<string> {
  if (!Capacitor.isNativePlatform()) return "";

  const result = await secureStorage.getClientToken();
  return result.value ?? "";
}

export async function persistSecureClerkClientToken(
  value: string,
): Promise<void> {
  if (!Capacitor.isNativePlatform() || !value) return;
  await secureStorage.setClientToken({ value });
}
