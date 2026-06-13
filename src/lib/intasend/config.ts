export function getIntaSendConfig() {
  const publicKey = process.env.INTASEND_PUBLIC_KEY;
  const secretKey = process.env.INTASEND_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const webhookChallenge = process.env.INTASEND_WEBHOOK_CHALLENGE;
  const testEnv = process.env.INTASEND_TEST !== "false";

  if (!publicKey) {
    throw new Error("Missing INTASEND_PUBLIC_KEY");
  }

  if (!secretKey) {
    throw new Error("Missing INTASEND_SECRET_KEY");
  }

  if (!appUrl) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL");
  }

  return {
    publicKey,
    secretKey,
    appUrl: appUrl.replace(/\/$/, ""),
    webhookChallenge,
    testEnv,
    baseUrl: "https://api.intasend.com",
  };
}
