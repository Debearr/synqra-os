import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();
const secretCache = new Map<string, string>();

type AccessSecretVersionFn = (request: {
  name: string;
}) => Promise<
  Array<{
    payload?: {
      data?: Uint8Array | Buffer | null;
    };
  }>
>;

export async function getSecretValue(secretId: string, version = "latest"): Promise<string> {
  const cacheKey = `${secretId}:${version}`;
  if (secretCache.has(cacheKey)) {
    return secretCache.get(cacheKey)!;
  }

  const projectId = process.env.GCP_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error("GCP_PROJECT_ID is required to read secrets");
  }

  const name = `projects/${projectId}/secrets/${secretId}/versions/${version}`;
  const accessSecretVersion = client.accessSecretVersion as unknown as AccessSecretVersionFn;
  const [response] = await accessSecretVersion({ name });
  const value = response.payload?.data?.toString("utf8");
  if (!value) {
    throw new Error(`Secret ${secretId} returned empty payload`);
  }

  secretCache.set(cacheKey, value);
  return value;
}
