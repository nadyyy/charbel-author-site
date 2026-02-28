const MIN_COOKIE_SECRET_LENGTH = 32;

const readEnv = (key: string) => (process.env[key] ?? "").trim();

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export const ENV = Object.freeze({
  appId: readEnv("VITE_APP_ID"),
  cookieSecret: readEnv("JWT_SECRET"),
  databaseUrl: readEnv("DATABASE_URL"),
  oAuthServerUrl: readEnv("OAUTH_SERVER_URL"),
  ownerOpenId: readEnv("OWNER_OPEN_ID"),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: readEnv("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: readEnv("BUILT_IN_FORGE_API_KEY"),
});

export function validateServerEnv() {
  const errors: string[] = [];
  const warnings: string[] = [];

  const addProdError = (condition: boolean, message: string) => {
    if (ENV.isProduction && !condition) errors.push(message);
    if (!ENV.isProduction && !condition) warnings.push(message);
  };

  addProdError(Boolean(ENV.appId), "VITE_APP_ID is required.");
  addProdError(
    ENV.cookieSecret.length >= MIN_COOKIE_SECRET_LENGTH,
    `JWT_SECRET must be at least ${MIN_COOKIE_SECRET_LENGTH} characters.`
  );
  addProdError(Boolean(ENV.oAuthServerUrl), "OAUTH_SERVER_URL is required.");
  addProdError(Boolean(ENV.databaseUrl), "DATABASE_URL is required.");

  if (ENV.oAuthServerUrl && ENV.isProduction && !isHttpsUrl(ENV.oAuthServerUrl)) {
    errors.push("OAUTH_SERVER_URL must use HTTPS in production.");
  }

  if (ENV.forgeApiUrl && ENV.isProduction && !isHttpsUrl(ENV.forgeApiUrl)) {
    errors.push("BUILT_IN_FORGE_API_URL must use HTTPS in production.");
  }

  if (!ENV.ownerOpenId) {
    warnings.push(
      "OWNER_OPEN_ID is not set. No account will be auto-promoted to admin."
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  } as const;
}
