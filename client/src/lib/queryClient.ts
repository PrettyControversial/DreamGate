import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";

// Native builds run from capacitor://localhost, so relative API requests would
// otherwise be sent to the on-device WebView instead of the deployed backend.
// Keep the environment variable as an override for staging or future domains.
export const DEFAULT_NATIVE_API_BASE_URL = "https://dream-gate.replit.app";

const rawConfiguredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
let apiBaseConfigurationError = false;
let configuredApiBaseUrl = "";

if (rawConfiguredApiBaseUrl) {
  try {
    const parsed = new URL(rawConfiguredApiBaseUrl);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.host) {
      throw new Error("Unsupported API URL");
    }
    parsed.hash = "";
    parsed.search = "";
    configuredApiBaseUrl = parsed.toString().replace(/\/+$/, "");
  } catch {
    apiBaseConfigurationError = true;
  }
}
const isNativePlatform = Capacitor.isNativePlatform();
export const API_BASE_URL = isNativePlatform
  ? apiBaseConfigurationError
    ? ""
    : configuredApiBaseUrl || DEFAULT_NATIVE_API_BASE_URL
  : window.location.origin.replace(/\/+$/, "");
type AuthTokenProvider = () => Promise<string | null>;
let authTokenProvider: AuthTokenProvider | null = null;
export function setAuthTokenProvider(provider: AuthTokenProvider | null) {
  authTokenProvider = provider;
}
export function getApiUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  if ((isNativePlatform && apiBaseConfigurationError) || !API_BASE_URL) {
    throw new Error(
      "DreamGate could not connect securely. Please close and reopen the app, then try again.",
    );
  }
  const path = url.startsWith("/") ? url : `/${url}`;
  return new URL(path, `${API_BASE_URL}/`).toString();
}
export async function getApiRequestHeaders(
  data?: unknown,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const token = await authTokenProvider?.();
  if (data !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let headers: Record<string, string>;
  try {
    headers = await getApiRequestHeaders(data);
  } catch (error) {
    console.error("Unable to prepare an authenticated API request:", error);
    throw new Error(
      "Your secure session could not be verified. Please sign in again.",
    );
  }

  let res: Response;
  try {
    res = await fetch(getApiUrl(url), {
      method,
      headers,
      body: data !== undefined ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  } catch (error) {
    console.error("DreamGate API request failed before receiving a response:", error);
    throw new Error(
      "DreamGate could not connect securely. Please try again in a moment.",
    );
  }
  await throwIfResNotOk(res);
  return res;
}
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey
      .filter(
        (segment): segment is string | number =>
          typeof segment === "string" || typeof segment === "number",
      )
      .join("/");
    const res = await fetch(getApiUrl(path), {
      headers: await getApiRequestHeaders(),
      credentials: "include",
    });
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }
    await throwIfResNotOk(res);
    return await res.json();
  };
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
