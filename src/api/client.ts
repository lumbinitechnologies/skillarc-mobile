import { createClient } from "./generated/client";

/** Keane supplies the matching API origin and verified access-token provider. */
export function createMobileApiClient(
  baseUrl: string,
  accessToken: () => Promise<string | null>,
) {
  if (!/^https:\/\/[^/]+/.test(baseUrl))
    throw new Error("Mobile API requires an HTTPS origin");
  return createClient({
    baseUrl: baseUrl.replace(/\/$/, ""),
    auth: async () => (await accessToken()) || undefined,
  });
}
