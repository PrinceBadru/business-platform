import { Google, MicrosoftEntraId } from "arctic";

const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Ensure env variables exist (fallback to dummy strings to prevent crashes on startup without them)
const googleClientId = process.env.GOOGLE_CLIENT_ID || "dummy_google_id";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "dummy_google_secret";

const microsoftClientId = process.env.MICROSOFT_CLIENT_ID || "dummy_microsoft_id";
const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET || "dummy_microsoft_secret";
const microsoftTenant = process.env.MICROSOFT_TENANT_ID || "common";

export const google = new Google(googleClientId, googleClientSecret, `${host}/api/auth/google/callback`);

export const microsoft = new MicrosoftEntraId(microsoftTenant, microsoftClientId, microsoftClientSecret, `${host}/api/auth/microsoft/callback`);
